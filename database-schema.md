# Shanyraq — Database Schema

**Document version:** 1.0 (2026-04-14)
**ORM:** Prisma 5 (Node/Express lab track)
**DB:** PostgreSQL 15 with PostGIS 3.3, `pg_trgm`, `btree_gist` extensions

---

## 1. Entity-Relationship Diagram

```
                                 ┌──────────────┐
                                 │    User      │
                                 │──────────────│
                                 │ id (PK)      │
                                 │ email U      │
                                 │ passwordHash │
                                 │ roles[]      │
                                 │ isVerified   │
                                 │ isSuspended  │
                                 └──┬───────┬───┘
                     owns 1:N       │       │ fills 1:1
                                    │       ▼
                                    │   ┌──────────┐
                                    │   │  Anketa  │
                                    │   │──────────│
                                    │   │ userId PK│
                                    │   │ schedule │
                                    │   │  ...     │
                                    │   └──────────┘
                                    ▼
                            ┌──────────────┐           ┌────────────────┐
                            │  Apartment   │1─── N ────│ ApartmentPhoto │
                            │──────────────│           └────────────────┘
                            │ id (PK)      │
                            │ ownerId FK   │◀───────────────┐
                            │ title        │                │
                            │ price        │                │ apartmentId FK
                            │ geom (PostGIS│                │
                            │    POINT)    │                │
                            │ searchVec    │         ┌──────┴───────┐
                            │ status       │         │    Group     │
                            │ roommates    │         │──────────────│
                            │ maxRoommates │         │ id (PK)      │
                            └──────┬───────┘         │ apartmentId F│
                                   │                 │ leaderId FK  │
                                   │apartmentId FK   │ status       │
                                   │                 │ allConfirmed │
                                   ▼                 └──────┬───────┘
                            ┌──────────────┐                │
                            │ Application  │                │ 1:N
                            │──────────────│                ▼
                            │ id (PK)      │         ┌──────────────┐
                            │ userId FK    │         │ GroupMember  │
                            │ apartmentId F│         │──────────────│
                            │ groupId FK?  │──N:1────│ groupId FK   │
                            │ status       │         │ userId FK    │
                            │ createdAt    │         │ confirmed    │
                            └──────────────┘         │ (PK compound)│
                                                     └──────────────┘

       ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
       │ GroupInvite  │    │ RefreshToken │    │  AuditLog    │    │IdempotencyKey│
       │──────────────│    │──────────────│    │──────────────│    │──────────────│
       │ id (PK)      │    │ id (PK)      │    │ id (PK)      │    │ key (PK)     │
       │ groupId FK   │    │ userId FK    │    │ actorId FK?  │    │ userId FK    │
       │ email        │    │ tokenHash U  │    │ action       │    │ method       │
       │ tokenHash U  │    │ expiresAt    │    │ targetType   │    │ path         │
       │ expiresAt    │    │ usedAt       │    │ targetId     │    │ responseBody │
       └──────────────┘    └──────────────┘    │ diff (jsonb) │    │ expiresAt    │
                                               │ createdAt    │    └──────────────┘
                                               └──────────────┘
```

**Cardinalities.**

| From | To | Cardinality | Notes |
|---|---|---|---|
| User | Apartment | 1:N | `Apartment.ownerId → User.id`, `ON DELETE RESTRICT` — users are never hard-deleted. |
| User | Anketa | 1:1 | `Anketa.userId` is both PK and FK. |
| User | Application | 1:N | Submitter side. |
| Apartment | Application | 1:N | Target side. |
| Group | Application | 1:1 | A group submits at most one application (guarded by partial UNIQUE index). |
| Apartment | Group | 1:N | Several forming groups can target the same apartment; only one active per user (R8). |
| Group | GroupMember | 1:N | Compound PK `(groupId, userId)`. |
| User | GroupMember | 1:N | A user can belong to several groups targeting different apartments. |
| Apartment | ApartmentPhoto | 1:N | Cascading delete on apartment archive. |
| User | RefreshToken | 1:N | Opaque, hashed; rotated on use. |
| User | AuditLog | 1:N | As actor; append-only. |

