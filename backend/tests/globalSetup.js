import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

// globalSetup runs before any test module (and before src/config/env.js loads
// dotenv), so load the root .env here too — that's where DATABASE_URL lives.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const TEST_DB_NAME = process.env.TEST_DB_NAME || "roomie_kz_test";

const buildAdminUrl = () => {
  // Connect to the postgres maintenance DB on the same host/user to issue
  // CREATE DATABASE if missing.
  const url = new URL(process.env.DATABASE_URL);
  url.pathname = "/postgres";
  return url.toString();
};

export default async function globalSetup() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set for the test run");
  }

  // Ensure the test DB exists.
  const adminUrl = buildAdminUrl();
  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();
  const exists = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [TEST_DB_NAME]
  );
  if (exists.rowCount === 0) {
    // pg won't allow parameter binding for CREATE DATABASE; the name is
    // controlled by env, not user input.
    await client.query(`CREATE DATABASE "${TEST_DB_NAME}"`);
  }
  await client.end();

  // Push the Prisma schema into the test DB.
  const u = new URL(process.env.DATABASE_URL);
  u.pathname = `/${TEST_DB_NAME}`;
  process.env.DATABASE_URL = u.toString();

  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    stdio: "inherit",
    env: process.env
  });
}
