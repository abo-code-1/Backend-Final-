import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { env } from "./config/env.js";
import { prisma } from "./config/db.js";
import apiRouter from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.disable("x-powered-by");
// CSP off: this is a JSON API plus a Swagger UI bundle that needs
// `unsafe-eval` and inline styles. nginx adds frame/content sniffing headers
// in front; helmet still ships the rest of its security headers.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // server-to-server / Postman
      if (env.allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));

// OpenAPI / Swagger UI
try {
  const openapiPath = path.resolve(__dirname, "..", "openapi.yaml");
  const spec = YAML.load(openapiPath);
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(spec));
  app.get("/api/openapi.json", (_req, res) => res.json(spec));
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn("[openapi] Failed to load spec:", e.message);
}

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (_error) {
    res.status(500).json({
      error: { code: "DB_DOWN", message: "Database not reachable" }
    });
  }
});

app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

if (env.nodeEnv !== "test") {
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend running on port ${env.port} (${env.nodeEnv})`);
    // eslint-disable-next-line no-console
    console.log(`Swagger UI: http://localhost:${env.port}/api/docs`);
  });
}

export default app;
