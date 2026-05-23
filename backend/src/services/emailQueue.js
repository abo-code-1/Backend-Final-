import { prisma } from "../config/db.js";

/**
 * Enqueue a business-event email for the background worker (src/worker.js) to
 * send. Postgres-backed queue — no Redis. Best-effort: enqueue failures are
 * logged but never bubble up to break the originating request.
 *
 * @param {string} type     one of EMAIL_EVENT_TYPES (see utils/mailer.js)
 * @param {string} toEmail  recipient address
 * @param {object} payload  template data, stored as JSON
 */
export const enqueueEmail = async (type, toEmail, payload = {}) => {
  if (!toEmail) return null;
  try {
    return await prisma.emailJob.create({
      data: { type, toEmail, payloadJson: payload }
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[emailQueue] failed to enqueue ${type} -> ${toEmail}:`, err?.message);
    return null;
  }
};
