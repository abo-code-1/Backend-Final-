import dotenv from "dotenv";

dotenv.config();

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