---

## 2. Prisma Schema

> Full, ready-to-run `schema.prisma`. Post-migration SQL (partial indexes, triggers, PostGIS, tsvector) is in §3.

```prisma
// prisma/schema.prisma

generator client {
  provider      = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [postgis, pg_trgm, btree_gist]
}

// ============================================================
// Enums
// ============================================================

enum Role {
  TENANT
  OWNER_BADGE       // optional curated badge (not a gate)
  MODERATOR
  ADMIN
}

enum ListingStatus {
  draft
  published
  archived
  rented
  hidden_by_moderator
}

enum ApplicationStatus {
  pending
  accepted
  rejected
  withdrawn
}

enum RejectedReason {
  owner_declined
  apartment_no_longer_available
  moderator_force_close
  applicant_withdrew            // used when withdrawn from a parent group
}

enum GroupStatus {
  forming
  submitted
  accepted
  rejected
  withdrawn
}

// ============================================================
// User + Anketa
// ============================================================

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  username      String?  @unique
  passwordHash  String
  fullName      String
  phone         String
  roles         Role[]   @default([TENANT])
  isVerified    Boolean  @default(false)
  isSuspended   Boolean  @default(false)
  city          String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  anketa        Anketa?
  apartments    Apartment[]     @relation("OwnedApartments")
  applications  Application[]
  ledGroups     Group[]         @relation("GroupLeader")
  memberships   GroupMember[]
  refreshTokens RefreshToken[]
  auditLogs     AuditLog[]

  @@index([email])
  @@index([isSuspended])
  @@index([createdAt])
}

model Anketa {
  userId          String  @id
  user            User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  schedule        String  // "Ночной (работаю по ночам)" | ...
  cleanliness     String  // "Высокий уровень" | "Средний" | "Низкий"
  pets            String  // "Нет" | "Кот" | "Собака" | ...
  smoking         Boolean
  guests          String  // "Редко" | "Иногда" | "Часто"
  noiseTolerance  String  // "Низкая" | "Средняя" | "Высокая"
  hobbies         String
  languages       String  // comma-separated; parsed in service for Jaccard
  about           String
  budgetMin       Int     // KZT, inclusive
  budgetMax       Int     // KZT, inclusive
  updatedAt       DateTime @updatedAt

  @@index([schedule])
  @@index([cleanliness])
}

// ============================================================
// Apartment
// ============================================================

model Apartment {
  id            String         @id @default(cuid())
  ownerId       String
  owner         User           @relation("OwnedApartments", fields: [ownerId], references: [id], onDelete: Restrict)

  title         String
  description   String
  price         Int            // KZT, monthly rent
  rooms         Int
  area          Int            // square metres, rounded
  floor         Int
  totalFloors   Int
  address       String         // street only, full revealed to accepted applicants
  city          String
  district      String
  latitude      Float
  longitude     Float
  // `geom GEOGRAPHY(Point, 4326)` column added via migration SQL (see §3).

  amenities     String[]       // validated in service against amenitiesList
  status        ListingStatus  @default(draft)
  roommates     Int            @default(0)
  maxRoommates  Int

  // Owner-declared roommate preferences (subset of Anketa fields)
  prefSchedule        String?
  prefCleanliness     String?
  prefSmokingAllowed  Boolean?
  prefPets            String?
  prefNoiseTolerance  String?
  prefGuests          String?
  prefLanguages       String?

  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  photos        ApartmentPhoto[]
  applications  Application[]
  groups        Group[]

  @@index([status, city, price])         // hot index for /search
  @@index([status, createdAt(sort: Desc), id(sort: Desc)])  // keyset pagination
  @@index([ownerId])
  @@index([city, district])
}

model ApartmentPhoto {
  id           String    @id @default(cuid())
  apartmentId  String
  apartment    Apartment @relation(fields: [apartmentId], references: [id], onDelete: Cascade)
  url          String
  ordinal      Int        // 0 = primary
  createdAt    DateTime  @default(now())

  @@unique([apartmentId, ordinal])
  @@index([apartmentId])
}

// ============================================================
// Group + GroupMember + GroupInvite
// ============================================================

model Group {
  id            String       @id @default(cuid())
  name          String
  apartmentId   String
  apartment     Apartment    @relation(fields: [apartmentId], references: [id], onDelete: Restrict)
  leaderId      String
  leader        User         @relation("GroupLeader", fields: [leaderId], references: [id], onDelete: Restrict)
  status        GroupStatus  @default(forming)
  allConfirmed  Boolean      @default(false)
  maxMembers    Int
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  members       GroupMember[]
  invites       GroupInvite[]
  application   Application?

  @@index([apartmentId, status])
  @@index([leaderId])
}

model GroupMember {
  groupId   String
  userId    String
  confirmed Boolean  @default(false)
  joinedAt  DateTime @default(now())

  group     Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user      User  @relation(fields: [userId], references: [id], onDelete: Restrict)

  @@id([groupId, userId])
  @@index([userId])
}

model GroupInvite {
  id         String   @id @default(cuid())
  groupId    String
  group      Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)
  email      String
  tokenHash  String   @unique     // SHA-256 of the emailed token
  expiresAt  DateTime
  acceptedAt DateTime?
  revokedAt  DateTime?
  createdAt  DateTime @default(now())

  @@index([groupId])
  @@index([email])
}

// ============================================================
// Application
// ============================================================

model Application {
  id              String             @id @default(cuid())
  userId          String
  apartmentId     String
  groupId         String?            @unique       // one-app-per-group
  status          ApplicationStatus  @default(pending)
  rejectedReason  RejectedReason?
  message         String?
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  user       User       @relation(fields: [userId], references: [id], onDelete: Restrict)
  apartment  Apartment  @relation(fields: [apartmentId], references: [id], onDelete: Restrict)
  group      Group?     @relation(fields: [groupId], references: [id], onDelete: Restrict)

  @@index([apartmentId, status])
  @@index([userId, status])
  @@index([status, createdAt])
}

// ============================================================
// Auth, audit, infra
// ============================================================

model RefreshToken {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash  String   @unique          // SHA-256 of opaque token
  issuedAt   DateTime @default(now())
  expiresAt  DateTime
  usedAt     DateTime?                 // non-null = rotated
  replacedBy String?                   // id of the successor token

  @@index([userId])
  @@index([expiresAt])
}

model AuditLog {
  id          String   @id @default(cuid())
  actorId     String?  // nullable: system actions (cron) have no actor
  actor       User?    @relation(fields: [actorId], references: [id], onDelete: SetNull)
  action      String   // e.g. "listing.publish", "application.accept"
  targetType  String   // "Apartment" | "Application" | "User" | ...
  targetId    String
  diff        Json?    // before/after patch for debugging
  requestId   String?
  ip          String?
  createdAt   DateTime @default(now())

  @@index([actorId, createdAt])
  @@index([targetType, targetId])
  @@index([createdAt])
}

model IdempotencyKey {
  key           String   @id               // "<userId>:<Idempotency-Key header>"
  userId        String
  method        String
  path          String
  statusCode    Int
  responseBody  Json
  createdAt     DateTime @default(now())
  expiresAt     DateTime

  @@index([expiresAt])
}
```

