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
import { globalRateLimiter } from "./middleware/rateLimit.js";

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
// After CORS so 429 responses still carry Access-Control-Allow-Origin headers
// (otherwise the browser surfaces an opaque CORS/network error, not the 429).
app.use(globalRateLimiter);
app.use(express.json({ limit: "1mb" }));

// OpenAPI / Swagger UI
try {
  const openapiPath = path.resolve(__dirname, "..", "openapi.yaml");
  const spec = YAML.load(openapiPath);
  const swaggerSetup = swaggerUi.setup(spec, {
    customSiteTitle: "Roomie.kz API Docs",
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: "list",
      defaultModelsExpandDepth: 1,
      filter: true,
      tryItOutEnabled: true,
      tagsSorter: "alpha",
      operationsSorter: "method"
    }
  });
  app.use("/api/docs", swaggerUi.serve, swaggerSetup);
  app.use("/swagger/docs", swaggerUi.serve, swaggerSetup);
  app.get("/api/openapi.json", (_req, res) => res.json(spec));
  app.get("/swagger/openapi.json", (_req, res) => res.json(spec));
  app.get("/api/openapi.yaml", (_req, res) => {
    res.type("text/yaml").sendFile(openapiPath);
  });
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
