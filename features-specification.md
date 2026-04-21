# Shanyraq — Features Specification

**Project:** Shanyraq — Kazakhstan apartment + roommate matching platform
**Track:** BYOI (Bring Your Own Idea) — group-application real-estate platform
**Stack:** Express.js + Prisma + PostgreSQL 15 + Redis
**Author:** Temirlan Nurlanov
**Document version:** 1.0 (2026-04-14)

---

## 1. Product Overview

Shanyraq lets Kazakhstani renters find apartments **and** compatible roommates in one flow. The differentiator versus Krisha/OLX is the **group application**: several users bind themselves into a Group, align their Anketa (lifestyle questionnaire), and apply together so the Owner receives a single consolidated submission instead of N unrelated requests.

- Primary currency: Kazakhstani tenge (₸ / KZT). Money stored as `Int` (whole KZT — no sub-unit exists for this product).
- Primary UI languages at launch: ru-KZ, kk-KZ. Data layer is language-agnostic.

---

## 2. User Roles (Actors)

### 2.1 Guest (unauthenticated)
Anyone hitting the public site. Read-only; sees listing cards but not contact info or owner-facing fields. Address is blurred to street level.

### 2.2 Tenant (`role = TENANT`)
Default role assigned at registration. Has a Profile and optionally an Anketa. Can search, apply, join/lead a Group.

### 2.3 Owner (`role = OWNER`)
A Tenant automatically gains the `OWNER` role when they publish their first listing. **Roles are additive** — the same account can search as a tenant and list as an owner. Stored as `User.roles String[]` in Prisma.

### 2.4 Group Leader (sub-role, scoped to a Group)
Tenant who created the Group. Can invite members, remove members, edit the group, and trigger the final submission once all members have confirmed. Leadership is transferable; if the leader leaves, the oldest remaining member auto-inherits (deterministic; no election).

### 2.5 Moderator (`role = MODERATOR`)
Platform staff. Can hide listings reported as fraudulent, suspend accounts, read the audit log, force-resolve stuck applications.

### 2.6 Admin (`role = ADMIN`)
Superset of `MODERATOR`. Can grant/revoke roles, read any row, run maintenance jobs, rotate the JWT signing key.

> **Authorization model.** `User.roles String[]` holds the granted roles. Express middleware `requireRole(...)` performs RBAC, plus row-level ownership checks for resource routes (see `security-analysis.docx` §Elevation).

---

## 3. Feature List by Role

### 3.1 Guest
- Browse public listing feed (cursor-paginated).
- View a single listing page (photos, price, amenities, address blurred).
- Filter by city, district, price range, rooms, amenities.
- Submit contact form on landing page.
- Register / log in.

### 3.2 Tenant
*(Inherits Guest, plus:)*
- Fill / edit Anketa (10-field lifestyle questionnaire).
- Save searches and favourite listings.
- Submit a **solo** application to a listing.
- Create a Group and invite up to `maxMembers - 1` other tenants.
- Accept / decline a Group invite.
- Confirm readiness inside a Group (the "sign" step before submission).
- View own applications (statuses: `pending / accepted / rejected / withdrawn`).
- Withdraw a `pending` application.
- See exact address **only** after an application is accepted.
- View compatibility score between self and a target listing.
- Receive notifications (in-app; email via SMTP) for invite received, group status change, application accepted/rejected, saved-search hit.

### 3.3 Group Leader (scoped to one Group)
- Invite a tenant by email or username.
- Revoke a pending invite.
- Remove a member while group has not yet submitted.
- Edit group name / target apartment while `status = forming`.
- Submit the group's application after all members have confirmed.
- Transfer leadership.

### 3.4 Owner
*(Inherits Tenant, plus:)*
- Create a listing through a 4-step wizard (basics → media → amenities → roommate preferences).
- Upload up to 10 photos via S3-compatible storage; EXIF stripped on a BullMQ worker.
- Edit any field of a listing they own except `id`, `ownerId`, `createdAt`.
- Archive / un-archive a listing (soft delete).
- Mark a listing `rented` — auto-rejects all pending applications on it.
- View incoming applications per listing, sorted by compatibility score (desc) and submission date (asc) as tiebreaker.
- Accept or reject an application (solo or group). Accepting a group application auto-rejects all other pending applications on that listing when it fills the remaining capacity.
- Send a standardized template message to an applicant.

