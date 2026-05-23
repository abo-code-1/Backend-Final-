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

const shell = (title, bodyHtml) => `
  <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f1115">
    <h2 style="margin:0 0 8px">${title}</h2>
    ${bodyHtml}
    <p style="color:#a1a1aa;font-size:13px;margin-top:24px">Roomie.kz — аренда жилья и поиск соседей.</p>
  </div>`;

const button = (url, label) =>
  `<a href="${url}" style="display:inline-block;background:#4F46E5;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">${label}</a>`;

/**
 * Low-level send. In mock mode (no SMTP configured) it logs instead of sending
 * and never throws, so flows work end-to-end in dev without a mail server.
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  if (env.email.mock || !transporter) {
    // eslint-disable-next-line no-console
    console.log(`\n[mailer:mock] -> ${to}\n  subject: ${subject}\n  ${text}\n`);
    return { mocked: true };
  }
  await transporter.sendMail({ from: env.email.from, to, subject, text, html });
  return { mocked: false };
};

// ---------------------------------------------------------------------------
// Time-sensitive emails — sent inline in the request (user is waiting).
// ---------------------------------------------------------------------------

export const sendVerificationEmail = (to, code) =>
  sendEmail({
    to,
    subject: `Roomie.kz — код подтверждения: ${code}`,
    text: `Ваш код подтверждения email: ${code}\nКод действует 10 минут. Если вы не запрашивали подтверждение, проигнорируйте это письмо.`,
    html: shell(
      "Подтверждение email",
      `<p style="color:#52525b;margin:0 0 20px">Введите этот код в приложении Roomie.kz, чтобы подтвердить адрес.</p>
       <div style="font-size:34px;font-weight:700;letter-spacing:8px;background:#f4f4f5;border-radius:12px;padding:18px;text-align:center">${code}</div>
       <p style="color:#a1a1aa;font-size:13px;margin-top:20px">Код действует 10 минут.</p>`
    )
  });

export const sendPasswordResetEmail = (to, resetUrl) =>
  sendEmail({
    to,
    subject: "Roomie.kz — сброс пароля",
    text: `Вы запросили сброс пароля. Откройте ссылку, чтобы задать новый пароль (действует 30 минут):\n${resetUrl}\n\nЕсли вы не запрашивали сброс, проигнорируйте это письмо.`,
    html: shell(
      "Сброс пароля",
      `<p style="color:#52525b;margin:0 0 20px">Нажмите кнопку, чтобы задать новый пароль. Ссылка действует 30 минут.</p>
       <p style="margin:0 0 20px">${button(resetUrl, "Сбросить пароль")}</p>
       <p style="color:#a1a1aa;font-size:13px">Если кнопка не работает, скопируйте ссылку:<br><span style="word-break:break-all">${resetUrl}</span></p>
       <p style="color:#a1a1aa;font-size:13px;margin-top:12px">Если вы не запрашивали сброс, проигнорируйте это письмо.</p>`
    )
  });

// ---------------------------------------------------------------------------
// Business-event emails — enqueued and sent by the background worker.
// renderEventEmail(type, payload) -> { subject, text, html }
// ---------------------------------------------------------------------------

const eventTemplates = {
  welcome: ({ fullName }) => ({
    subject: "Добро пожаловать в Roomie.kz!",
    text: `Здравствуйте, ${fullName || "пользователь"}! Спасибо за регистрацию в Roomie.kz. Заполните профиль, чтобы получать больше откликов.`,
    html: shell(
      "Добро пожаловать!",
      `<p style="color:#52525b">Здравствуйте, <b>${fullName || "пользователь"}</b>! Спасибо за регистрацию в Roomie.kz. Заполните профиль и начните искать жильё или соседей.</p>`
    )
  }),
  application_received: ({ hostName, seekerName, listingTitle, listingUrl }) => ({
    subject: `Новый отклик на «${listingTitle}»`,
    text: `Здравствуйте, ${hostName || "хозяин"}! ${seekerName || "Пользователь"} откликнулся на ваше объявление «${listingTitle}». Откройте отклики: ${listingUrl}`,
    html: shell(
      "Новый отклик",
      `<p style="color:#52525b"><b>${seekerName || "Пользователь"}</b> откликнулся на ваше объявление <b>«${listingTitle}»</b>.</p>
       <p style="margin:16px 0">${button(listingUrl, "Посмотреть отклики")}</p>`
    )
  }),
  application_accepted: ({ seekerName, listingTitle, listingUrl }) => ({
    subject: `Ваш отклик на «${listingTitle}» принят`,
    text: `Хорошие новости, ${seekerName || "пользователь"}! Ваш отклик на «${listingTitle}» принят. Подробнее: ${listingUrl}`,
    html: shell(
      "Отклик принят 🎉",
      `<p style="color:#52525b">Ваш отклик на <b>«${listingTitle}»</b> принят. Свяжитесь с хозяином, чтобы договориться о заселении.</p>
       <p style="margin:16px 0">${button(listingUrl, "Открыть объявление")}</p>`
    )
  }),
  application_rejected: ({ seekerName, listingTitle }) => ({
    subject: `Отклик на «${listingTitle}» отклонён`,
    text: `${seekerName || "Пользователь"}, к сожалению, ваш отклик на «${listingTitle}» был отклонён. Не расстраивайтесь — на Roomie.kz много других вариантов.`,
    html: shell(
      "Отклик отклонён",
      `<p style="color:#52525b">К сожалению, ваш отклик на <b>«${listingTitle}»</b> был отклонён. На Roomie.kz много других вариантов — продолжайте поиск!</p>`
    )
  }),
  listing_approved: ({ hostName, listingTitle, listingUrl }) => ({
    subject: `Объявление «${listingTitle}» опубликовано`,
    text: `${hostName || "Хозяин"}, ваше объявление «${listingTitle}» прошло модерацию и опубликовано. Смотреть: ${listingUrl}`,
    html: shell(
      "Объявление опубликовано",
      `<p style="color:#52525b">Ваше объявление <b>«${listingTitle}»</b> прошло модерацию и теперь видно всем пользователям.</p>
       <p style="margin:16px 0">${button(listingUrl, "Открыть объявление")}</p>`
    )
  })
};

export const EMAIL_EVENT_TYPES = Object.keys(eventTemplates);

export const renderEventEmail = (type, payload = {}) => {
  const builder = eventTemplates[type];
  if (!builder) throw new Error(`Unknown email event type: ${type}`);
  return builder(payload);
};
