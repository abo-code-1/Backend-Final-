# Roomie.kz

Roomie.kz is a full-stack roomsharing platform for Kazakhstan (Almaty, Astana, Shymkent), inspired by krisha.kz UX but focused on shared apartments and rooms.

Primary UI language is Russian. Currency is KZT (₸).

## Tech Stack

- Frontend: React (Vite), React Router v6, Redux Toolkit, Axios, `react-toastify`
- Backend: Node.js, Express, PostgreSQL, Prisma ORM, JWT, bcrypt, multer
- Infra: Docker + docker-compose (`db`, `backend`, `frontend`)

## Project Structure

```text
roomie-kz/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── src/
│       ├── index.js
│       ├── config/
│       ├── controllers/
│       ├── routes/
│       ├── middleware/
│       ├── services/
│       ├── validators/
│       └── utils/
└── frontend/
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── api/
        ├── store/
        ├── routes/
        ├── pages/
        ├── components/
        ├── hooks/
        └── styles/
```

## Quick Start

1. Copy environment file:

```bash
cp .env.example .env
```

2. Start everything:

```bash
docker-compose up --build
```

3. Seed demo data (in another terminal):

```bash
docker-compose exec backend npm run prisma:seed
```

## Services

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:5000/api](http://localhost:5000/api)
- Health: [http://localhost:5000/api/health](http://localhost:5000/api/health)

## Auth and Roles

Roles:

- `seeker`
- `host`
- `admin`

Route guards on frontend:

- `ProtectedRoute` -> requires auth, redirects to `/login`
- `RoleRoute` -> requires auth + role list, redirects to `/403`

## Seed Data

`npm run prisma:seed` creates:

- 1 admin
- 3 hosts
- 5 seekers
- 8 listings (each with bills and house rules)
- applications
- favorites
- reviews
- saved searches
- id verification records

## API Endpoints

### Health

- `GET /api/health`

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PATCH /api/auth/switch-role`

### Listings (full CRUD)

- `GET /api/listings`
- `GET /api/listings/:id`
- `GET /api/listings/mine`
- `POST /api/listings`
- `PATCH /api/listings/:id`
- `DELETE /api/listings/:id`

### Bills (full CRUD)

- `GET /api/listings/:listingId/bills`
- `POST /api/listings/:listingId/bills`
- `PATCH /api/bills/:id`
- `DELETE /api/bills/:id`

### Favorites

- `GET /api/favorites`
- `GET /api/favorites/check?listingId=...`
- `POST /api/favorites`
- `DELETE /api/favorites/:listingId`

### Applications

- `POST /api/listings/:listingId/applications`
- `GET /api/applications/me`
- `PATCH /api/applications/:id/withdraw`

### Saved Searches

- `GET /api/saved-searches`
- `POST /api/saved-searches`

### Admin

- `GET /api/admin/stats`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id/ban`
- `PATCH /api/admin/users/:id/role`
- `GET /api/admin/listings/pending`
- `PATCH /api/admin/listings/:id/moderate`
- `GET /api/admin/verifications/pending`
- `PATCH /api/admin/verifications/:id/review`

## Requirement Coverage

- Roles and access:
  - Signup with seeker/host
  - admin assignment and moderation endpoints
  - role switching (`seeker` <-> `host`)
- One-to-many requirement:
  - `listings -> bills` implemented with full CRUD
- Protected routes:
  - Public + seeker + host + admin route groups implemented
- Redux required slices:
  - `authSlice` implemented with token persistence
  - `filterSlice` implemented with URL-driven listing filters and saved searches
- Notifications:
  - `react-toastify` wired and used for auth + CRUD feedback
- Delete confirmation:
  - reusable `ConfirmModal` used for listing delete, favorite remove, application withdraw, admin ban flow
- Filters:
  - URL-synced filters on `/listings`
- Admin dashboard:
  - stats, user moderation, listing approvals, verification reviews

## Notes

- Backend container runs `prisma db push` on startup to keep local dev schema in sync quickly.
- For production-style migrations, use Prisma migrations (`prisma migrate`) instead of `db push`.
