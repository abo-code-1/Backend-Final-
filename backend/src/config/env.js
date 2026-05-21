import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// The single source of truth for env lives at the repo root (one level above
// backend/). dotenv defaults to process.cwd(), which is backend/ when the
// server is started via `npm run dev`/`npm test` — so it never found the root
// .env and silently fell back to mock mode. Resolve the path explicitly.
// Note: dotenv does not override vars already set (e.g. the test script blanks
// SMTP_* to force mock mode), so existing process.env values still win.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const smtpHost = process.env.SMTP_HOST || "";
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = process.env.SMTP_PASS || "";

export const env = {
  port: process.env.PORT || 5000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "change_me",
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