### Indexes at a glance

| Index | Rationale |
|---|---|
| `Apartment(status, city, price)` | Hot filter combination for `/search`. |
| `Apartment(status, createdAt DESC, id DESC)` | Keyset pagination on the published feed. |
| `Apartment(city, district)` | District drill-down on the filter panel. |
| `Application(apartmentId, status)` | Owner inbox view. |
| `Application(userId, status)` | "My applications" view. |
| `Group(apartmentId, status)` | "Groups on this listing" view for owners. |
| `AuditLog(actorId, createdAt)` | Moderator review of a user's history. |
| `AuditLog(targetType, targetId)` | "Show history of this apartment". |
| `RefreshToken(userId)`, `(expiresAt)` | Session management + nightly purge. |

---

## 3. Raw-SQL Migration Layer

Prisma declares the base schema. The following are added via hand-written migrations (`prisma migrate dev --create-only` + hand-edit) because Prisma has no declarative syntax for them.

```sql
-- prisma/migrations/20260414_000_postgis_and_constraints/migration.sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ========== R1/R2/R3: sanity CHECK constraints ==========
ALTER TABLE "Apartment"
  ADD CONSTRAINT ck_apt_price       CHECK (price BETWEEN 20000 AND 2000000),
  ADD CONSTRAINT ck_apt_rooms       CHECK (rooms BETWEEN 1 AND 10),
  ADD CONSTRAINT ck_apt_area        CHECK (area BETWEEN 10 AND 500),
  ADD CONSTRAINT ck_apt_floor       CHECK (floor >= 1 AND floor <= "totalFloors"),
  ADD CONSTRAINT ck_apt_total_flr   CHECK ("totalFloors" BETWEEN 1 AND 50),
  ADD CONSTRAINT ck_apt_cap         CHECK ("maxRoommates" BETWEEN 1 AND 6
                                        AND roommates >= 0
                                        AND roommates <= "maxRoommates");

ALTER TABLE "Anketa"
  ADD CONSTRAINT ck_anketa_budget  CHECK ("budgetMin" >= 0 AND "budgetMax" >= "budgetMin");

-- ========== R4: one pending application per (user, apartment) ==========
CREATE UNIQUE INDEX uq_app_pending_user_apt
  ON "Application" ("userId", "apartmentId")
  WHERE status = 'pending';

-- ========== R5: cannot apply to own apartment ==========
CREATE OR REPLACE FUNCTION prevent_self_application() RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "Apartment" a
    WHERE a.id = NEW."apartmentId" AND a."ownerId" = NEW."userId"
  ) THEN
    RAISE EXCEPTION 'user % cannot apply to their own apartment', NEW."userId"
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER app_prevent_self
  BEFORE INSERT ON "Application"
  FOR EACH ROW EXECUTE FUNCTION prevent_self_application();

-- ========== R8: at most one active group per (user, apartment) ==========
CREATE UNIQUE INDEX uq_active_group_per_user_apartment
  ON "GroupMember" (
    "userId",
    (SELECT "apartmentId" FROM "Group" g WHERE g.id = "GroupMember"."groupId")
  )
  WHERE EXISTS (
    SELECT 1 FROM "Group" g2
    WHERE g2.id = "GroupMember"."groupId"
      AND g2.status IN ('forming','submitted')
  );
-- (If the above correlated-subquery index is rejected by the target
--  PG version, fall back to a trigger that checks the same invariant.)

-- ========== R9: no "re-opening" a rented apartment ==========
CREATE OR REPLACE FUNCTION forbid_roommate_decrement_when_rented() RETURNS trigger AS $$
BEGIN
  IF OLD.status = 'rented' AND NEW.roommates < OLD.roommates THEN
    RAISE EXCEPTION 'cannot decrement roommates on a rented apartment';
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER apt_rented_lock
  BEFORE UPDATE ON "Apartment"
  FOR EACH ROW EXECUTE FUNCTION forbid_roommate_decrement_when_rented();

-- ========== R13: AuditLog is append-only ==========
CREATE OR REPLACE FUNCTION deny_non_insert() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog is append-only';
END $$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_append_only
  BEFORE UPDATE OR DELETE OR TRUNCATE ON "AuditLog"
  FOR EACH STATEMENT EXECUTE FUNCTION deny_non_insert();

-- ========== PostGIS + tsvector ==========
ALTER TABLE "Apartment"
  ADD COLUMN geom geography(Point, 4326);

UPDATE "Apartment"
   SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography;

CREATE INDEX ix_apartment_geom ON "Apartment" USING GIST (geom);

-- Russian-language full-text search on title + description
ALTER TABLE "Apartment"
  ADD COLUMN search_vec tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('russian', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('russian', coalesce(description,'')), 'B')
  ) STORED;

CREATE INDEX ix_apartment_search_vec ON "Apartment" USING GIN (search_vec);

-- Trigram index for address autocomplete
CREATE INDEX ix_apartment_address_trgm ON "Apartment" USING GIN (address gin_trgm_ops);

-- ========== AuditLog grant hardening (production-only) ==========
-- REVOKE UPDATE, DELETE, TRUNCATE ON "AuditLog" FROM shanyraq_app;
-- GRANT  INSERT, SELECT                     ON "AuditLog" TO   shanyraq_app;
```

