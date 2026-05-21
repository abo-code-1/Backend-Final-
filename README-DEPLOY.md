# Deployment Guide — Roomie.kz

Simple, single-server CI/CD:

- GitHub Actions runs lint + jest on every push/PR to `main`
- the workflow builds **two** Docker images (`roomie-kz-backend`, `roomie-kz-frontend`) and pushes them to Docker Hub
- the EC2 server pulls both images and runs `docker-compose.prod.yml`
- Compose runs three services: `db` (Postgres 16), `backend` (Node + Prisma), `frontend` (nginx serving the Vite build and reverse-proxying `/api` to the backend)

---

## 1. Verify locally

```bash
cd roomie-kz
cp .env.example .env       # then edit secrets
docker compose up --build
```

Then in another terminal:

```bash
curl http://localhost:5050/api/health
open http://localhost:5174           # frontend (Vite dev server)
open http://localhost:5050/api/docs  # Swagger UI
```

Run the test suite (inside the running backend container):

```bash
docker compose exec backend npm test
```

Build & smoke-test the **production** images locally:

```bash
docker build --target runtime -t roomie-kz-backend:local ./backend
docker build --target runtime -t roomie-kz-frontend:local ./frontend
```

---

## 2. Create the Docker Hub repositories

Create **two** repositories under your Docker Hub user:

- `<dockerhub-user>/roomie-kz-backend`
- `<dockerhub-user>/roomie-kz-frontend`

The workflow tags & pushes:

- `:<git-sha>` (immutable, always pinned by deploy)
- `:latest` (moving)
- `:buildcache` (registry-side cache, populated by buildx)

---

## 3. Prepare the EC2 host

If Docker is not installed on the server yet:

```bash
scp -i ~/.ssh/roomie-kz.pem scripts/setup-ec2.sh ubuntu@<EC2_IP>:~/
ssh -i ~/.ssh/roomie-kz.pem ubuntu@<EC2_IP>
sudo bash ~/setup-ec2.sh
exit
ssh -i ~/.ssh/roomie-kz.pem ubuntu@<EC2_IP>
```

Verify:

```bash
docker --version
docker compose version
ls -ld /opt/roomie-kz
```

---

## 4. Create `/opt/roomie-kz/.env` on EC2

On the EC2 box:

```bash
cat > /opt/roomie-kz/.env <<'EOF'
APP_PORT=80

# DB
DB_NAME=roomie_kz
DB_USER=roomie_user
DB_PASSWORD=<a-strong-random-password>

# Backend secrets — generate with: openssl rand -hex 48
JWT_SECRET=<32+chars>
JWT_REFRESH_SECRET=<32+chars>
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d

# Public origin(s) the frontend will be served from. NO wildcards in prod.
CLIENT_URL=https://roomie.example.kz
CORS_ALLOWED_ORIGINS=https://roomie.example.kz

# Image coordinates — overridden by GitHub Actions on each deploy,
# but provide sensible fallbacks so a manual `docker compose pull` works.
BACKEND_IMAGE=<dockerhub-user>/roomie-kz-backend
FRONTEND_IMAGE=<dockerhub-user>/roomie-kz-frontend
IMAGE_TAG=latest
EOF
chmod 600 /opt/roomie-kz/.env
```

Important: inside compose, the API talks to Postgres via the service hostname
`db` (not `localhost`). The compose file already does this for you — only the
above plain values are needed.

---

## 5. GitHub Actions secrets / variables

`Repository -> Settings -> Secrets and variables -> Actions`

**Secrets:**

- `DOCKERHUB_USERNAME` — your Docker Hub username
- `DOCKERHUB_TOKEN` — Docker Hub access token (write scope)
- `EC2_USER` — usually `ubuntu`
- `EC2_SSH_KEY` — the full private key contents, **including** the BEGIN and END lines

**Variables:**

- `EC2_HOST` — the EC2 public DNS name or public IP (e.g. `ec2-3-91-18-145.compute-1.amazonaws.com`)

Do not use the private hostname (`ip-172-31-...`) or a `172.31.x.x` address —
GitHub-hosted runners cannot reach those.

EC2 Security Group:

- Inbound TCP 22 from GitHub-hosted runners (or `0.0.0.0/0` for class demos)
- Inbound TCP 80 (and 443 if you add HTTPS later) from `0.0.0.0/0`

---

## 6. Push and deploy

```bash
git add .
git commit -m "Wire up CI/CD"
git push origin main
```

The workflow runs in this order:

1. `test` — Postgres 16 service, `npm ci`, `prisma db push`, `npm run lint`, `npm test`
2. `build-and-push` — matrix builds both images and pushes them
3. `deploy` — SSH to EC2, scp `docker-compose.prod.yml`, pull, `up -d`, poll `/api/health`

When the workflow finishes:

```bash
curl http://<EC2_IP>/api/health
open http://<EC2_IP>/         # the SPA
open http://<EC2_IP>/api/docs # Swagger UI
```

---

## 7. Day-2 commands on EC2

```bash
cd /opt/roomie-kz
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f db
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Run a Prisma migration manually (the backend already runs `prisma migrate deploy`
on every container start, so this is rarely needed):

```bash
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

Open a psql shell:

```bash
docker compose -f docker-compose.prod.yml exec db psql -U $DB_USER -d $DB_NAME
```

---

## 8. Common problems

| Symptom | Cause | Fix |
| --- | --- | --- |
| `deploy` fails with `.env not found` | First-deploy bootstrap missing | Create `/opt/roomie-kz/.env` (step 4), rerun the workflow |
| Backend container exits immediately, logs say `Invalid environment configuration` | Missing/short `JWT_SECRET` etc. | Each secret must be ≥ 32 chars |
| `Cannot reach <host>:22 from the GitHub runner` | Wrong `EC2_HOST` or SG blocks SSH | Use **public** DNS/IP; allow inbound TCP 22 |
| 502 from frontend, backend healthy | Stale frontend image | `docker compose -f docker-compose.prod.yml pull && up -d` |
| `pg_isready` flapping | DB volume corruption | `docker compose down`, inspect/wipe `postgres_data` (will lose data) |
| `curl http://<EC2_IP>/api/health` fails | SG blocks port 80 | Allow inbound TCP 80 |

---

## 9. Rolling back

Every deploy pins `IMAGE_TAG=<git-sha>`. To roll back:

```bash
ssh ubuntu@<EC2_IP>
cd /opt/roomie-kz
sed -i 's/^IMAGE_TAG=.*/IMAGE_TAG=<previous-sha>/' .env
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```
