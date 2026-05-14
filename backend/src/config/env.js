import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

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
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_VERIFY_SERVICE_SID: z.string().optional()
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

const allowedOrigins = (data.CORS_ALLOWED_ORIGINS
  ? data.CORS_ALLOWED_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean)
  : [data.CLIENT_URL]);

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
  twilio: {
    accountSid: data.TWILIO_ACCOUNT_SID,
    authToken: data.TWILIO_AUTH_TOKEN,
    verifyServiceSid: data.TWILIO_VERIFY_SERVICE_SID
  }
};
