# syntax=docker/dockerfile:1.7
FROM node:20-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl tini wget \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---------- deps: shared install layer ----------
FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# ---------- dev: hot-reload target used by docker-compose.yml ----------
FROM deps AS dev
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

# ---------- build: prune dev deps, generate prisma client ----------
FROM deps AS build
COPY prisma ./prisma
COPY src ./src
COPY openapi.yaml ./openapi.yaml
RUN npx prisma generate
RUN npm prune --omit=dev

# ---------- runtime: minimal production image ----------
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/src ./src
COPY --from=build --chown=node:node /app/openapi.yaml ./openapi.yaml
COPY --from=build --chown=node:node /app/package.json ./package.json
RUN mkdir -p /app/uploads/images && chown -R node:node /app/uploads

USER node
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5000/api/health || exit 1

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
