# Shanyraq API

Local Docker Compose:

```bash
cp .env.example .env
docker compose up --build
```

API health check:

```bash
curl http://localhost:3000/health
```

CI/CD and EC2 deployment steps are documented in `README-DEPLOY.md`.