### 3.5 Moderator
- Force-hide a listing (`visibility = hidden_by_moderator`).
- Suspend an account (`isSuspended = true`). Existing sessions invalidated on next request.
- Read the `AuditLog` table (read-only).
- Force-reject a stuck application (30+ days `pending`).

### 3.6 Admin
- All Moderator actions.
- Grant / revoke `MODERATOR` role.
- Rotate the active JWT signing key — new `kid` published; old tokens honoured for a 1h grace window.
- Run the nightly maintenance job manually.

---

## 4. Business Workflows

### 4.1 Registration & Onboarding

1. `POST /auth/register` with `{ email, password, fullName, phone }`.
2. Server validates (Zod schema):
   - email: RFC 5321, not already used
   - password: ≥ 10 chars, mixed case, at least one digit
   - phone: `^\+7\d{10}$`
   - fullName: 2–120 chars
3. Password hashed with **argon2id** (`m=64 MiB, t=3, p=1`) via the `argon2` npm package.
4. Row inserted via Prisma — `User.roles = ['TENANT']`, `isVerified = false`.
5. Verification email sent with a signed JWT (24h TTL). Account is usable immediately but `isVerified = false` restricts the user to 1 listing and 3 applications until verified.
6. `POST /auth/login` returns `{ accessToken (15 min), refreshToken (30 d) }`. The refresh token is opaque; only its SHA-256 hash is stored in `RefreshToken`.
7. Tenant is prompted (UI-side) to complete the Anketa. Optional for browsing; required before sending any application.

### 4.2 Create Listing (Owner)

1. `POST /apartments` (JSON) — media uploaded via separate presigned-URL flow.
2. Field validation at the Zod layer:
   - `price >= 20000 && price <= 2000000`
   - `rooms` 1–10, `area` 10–500 m²
   - `1 <= floor <= totalFloors <= 50`
   - `0 <= roommates <= maxRoommates <= 6`
   - `city ∈ cities` reference list
   - `district ∈ districts[city]` (or `Все районы`)
   - `amenities ⊆ amenitiesList`
3. Photos uploaded to S3-compatible storage through server-issued presigned PUT URLs. **EXIF stripped** on a BullMQ (Redis-backed) worker using `sharp`.
4. Row inserted in one Prisma transaction; `ownerId = currentUser`, `status = 'draft'`. Not yet searchable.
5. Owner clicks "Publish" → `PATCH /apartments/{id} { status: 'published' }`. Server recomputes the search vector (`tsvector`) column and invalidates the Redis search cache tagged with the city key.
6. `AuditLog` row written (`action = 'listing.publish'`).

### 4.3 Search (Guest / Tenant)

1. `GET /search?city=Астана&priceMax=150000&rooms=2&sort=-created_at&cursor=<opaque>&limit=20`
2. Server decodes cursor (base64 of `{ lastId, lastSortValue }`).
3. Cache key = SHA-256 of normalised query. On Redis hit, return cached JSON (TTL 60s). On miss run the Prisma query (keyset pagination):
   ```sql
   -- conceptual; in code this is prisma.apartment.findMany with a compound where + take: limit + 1
   SELECT ... FROM "Apartment" a
   WHERE a.status = 'published'
     AND a.city = $1
     AND a.price BETWEEN $2 AND $3
     AND a.rooms = $4
     AND (a."createdAt", a.id) < ($5, $6)
   ORDER BY a."createdAt" DESC, a.id DESC
   LIMIT $7 + 1;
   ```
   The `+ 1` trick reveals whether a next page exists without a `COUNT(*)`.
4. If the user is authenticated and has an Anketa, the service layer computes a compatibility score per row (cached per `(userId, listingId)` pair in Redis, TTL 10 min) and attaches it as `compatibilityScore`.
5. Response envelope: `{ items: [...], nextCursor: "..." | null }`.

### 4.4 Solo Application

1. **Precondition:** user is authenticated, has an Anketa, and the target apartment is `status = 'published'` with `roommates < maxRoommates`.
2. `POST /applications { apartmentId, message? }` (no `groupId`).
3. Server runs a `prisma.$transaction([...], { isolationLevel: 'Serializable' })`:
   1. `SELECT ... FOR UPDATE` on the apartment (via `$queryRaw` inside the Prisma tx for an explicit row lock).
   2. Verify `roommates < maxRoommates` → else abort 409.
   3. Verify no other `pending` application on this apartment by the same user → else 409 `duplicate_application`.
   4. Verify the user is not the owner → else 403.
   5. `INSERT INTO "Application" (status='pending', groupId=NULL, ...)`.
   6. `INSERT INTO "AuditLog"`.
   7. Commit.
