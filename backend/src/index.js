import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { prisma } from "./config/db.js";
import apiRouter from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (_error) {
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});

app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend running on port ${env.port}`);
});