---

## 4. Migration Strategy — Summary

Full workflow is documented in `architecture.docx` §4. Quick reference:

1. `prisma migrate dev --name <slug>` locally; review generated SQL.
2. Hand-edit the migration file to add any of the constructs Prisma does not emit (triggers, partial indexes, PostGIS, tsvector, role grants).
3. Commit `schema.prisma` + the migration folder together.
4. `prisma migrate deploy` on staging, then prod. `prisma migrate dev` is **never** used outside local dev.
5. Column drops follow the two-release pattern (stop writing, then drop).
6. `pg_dump` backup retained for 30 days is taken **before** each production migration.
7. Data fixes go through `scripts/data-migrations/*.ts` — separate from schema history.

---

## 5. Pagination — Cursor vs Offset

Shanyraq uses **keyset (cursor) pagination** on every list endpoint.

**Why not `OFFSET`:**

1. **Performance.** `OFFSET N` forces Postgres to scan and discard `N` rows. At page 500 of 20-item pages, that's 10 000 wasted tuples per request. Keyset pagination uses the `(createdAt, id)` index to jump directly to the first row of the next page in `O(log N)`.
2. **Consistency under concurrent inserts.** If a new row lands between page requests, `OFFSET` shifts every subsequent page's contents, causing duplicates or skipped rows. Keyset uses a stable anchor (`lastCreatedAt`, `lastId`) so new rows at the head of the table never perturb the scroll already in progress.
3. **Opaqueness.** The cursor is a base64 JSON blob. Clients cannot "deep-link to page 742" and abuse pagination for scraping.

