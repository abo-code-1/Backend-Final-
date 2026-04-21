# Shanyraq — Architecture & System Design

**Document version:** 1.0 (2026-04-14)
**Pages:** 2–3 equivalent

---

## 1. Tech Stack

| Layer | Choice | Version / Notes | Justification |
|---|---|---|---|
| Language | **TypeScript** | 5.4, strict mode | Type safety across the whole request lifecycle (Zod-inferred types flow into Prisma models and route handlers). |
| Runtime | **Node.js** | 20 LTS | Event-loop concurrency model fits Shanyraq's I/O-bound workload (search queries, S3 uploads, notifications). No CPU-heavy paths on the hot path; the single-threaded event loop avoids the lock complexity of Python's GIL-based async. Heavy work (image EXIF stripping, compat-score batch recompute) is offloaded to a separate **BullMQ** worker process. |
| Framework | **Express.js** | 4.19 | Lab standard. Minimal surface, mature middleware ecosystem (helmet, cors, pino-http, express-rate-limit). Deliberate choice over Fastify because the course targeted Express. |
| ORM | **Prisma** | 5.x | Course-mandated ORM (Lab 5). Type-safe query builder; generated client eliminates runtime SQL typos. `$transaction` API covers the serializable isolation needs in §4.4–4.6 of the features spec. Raw SQL escape hatch (`$queryRaw`, `$executeRaw`) is used **only** for features Prisma doesn't expose: `SELECT FOR UPDATE`, `tsvector` column updates, recursive CTEs, triggers, and partial UNIQUE indexes (added via migration `ALTER`). |
| Database | **PostgreSQL 15** | `pg_trgm`, `btree_gist`, **PostGIS** 3.3 extensions | ACID is non-negotiable for capacity updates (R7, R9) and audit log integrity (R13). PostGIS supports map-viewport search. `pg_trgm` + `tsvector` support Russian full-text search on titles/descriptions. |
| Cache / queue | **Redis** | 7 | Four use-cases: (1) search-result cache (60s TTL, tag-invalidation on city); (2) compatibility-score cache (10 min TTL); (3) token-bucket rate limiting (`rate-limit-redis`); (4) **BullMQ** job queue for EXIF strip, notification fan-out, search-index recompute. |
| Object storage | **S3-compatible** (AWS S3 or MinIO in dev) | via `@aws-sdk/client-s3` | Binary images do not belong in Postgres. Server issues presigned PUT URLs so the Node process never streams image bytes. |
| Validation | **Zod** | 3.x | Runtime schema validation at the route layer. Schemas are co-located with the route and inferred into TS types. Prisma models are the storage contract; Zod schemas are the network contract; the two are distinct by design. |
| Auth | **jsonwebtoken** + **argon2** | — | JWT access+refresh tokens; argon2id for password hashing (m=64 MiB, t=3, p=1). Key rotation via `kid` header. |
| Logging | **pino** + **pino-http** | — | Structured JSON logs, low overhead. `requestId` correlation id set by a middleware and attached to every log line. |
| Metrics | **prom-client** | — | `/metrics` endpoint scraped by Prometheus. Histograms per route + Prisma query timings via event hooks. |
| Migrations | **Prisma Migrate** | — | See §4 below. |
| Testing | **Vitest** + **Supertest** | — | Unit + integration. `testcontainers` for ephemeral Postgres instances in CI — no SQLite-in-memory shim (keeps SQL dialect identical to prod). |
| Lint / format | **ESLint** (typescript-eslint) + **Prettier** | — | Enforced in pre-commit + CI. |
| Deployment | Docker image → any orchestrator | — | Out of scope for this document. |

### Framework rationale in one sentence

> **Express on Node fits Shanyraq because the dominant work is I/O (database reads, Redis hits, S3 uploads, SMTP). CPU-bound outliers are isolated into BullMQ workers so a single slow image resize never blocks the API event loop.**

---

## 2. High-Level Component Map

```
┌──────────────┐      ┌───────────────────────────────────┐      ┌──────────────┐
│  React SPA   │─HTTP→│     Express API (stateless)       │──────│  PostgreSQL  │
│  (frontend)  │      │   routes → controllers → services │ SQL  │     15       │
└──────────────┘      │           ↓ Prisma Client         │──────│  + PostGIS   │
                      │     middleware: auth, rate-       │      └──────────────┘
                      │     limit, validate, error-       │              ▲
                      │     handler, requestId            │   pub/sub    │ reads
                      └──────────────┬────────────────────┘              │
                                     │                                   │
                                     ▼                                   │
                              ┌──────────────┐                           │
                              │    Redis     │◀─────rate limit, cache,   │
                              │   (cache+    │       compat score,       │
                              │    queue)    │       search cache        │
                              └──────┬───────┘                           │
                                     │ BullMQ                            │
                                     ▼                                   │
                              ┌──────────────┐                           │
                              │ Worker proc  │───EXIF strip, notify,─────┘
                              │ (same image, │   search-index rebuild,
                              │  diff CMD)   │   nightly maintenance
                              └──────┬───────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │   S3 / SMTP  │
                              └──────────────┘
```