4. Owner receives a notification.

### 4.5 Group Application (Shanyraq's core workflow)

#### Phase A — FORMING
- **A1.** Tenant (will become leader) `POST /groups { name, apartmentId, maxMembers }`. Server validates `maxMembers <= (apartment.maxRoommates - apartment.roommates)`. Group created with `status = 'forming'`, `leaderId = me`. Leader auto-inserted into `GroupMember` (`confirmed = false`).
- **A2.** Leader `POST /groups/{id}/members { emailOrUsername }`. Server creates a `GroupInvite` row with a signed token (24h TTL) and queues an email via BullMQ.
- **A3.** Invited user opens the link → `POST /groups/{id}/members/accept { token }`. Server:
  1. Validates token (HMAC) and invite row.
  2. Checks that member has an Anketa; else returns 409 `anketa_required`.
  3. Checks that the user has no other non-withdrawn group application on the same apartment (enforced also by partial UNIQUE index, see `database-schema.docx` R8).
  4. `INSERT INTO "GroupMember" (..., confirmed=false)`.

#### Phase B — CONSENSUS
- **B1.** Every member (including leader) `POST /groups/{id}/members/me/confirm` after reading the listing. `confirmed = true`.
- **B2.** A DB trigger recomputes `Group.allConfirmed` whenever any member's `confirmed` flips. When `allConfirmed && leader clicks "Submit"`, state advances.

#### Phase C — SUBMISSION (atomic)
- **C1.** Leader `POST /groups/{id}/submit`. Serializable transaction:
  1. `SELECT ... FOR UPDATE` on the group.
  2. Assert `status = 'forming' AND allConfirmed = true`.
  3. `SELECT ... FOR UPDATE` on the apartment.
  4. Assert `maxRoommates - roommates >= len(group.members)` — else 409 `insufficient_capacity`.
  5. Assert no member has a conflicting pending application on the same apartment.
  6. `INSERT INTO "Application" (userId=leaderId, groupId=group.id, apartmentId=group.apartmentId, status='pending')`.
  7. `UPDATE "Group" SET status='submitted'`.
  8. Commit. Notifications dispatched **post-commit** only (see §4.6 idempotency note).

#### Phase D — RESOLUTION
- **D1.** Owner accepts → triggers workflow 4.6.
- **D2.** Owner rejects → `Application.status = 'rejected'`, `Group.status = 'rejected'`. Members retain the group row for historical audit but a new group is required to apply elsewhere.

### 4.6 Application Acceptance (Owner action)

1. `PATCH /applications/{id} { status: 'accepted' }`.
2. Serializable transaction:
   1. `SELECT application FOR UPDATE`; verify owner is the requester.
   2. `SELECT apartment FOR UPDATE`.
   3. `cohortSize = 1` (solo) or `len(group.members)`.
   4. Assert `apartment.roommates + cohortSize <= apartment.maxRoommates` → else 409.
   5. `UPDATE "Application" SET status='accepted'`.
   6. `UPDATE "Apartment" SET roommates = roommates + cohortSize`.
   7. If `roommates == maxRoommates`:
      - `UPDATE "Apartment" SET status='rented'`.
      - `UPDATE "Application" SET status='rejected', rejectedReason='apartment_no_longer_available' WHERE apartmentId=... AND status='pending' AND id <> $acceptedId`.
   8. `INSERT INTO "AuditLog"`.
   9. Commit.
3. Exact address is now exposed to accepted applicant(s) via `GET /applications/{id}` (field-level check in the response serializer).

> **Idempotency:** each acceptance request carries an `Idempotency-Key` header; duplicate keys within 24h return the original response without re-running the transaction. Notifications are dispatched via an `outbox` table emptied by a worker, so a network retry cannot produce duplicate emails.

### 4.7 Application Withdrawal

- `POST /applications/{id}/withdraw`. Only allowed while `status = 'pending'`.
- Solo app → `status = 'withdrawn'`.
- Group app → only the group leader may call; group status also set to `withdrawn`. Capacity is unaffected because the app never reached `accepted`.

### 4.8 Compatibility Scoring (read-path)

**Inputs:** listing's owner-declared preferences (subset of AnketaData fields) and the tenant's (or group aggregate) Anketa.

**Formula:** weighted sum normalised to `[0..100]`:

| Signal | Weight |
|---|---|
| schedule match (exact) | 25 |
| cleanliness (match or adjacent) | 20 |
| smoking compatibility (bool) | 15 |
| pets compatibility | 15 |
| noise tolerance | 10 |
| guests frequency | 5 |
| languages overlap (Jaccard) | 10 |

**Group aggregate:** `MIN` across members (weakest link). This prevents one incompatible member being hidden behind three perfect ones.

Cached in Redis with key `compat:{userId|groupId}:{listingId}` (TTL 10 min). Invalidated on Anketa update or listing update.

---

## 5. Constraints & Business Rules

Defence in depth — each invariant is enforced **both** at the DB layer (via Prisma-level constraints, partial indexes, or raw-SQL migrations for triggers) **and** in the service layer.

| # | Rule | Enforcement |
|---|---|---|
| R1 | `price BETWEEN 20000 AND 2000000` | Postgres `CHECK` constraint (raw SQL in a Prisma migration) + Zod |
| R2 | `0 <= roommates <= maxRoommates <= 6` | `CHECK` + Zod |
| R3 | `1 <= floor <= totalFloors <= 50` | `CHECK` + Zod |
| R4 | One `pending` application per `(userId, apartmentId)` | Partial UNIQUE index `uq_app_pending_user_apt` |
| R5 | A user cannot apply to their own apartment | Service layer + trigger cross-checking `Application.userId` vs `Apartment.ownerId` |
| R6 | Anketa required before submitting any application | Service layer, 409 `anketa_required` |
| R7 | A group cannot exceed listing capacity at submission time | Re-checked under `SELECT FOR UPDATE` at Phase C |
| R8 | A user cannot be active in two groups targeting the same apartment | Partial UNIQUE index on `(userId, apartmentId)` where `Group.status IN ('forming','submitted')` |
| R9 | Accepting never re-opens a rented apartment | Trigger forbids `roommates` decrements once `status='rented'` |
| R10 | Archived/rented listings hidden from `/search` but visible to owner & active applicants | Service-layer visibility filter |
| R11 | JWT access = 15 min; refresh = 30 d; rotation mandatory | `refreshToken.usedAt` check; old refresh invalidated on use |
| R12 | No hard deletes; users marked `isSuspended=true`; listings soft-deleted via `status='archived'` | Audit preservation |
| R13 | `AuditLog` is append-only (no `UPDATE`/`DELETE` grants) | Postgres role grants + trigger denying non-INSERT ops |
| R14 | Rate limits (token bucket, Redis) — see table below | `express-rate-limit` + `rate-limit-redis` |
| R15 | Monetary writes wrapped in serializable transactions | Prisma `$transaction` with `isolationLevel: 'Serializable'` |
| R16 | Photos ≤ 10 MB; types `{jpeg,png,webp}`; EXIF stripped; width ≤ 4096 px | Multer / sharp in upload worker |
| R17 | Cursor pagination only on list endpoints | No `OFFSET` — race-prone and O(N) |

### R14 rate-limit table

| Endpoint | Limit | Scope |
|---|---|---|
| `POST /auth/login` | 5 req/min, 10 req/day | per IP / per email |
| `POST /auth/register` | 3 req/hour | per IP |
| `POST /applications` | 10/hour | per user |
| `GET /search` | 60/min | per IP |
| all other authenticated | 120/min | per user |

Exceeded → `429` with `Retry-After` header.

---

## 6. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NF1 | Availability: 99.5% monthly (single-region). Maintenance windows announced 48h ahead. |
| NF2 | P95 latency: `/search` ≤ 300 ms; single-resource `GET` ≤ 120 ms. |
| NF3 | Security: argon2id, TLS 1.2+, no secrets in repo. |
| NF4 | Observability: structured JSON logs (`pino`) with `requestId`; Prometheus metrics (`prom-client`); slow-query log for > 100 ms. |
| NF5 | Localisation: message codes (en, ru, kk) resolved at the edge. |
| NF6 | Accessibility (frontend): WCAG 2.1 AA (frontend concern, referenced here). |
| NF7 | Data retention: `AuditLog` kept 7 years; soft-deleted listings purged after 2 years. |

---

## 7. Out of Scope (v1)

- In-app chat / messaging (replaced by template-based notifications).
- Payments / rent collection (off-platform).
- Multi-tenancy across franchises.
- Native mobile apps (responsive web only).
- Kazakh-language full-text search (Russian `tsvector` only at launch).
- Recommender ML model (rule-based compatibility only).