Cursor format (internal, opaque to clients):

```
cursor = base64url( JSON.stringify({ t: lastCreatedAt_ISO, i: lastId }) )
```

Query shape, in Prisma, for `/search`:

```ts
const items = await prisma.apartment.findMany({
  where: {
    status: 'published',
    city: q.city,
    price: { gte: q.priceMin, lte: q.priceMax },
    rooms: q.rooms,
    ...(cursor && {
      OR: [
        { createdAt: { lt: cursor.t } },
        { createdAt: cursor.t, id: { lt: cursor.i } },
      ],
    }),
  },
  orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  take: q.limit + 1,       // peek
});
const hasNext = items.length > q.limit;
const page = hasNext ? items.slice(0, -1) : items;
```

---

## 6. The Nasty Query

> **Problem:** Rank a tenant's personalised search results by compatibility with each listing's owner-declared preferences, restricted to a radius around a map pin, within a price range, paginated by keyset.

This combines a PostGIS radius filter, multiple integer/string comparisons, a weighted similarity score, and keyset ordering. It is the slowest query in the system and the one most likely to need optimisation.

### SQL

```sql
-- :me       = current user id  (uuid/text)
-- :lat      = viewport pin latitude
-- :lng      = viewport pin longitude
-- :radius   = metres, e.g. 3000
-- :pmin, :pmax, :rooms
-- :cur_t    = cursor createdAt (or +infinity for first page)
-- :cur_id   = cursor id (or '~' for first page)
-- :limit    = 21  (20 + peek)

WITH me_an AS (
  SELECT schedule, cleanliness, pets, smoking, "noiseTolerance",
         guests, languages
  FROM "Anketa"
  WHERE "userId" = :me
)
SELECT  a.id,
        a.title,
        a.price,
        a.rooms,
        a.city,
        a.district,
        a."createdAt",
        ST_Distance(a.geom, ST_MakePoint(:lng, :lat)::geography) AS distance_m,
        /* --- compatibility score: 0..100 --- */
        (
          (CASE WHEN a."prefSchedule"       IS NULL OR a."prefSchedule"       = me_an.schedule        THEN 25 ELSE 0 END) +
          (CASE WHEN a."prefCleanliness"    IS NULL OR a."prefCleanliness"    = me_an.cleanliness     THEN 20 ELSE 0 END) +
          (CASE WHEN a."prefSmokingAllowed" IS NULL OR a."prefSmokingAllowed" = me_an.smoking         THEN 15 ELSE 0 END) +
          (CASE WHEN a."prefPets"           IS NULL OR a."prefPets"           = me_an.pets            THEN 15 ELSE 0 END) +
          (CASE WHEN a."prefNoiseTolerance" IS NULL OR a."prefNoiseTolerance" = me_an."noiseTolerance"THEN 10 ELSE 0 END) +
          (CASE WHEN a."prefGuests"         IS NULL OR a."prefGuests"         = me_an.guests          THEN  5 ELSE 0 END) +
          (
            /* languages Jaccard * 10 */
            10 * (
              cardinality(
                ARRAY(
                  SELECT unnest(string_to_array(a."prefLanguages", ','))
                  INTERSECT
                  SELECT unnest(string_to_array(me_an.languages, ','))
                )
              )::float /
              NULLIF(
                cardinality(
                  ARRAY(
                    SELECT unnest(string_to_array(a."prefLanguages", ','))
                    UNION
                    SELECT unnest(string_to_array(me_an.languages, ','))
                  )
                ), 0
              )
            )
          )
        ) AS compat_score
FROM    "Apartment" a, me_an
WHERE   a.status = 'published'
  AND   a.price BETWEEN :pmin AND :pmax
  AND   (:rooms IS NULL OR a.rooms = :rooms)
  AND   ST_DWithin(a.geom, ST_MakePoint(:lng, :lat)::geography, :radius)
  AND   (a."createdAt", a.id) < (:cur_t, :cur_id)
  AND   a."ownerId" <> :me
  AND   a.roommates < a."maxRoommates"
ORDER BY a."createdAt" DESC, a.id DESC
LIMIT   :limit;
```

