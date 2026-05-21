import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { z } from "zod";

// The single source of truth for env lives at the repo root (one level above
// backend/). dotenv defaults to process.cwd(), which is backend/ when the
// server is started via `npm run dev`/`npm test` — so it never found the root
// .env. Resolve the path explicitly. dotenv does not override vars already set
// (e.g. the test script blanks SMTP_* to force mock mode), so existing
// process.env values still win.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const smtpHost = process.env.SMTP_HOST || "";
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = process.env.SMTP_PASS || "";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("7d"),
  CLIENT_URL: z.string().url().default("http://localhost:5173"),
  CORS_ALLOWED_ORIGINS: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  // eslint-disable-next-line no-console
  console.error(`\n[env] Invalid environment configuration:\n${issues}\n`);
  process.exit(1);
}

const data = parsed.data;

const allowedOrigins = data.CORS_ALLOWED_ORIGINS
  ? data.CORS_ALLOWED_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean)
  : [data.CLIENT_URL];

if (data.NODE_ENV === "production" && allowedOrigins.includes("*")) {
  // eslint-disable-next-line no-console
  console.error("[env] Wildcard CORS origin '*' is not allowed in production");
  process.exit(1);
}

export const env = {
  nodeEnv: data.NODE_ENV,
  port: data.PORT,
  databaseUrl: data.DATABASE_URL,
  jwtSecret: data.JWT_SECRET,
  jwtRefreshSecret: data.JWT_REFRESH_SECRET,
  accessTokenTtl: data.ACCESS_TOKEN_TTL,
  refreshTokenTtl: data.REFRESH_TOKEN_TTL,
  clientUrl: data.CLIENT_URL,
  allowedOrigins,
  email: {
    host: smtpHost,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    user: smtpUser,
    pass: smtpPass,
    from: process.env.EMAIL_FROM || smtpUser || "no-reply@roomie.kz",
    // Without full SMTP credentials we run in mock mode: codes are logged to
    // the server console instead of being emailed (no real send required).
    mock: !(smtpHost && smtpUser && smtpPass)
  }
};