Two processes, one image: API (`node src/server.ts`) and worker (`node src/worker.ts`). Both share the Prisma client through `src/config/database.ts`.

---

## 3. Folder Structure

See `project-structure.txt` for the exact tree with per-folder comments. Rationale summary:

- **`src/routes/`** holds HTTP definitions only — one file per resource. Each router is mounted in `src/app.ts`.
- **`src/controllers/`** holds the HTTP adapter. They extract data from the request, hand off to a service, and serialise the result. No business logic.
- **`src/services/`** holds the business logic. Services depend on the Prisma client and on other services — never on `req`/`res`. This makes them trivially testable.
- **`src/repositories/`** is a thin wrapper around Prisma only for queries that need raw SQL (FOR UPDATE, recursive CTEs, tsvector). Type-safe Prisma calls live directly in services to avoid a useless indirection layer.
- **`src/middleware/`** is cross-cutting: `auth`, `rbac`, `rateLimit`, `validate`, `errorHandler`, `requestId`, `idempotency`.
- **`src/schemas/`** holds Zod schemas, split by resource. Route files import schema → `validate(schema)` middleware attaches the parsed body/query to `req.valid`.
- **`src/jobs/`** holds BullMQ producers and consumers. Consumers run in `src/worker.ts`.
- **`src/lib/`** is framework-agnostic utilities (crypto helpers, cursor encode/decode, compat-score calculator).
- **`prisma/schema.prisma`** is the source of truth for the data layer; migrations are generated from it.
- **`tests/`** mirrors `src/` for unit tests; integration tests sit alongside route files under `__tests__/`.

Justification for this layout: **testability and a clean dependency graph.** Routes depend on middleware + controllers; controllers on services; services on repositories or Prisma directly; repositories on Prisma. Nothing in `services/` imports from `routes/` or `controllers/`. This cleanly separates HTTP concerns from business logic and makes the business-logic tier reusable by the worker process (notifications, scheduled jobs).

---

## 4. Migration Strategy (Prisma Migrate)

### Workflow

1. Edit `prisma/schema.prisma`.
2. Run `npx prisma migrate dev --name <short-slug>` in the dev environment. Prisma generates a timestamped SQL file under `prisma/migrations/`, applies it to the dev DB, and regenerates the client.
3. **Inspect the generated SQL.** For anything Prisma cannot express (partial UNIQUE indexes, `CHECK` constraints, triggers, `tsvector` columns, PostGIS columns, `SELECT ... FOR UPDATE` helper functions), hand-edit the migration file BEFORE committing. The Prisma team's own guidance.
4. Commit `schema.prisma` **and** the migration folder together.
5. In CI/CD, `prisma migrate deploy` runs against staging → prod. Deploy never runs `migrate dev`.

### Data-loss avoidance

- **Additive changes only in tight windows.** New columns are added `NULL`-able, backfilled by a separate migration script (or SQL `UPDATE`), then made `NOT NULL` in a third migration.
- **No `DROP TABLE` / `DROP COLUMN` in the same release that stops writing to them.** Pattern: release N — stop writing; release N+1 — drop. Prisma will warn on destructive changes and require explicit confirmation; CI fails if an unreviewed destructive migration lands.
- **Migrations are run before the new API image is promoted.** Application code must tolerate the "schema is ahead of code" interim state for the duration of a rolling deploy. Similarly, destructive cleanups happen after the old image is fully drained.
- **Backups before every prod migrate.** `pg_dump` snapshot is uploaded to object storage and retained 30 days. A rollback runbook lives in `docs/ops/rollback.md` (not in this blueprint).
- **Shadow database parity.** `prisma migrate dev` uses a shadow database so drift between declared schema and migration history is caught locally, before PR.
- **One-off data repairs** go through a `scripts/data-migrations/<date>-<name>.ts` Prisma script, reviewed and run manually. They are NOT put into `prisma/migrations/` — that folder is schema-only.

### Extensions / triggers

Prisma 5 cannot declare Postgres extensions, triggers, partial indexes, or PostGIS columns. These are added via `prisma migrate dev --create-only` (empty SQL migration) and hand-written SQL, for example:

```sql
-- prisma/migrations/20260414120000_audit_trigger/migration.sql
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Partial UNIQUE index: one pending application per (user, apartment)
CREATE UNIQUE INDEX uq_app_pending_user_apt
  ON "Application"("userId", "apartmentId")
  WHERE status = 'pending';

-- Append-only audit log
CREATE OR REPLACE FUNCTION deny_non_insert() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog is append-only';
END $$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_append_only
  BEFORE UPDATE OR DELETE OR TRUNCATE ON "AuditLog"
  FOR EACH STATEMENT EXECUTE FUNCTION deny_non_insert();
```