### Indexing Strategy

| Index | Purpose |
|---|---|
| `ix_apartment_geom` (GIST on `geom`) | `ST_DWithin` can use this to prune far-away rows before computing the exact distance. |
| `Apartment(status, city, price)` | Cuts the candidate set on the selective dimensions first. |
| `Apartment(status, createdAt DESC, id DESC)` | Enables keyset ordering without a sort. |
| `Anketa(userId)` PK | CTE lookup — one row, `O(1)`. |

### EXPLAIN ANALYZE prediction

On a 100 000-row `Apartment` table where ~2 000 rows match `status='published' AND city='Астана' AND price BETWEEN 80000 AND 180000`:

```
Limit  (cost=0.42..92.11 rows=21 width=160)
  ->  Nested Loop  (cost=0.42..9175.33 rows=2100 width=160)
        ->  Index Scan using "Apartment_status_createdAt_idx" on "Apartment" a
              Index Cond: (status = 'published')
              Filter: (price BETWEEN 80000 AND 180000
                       AND ST_DWithin(geom, '<point>', 3000))
              Rows Removed by Filter: 98000
        ->  Materialize  (cost=0.14..1.15 rows=1 width=200)
              ->  Index Scan using "Anketa_pkey" on "Anketa"
                    Index Cond: ("userId" = :me)
Planning Time: 0.8 ms
Execution Time: ~25–40 ms  (p95)
```

### If the query gets slow

- **Precompute** `compat_score` into a `CompatCache` table when an Anketa changes, indexed by `(userId, apartmentId, updatedAt)`. Cache TTL is already handled in Redis for single-row reads; precompute is for the ranked list.
- **Partial index** on `status = 'published'` only — the other statuses never appear in search.
- **Split the geom predicate earlier** using a bounding-box prefilter (`geom && ST_Expand(...)`) before the `ST_DWithin` call. Postgres planner often does this automatically with GIST, but can be pinned in a CTE for stubborn cases.
- **Materialised view** `mv_published_search` refreshed every 5 min (BullMQ job). Acceptable because the catalogue is not real-time.
