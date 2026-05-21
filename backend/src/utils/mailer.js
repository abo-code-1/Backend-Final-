import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter = null;

if (!env.email.mock) {
  transporter = nodemailer.createTransport({
    host: env.email.host,
    port: env.email.port,
    secure: env.email.secure, // true for 465, false for 587 (STARTTLS)
    auth: {
      user: env.email.user,
      pass: env.email.pass
    }
  });
}

const verificationTemplate = (code) => ({
  subject: `Roomie.kz — код подтверждения: ${code}`,
  text: `Ваш код подтверждения email: ${code}\nКод действует 10 минут. Если вы не запрашивали подтверждение, просто проигнорируйте это письмо.`,
  html: `
    <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f1115">
      <h2 style="margin:0 0 8px">Подтверждение email</h2>
      <p style="color:#52525b;margin:0 0 20px">Введите этот код в приложении Roomie.kz, чтобы подтвердить адрес.</p>
      <div style="font-size:34px;font-weight:700;letter-spacing:8px;background:#f4f4f5;border-radius:12px;padding:18px;text-align:center">${code}</div>
      <p style="color:#a1a1aa;font-size:13px;margin-top:20px">Код действует 10 минут. Если вы не запрашивали подтверждение, проигнорируйте это письмо.</p>
    </div>`
});

/**
 * Send (or, in mock mode, log) an email verification code.
 * In mock mode it never throws — verification still works end-to-end in dev.
 */
export const sendVerificationEmail = async (to, code) => {
  const { subject, text, html } = verificationTemplate(code);

  if (env.email.mock || !transporter) {
    // eslint-disable-next-line no-console
    console.log(
      `\n[mailer:mock] Email verification code for ${to} → ${code} (valid 10 min)\n`
    );
    return { mocked: true };
  }

  await transporter.sendMail({ from: env.email.from, to, subject, text, html });
  return { mocked: false };
};
