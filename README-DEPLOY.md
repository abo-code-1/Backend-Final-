# Deployment Guide — Shanyraq API

This is the simple CI/CD version:

- GitHub Actions runs tests on every push to `main`
- the workflow builds one Docker image for the API
- the image is pushed to Docker Hub
- the EC2 server pulls the image and restarts Docker Compose
- Docker Compose runs only `api` and `postgres`

## 1. Check the app locally

```bash
cd /Users/a1/Uniprojects/BackendClass/FinalProject
npm ci
npx prisma generate
npm run typecheck
npm test
cp .env.example .env
docker compose up --build
```

In another terminal:

```bash
curl http://localhost:3000/health
```

## 2. Create the Docker Hub repository

Create a repository named `shanyraq-api` in Docker Hub.

The workflow tags and pushes:

- `<dockerhub-user>/shanyraq-api:latest`
- `<dockerhub-user>/shanyraq-api:<git-sha>`

## 3. Prepare the EC2 host

If Docker is not installed on the server yet:

```bash
scp -i ~/.ssh/shanyraq.pem scripts/setup-ec2.sh ubuntu@<EC2_IP>:~/
ssh -i ~/.ssh/shanyraq.pem ubuntu@<EC2_IP>
sudo bash ~/setup-ec2.sh
exit
ssh -i ~/.ssh/shanyraq.pem ubuntu@<EC2_IP>
```

Verify:

```bash
docker --version
docker compose version
ls -ld /opt/shanyraq
```

## 4. Create `/opt/shanyraq/.env` on EC2

On the EC2 box:

```bash
cat > /opt/shanyraq/.env <<'EOF'
APP_PORT=80
POSTGRES_USER=shanyraq
POSTGRES_PASSWORD=change-this-password
POSTGRES_DB=shanyraq
DATABASE_URL=postgresql://shanyraq:change-this-password@postgres:5432/shanyraq?schema=public
DOCKER_IMAGE=your-dockerhub-user/shanyraq-api
IMAGE_TAG=latest
EOF
chmod 600 /opt/shanyraq/.env
```

The important detail is the hostname inside `DATABASE_URL`: it must be `postgres`, not `localhost`, because the API runs inside Docker Compose.

## 5. Add GitHub Actions secrets

Open GitHub:

`Repository -> Settings -> Secrets and variables -> Actions`

Create these repository secrets:

- `DOCKERHUB_USERNAME`: your Docker Hub username
- `DOCKERHUB_TOKEN`: a Docker Hub personal access token
- `EC2_HOST`: the public IP or DNS name of the EC2 instance
- `EC2_USER`: usually `ubuntu`
- `EC2_SSH_KEY`: the full private key contents, including BEGIN and END lines

## 6. Push and deploy

```bash
git add .
git commit -m "Set up simple CI/CD with Docker Compose"
git push origin main
```

The workflow order is:

1. `test`
2. `build-and-push`
3. `deploy`

When the workflow finishes, check:

```bash
curl http://<EC2_IP>/health
```

## 7. What the deploy job does

The deploy step copies `docker-compose.prod.yml` to `/opt/shanyraq`, logs the server into Docker Hub, pulls the image built for the current commit, and runs:

```bash
docker compose -f docker-compose.prod.yml up -d --remove-orphans
```

## 8. Useful commands on EC2

```bash
cd /opt/shanyraq
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f postgres
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

## 9. Common problems

- `deploy` fails with `.env not found`: create `/opt/shanyraq/.env` first, then rerun the workflow.
- The API container exits immediately: inspect `docker compose -f docker-compose.prod.yml logs api`; the most common cause is an invalid `DATABASE_URL`.
- Docker pull fails on EC2: check `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` in GitHub secrets.
- `curl http://<EC2_IP>/health` fails: make sure the EC2 security group allows inbound TCP on port 80.
