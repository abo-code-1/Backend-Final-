import { execSync, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

// globalSetup runs before any test module (and before src/config/env.js loads
// dotenv), so load the root .env here too — that's where DATABASE_URL lives.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const TEST_DB_NAME = process.env.TEST_DB_NAME || "roomie_kz_test";

const buildMaintenanceUrl = () => {
  const url = new URL(process.env.DATABASE_URL);
  url.pathname = "/postgres";
  url.search = "";
  return url.toString();
};

const ensureTestDatabase = () => {
  const result = spawnSync(
    "createdb",
    ["--maintenance-db", buildMaintenanceUrl(), TEST_DB_NAME],
    { encoding: "utf8" }
  );

  if (result.status === 0) return;

  const output = `${result.stdout || ""}${result.stderr || ""}`;
  if (/already exists/i.test(output)) return;

  if (result.error?.code === "ENOENT") {
    throw new Error(
      "PostgreSQL createdb client is required for test database setup"
    );
  }

  throw new Error(output || result.error?.message || "createdb failed");
};

export default async function globalSetup() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set for the test run");
  }

  ensureTestDatabase();

  // Push the Prisma schema into the test DB.
  const u = new URL(process.env.DATABASE_URL);
  u.pathname = `/${TEST_DB_NAME}`;
  process.env.DATABASE_URL = u.toString();

  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    stdio: "inherit",
    env: process.env
  });
}