---

## 5. Environment Strategy

Secrets and configuration live in environment variables. **Never** in the repo. No `.env` file is committed; only `.env.example`.

### Validation — fail fast at startup

A Zod schema in `src/config/env.ts` validates `process.env` at boot. If any required variable is missing or malformed, the process exits with code 78 (`EX_CONFIG`) and prints the exact offending keys. This runs **before** the HTTP server binds its port — the container never reports "healthy" when misconfigured.

```ts
// src/config/env.ts (conceptual — no runtime here)
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_KID: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  ARGON2_MEMORY_KIB: z.coerce.number().int().min(19456).default(65536),
  S3_BUCKET: z.string(),
  S3_REGION: z.string(),
  S3_ENDPOINT: z.string().url().optional(),  // MinIO in dev
  SMTP_URL: z.string().url(),
  SENTRY_DSN: z.string().url().optional(),
  RATE_LIMIT_TRUST_PROXY: z.coerce.boolean().default(false),
});

export const env = EnvSchema.parse(process.env);  // throws on boot if invalid
```

### `.env.example` template

```ini
# ---- core ----
NODE_ENV=development
PORT=3000

# ---- database ----
DATABASE_URL="postgresql://shanyraq:shanyraq@localhost:5432/shanyraq?schema=public"

# ---- redis ----
REDIS_URL="redis://localhost:6379"

# ---- auth ----
JWT_ACCESS_SECRET=change-me-32-bytes-minimum-redacted-xxxxxxx
JWT_ACCESS_KID=v1
JWT_REFRESH_SECRET=change-me-32-bytes-minimum-redacted-yyyyyyy
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
ARGON2_MEMORY_KIB=65536

# ---- storage ----
S3_BUCKET=shanyraq-media
S3_REGION=eu-central-1
# S3_ENDPOINT=http://localhost:9000   # uncomment for MinIO

# ---- mail ----
SMTP_URL=smtp://user:pass@smtp.mailtrap.io:587

# ---- ops ----
SENTRY_DSN=
RATE_LIMIT_TRUST_PROXY=false
```

### Layering

- `.env.example` — committed. Shape only, no real secrets. Drift-prevention: CI fails if a variable used in code is not listed here.
- `.env` — local dev only, git-ignored.
- `.env.test` — used by Vitest against a testcontainers-managed Postgres.
- In staging / prod, env is injected by the orchestrator (Docker Compose secrets, Kubernetes Secret, etc.). **The container image never bakes secrets.**
- Secret rotation: see `security-analysis.docx` §Spoofing — `JWT_ACCESS_KID` governs the active key; old `kid` values remain verifiable for a 1h grace window via a KID→secret map loaded at boot.

---

## 6. Request Lifecycle (single request walkthrough)

For illustration, `POST /applications` with a valid JWT:

1. `helmet()` sets security headers.
2. `cors()` honours the allow-list.
3. `requestId` middleware mints a UUID and attaches it to `req` and to the `pino` child logger.
4. `pino-http` logs the incoming request.
5. `express.json({ limit: '1mb' })` parses the body.
6. `rateLimit` middleware checks Redis token bucket for the caller.
7. `auth` middleware verifies the JWT (checks `kid`, signature, `exp`, blacklist via `jti`).
8. `rbac('TENANT')` asserts the caller's role.
9. `validate(CreateApplicationSchema)` runs Zod; attaches parsed body to `req.valid`.
10. `idempotency` middleware looks up the `Idempotency-Key` header against the `idempotency_keys` table; replays the prior response if found.
11. Controller calls `applicationService.create(userId, req.valid)`.
12. Service opens `prisma.$transaction(..., { isolationLevel: 'Serializable' })`.
13. On success, controller returns `201 Created` with the new row. On thrown domain error, `errorHandler` maps it to the right HTTP code and a structured JSON envelope (see `openapi.yaml` `Error` schema).
14. `pino-http` logs the response.

---

## 7. Why this architecture (in three bullets)

- **Separation of concerns.** Routes/controllers handle HTTP. Services own business rules. Repositories own SQL escape hatches. Any one of these tiers can change without forcing the others to.
- **Testability.** Services do not import `express`. They are pure functions of `(prismaClient, input) → output` and are covered by Vitest unit tests without spinning up an HTTP server. Integration tests hit a real testcontainers Postgres — no mocks that lie.
- **Operational safety.** Every money- or capacity-moving operation runs in a serializable Prisma transaction (R15). Rate limits, audit logs, idempotency keys, and structured logs with `requestId` make the system observable and abuse-resistant from day one, not as an afterthought.
