# Changelog

## [Unreleased] — Production hardening + auth subsystem

### Added — Auth & security
- **Refresh tokens** persisted in `refresh_tokens` table (sha-256 hash, expiry,
  revoked flag); rotated on every `/auth/refresh` and revoked on `/auth/logout`.
- **Strong password rules**: 8+ chars, must include uppercase, lowercase, digit,
  and symbol (Zod schema `passwordSchema`). bcrypt cost bumped 10 → 12.
- **Rate limiting** (`express-rate-limit`): 5 attempts/min/IP on `/auth/login`
  and `/auth/register`, returns standardized 429.
- **RBAC enforcement** on protected business endpoints — seekers can apply,
  hosts can accept/reject. Wrong-role gets 403 (not 401).
- **CORS** restricted to a comma-separated allow-list (`CORS_ALLOWED_ORIGINS`);
  refuses to boot with `*` in production.
- **Helmet** security headers + `x-powered-by` disabled.
- **Strict env validation** with Zod — boot is refused if `JWT_SECRET`,
  `JWT_REFRESH_SECRET` are short (< 32 chars) or `DATABASE_URL` is missing.

### Added — Core business transaction
- `PATCH /api/applications/:id/accept` — atomic accept that wraps `SELECT FOR
  UPDATE` on the `listings` row inside `prisma.$transaction`. Concurrent
  accepts on the last room produce one 200 and one 409 (`NO_ROOMS`); over-
  acceptance is impossible. Covered by `tests/integration/atomicity.test.js`.
- `PATCH /api/applications/:id/reject`.

### Added — Documentation
- **OpenAPI 3** spec at `backend/openapi.yaml` covering every implemented
  endpoint with realistic examples and full error response set
  (400/401/403/404/409/422/429/500).
- **Swagger UI** mounted at `GET /api/docs`; raw JSON at `/api/openapi.json`.
- **Cursor-based pagination** on `GET /api/listings` (`?cursor=<id>&limit=…`),
  in addition to the existing page/limit pagination.

### Added — Tests
- Jest + Supertest (ESM mode) suite under `backend/tests/`:
  - `unit/password.test.js` — pure password schema rules
  - `integration/auth.test.js` — register/login/refresh-rotation/logout
  - `integration/rbac.test.js` — 401 for missing/invalid token, 403 for
    wrong-role
  - `integration/atomicity.test.js` — concurrent accept can't double-book
- Test DB is auto-created (`roomie_kz_test`) and the schema pushed in
  `tests/globalSetup.js`.

### Added — Infrastructure / CI-CD
- **Multi-stage Dockerfiles** for backend (`deps → dev → build → runtime`) and
  frontend (`deps → dev → build → nginx runtime`). Local dev uses `target: dev`
  (declared in `docker-compose.yml`); CI builds the runtime stage.
- **`docker-compose.prod.yml`** — pulls images from Docker Hub; `db` + backend
  + nginx-frontend; `restart: unless-stopped`; JSON-file log rotation.
- **Frontend nginx config** — SPA fallback, long-lived caching for hashed
  assets, `/api/` reverse-proxy to the backend service, security headers.
- **Initial Prisma migration baseline** at
  `backend/prisma/migrations/20260427000000_init/`. Production runs
  `prisma migrate deploy` automatically on backend container start.
- **GitHub Actions workflow** (`.github/workflows/deploy.yml`):
  `test → build-and-push (matrix: backend + frontend) → deploy (SSH to EC2)`.
  Buildx registry cache, `runtime` target only, atomic SSH-side env merge so a
  stale `IMAGE_TAG=latest` in the server's `.env` cannot clobber the SHA we
  just built.
- **EC2 bootstrap** at `scripts/setup-ec2.sh` (Ubuntu 24.04, installs Docker,
  creates `/opt/roomie-kz`).
- **Deployment guide** at `README-DEPLOY.md` (rollback procedure included).
- **`.dockerignore`** for both services so secrets, tests, and node_modules
  never end up in the image.

### Changed
- `src/config/env.js` is now the single source of truth — replaces silent
  `process.env.X || "default"` fallbacks with strict Zod validation.
- Standardized error envelope `{ error: { code, message, details? } }` across
  all error paths (Zod → 422, Prisma P2002 → 409, P2025 → 404, generic → 500).
- `bcrypt` cost bumped to 12 in production.
- JWTs split: short-lived access token (`ACCESS_TOKEN_TTL`, default `15m`)
  and long-lived refresh token (`REFRESH_TOKEN_TTL`, default `7d`); refresh
  tokens carry a random `jti` so two issued in the same second never collide
  on `tokenHash`.

### Deviations from blueprint
- The blueprint listed canonical tracks (LeanStock, RescueBite, etc.); Roomie.kz
  is the **BYOI** track, so the "core business transaction" requirement is met
  by the **atomic accept-application flow** above — equivalent to LeanStock's
  inventory-transfer requirement in shape (row-level lock + invariant check).
- Local dev keeps page-based pagination on `/api/listings` for backwards-compat
  with the existing frontend; cursor pagination is additive (`?cursor=…`).
