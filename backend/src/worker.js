/* eslint-disable no-console */
// Background email worker — a standalone process (no Redis). It polls the
// Postgres-backed `email_jobs` queue, claims pending jobs atomically, renders
// the matching template and sends via the SMTP mailer. Run with:
//   node src/worker.js
// In docker-compose it is its own `worker` service using the backend image.
import { prisma } from "./config/db.js";
import { renderEventEmail, sendEmail } from "./utils/mailer.js";
import { env } from "./config/env.js";

const POLL_INTERVAL_MS = Number(process.env.EMAIL_WORKER_POLL_MS) || 5000;
const MAX_ATTEMPTS = Number(process.env.EMAIL_WORKER_MAX_ATTEMPTS) || 5;
const BATCH = 10;

let running = true;

/**
 * Claim one pending job atomically so multiple workers never double-send:
 * updateMany guarded by status='pending' — only one worker's UPDATE matches.
 */
const claimNext = async () => {
  const candidate = await prisma.emailJob.findFirst({
    where: { status: "pending", attempts: { lt: MAX_ATTEMPTS } },
    orderBy: { createdAt: "asc" },
    select: { id: true }
  });
  if (!candidate) return null;

  const claim = await prisma.emailJob.updateMany({
    where: { id: candidate.id, status: "pending" },
    data: { status: "processing" }
  });
  if (claim.count === 0) return null; // another worker grabbed it first
  return prisma.emailJob.findUnique({ where: { id: candidate.id } });
};

const processJob = async (job) => {
  try {
    const { subject, text, html } = renderEventEmail(job.type, job.payloadJson || {});
    await sendEmail({ to: job.toEmail, subject, text, html });
    await prisma.emailJob.update({
      where: { id: job.id },
      data: { status: "sent", sentAt: new Date(), lastError: null }
    });
    console.log(`[worker] sent #${job.id} ${job.type} -> ${job.toEmail}`);
  } catch (err) {
    const attempts = job.attempts + 1;
    const failed = attempts >= MAX_ATTEMPTS;
    await prisma.emailJob.update({
      where: { id: job.id },
      data: {
        status: failed ? "failed" : "pending",
        attempts,
        lastError: err?.message || String(err)
      }
    });
    console.error(
      `[worker] job #${job.id} ${job.type} ${failed ? "FAILED (giving up)" : "errored (will retry)"}: ${err?.message}`
    );
  }
};

const tick = async () => {
  for (let i = 0; i < BATCH; i += 1) {
    const job = await claimNext();
    if (!job) break;
    await processJob(job);
  }
};

const loop = async () => {
  while (running) {
    try {
      await tick();
    } catch (err) {
      console.error("[worker] tick error:", err?.message);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
};

const shutdown = async (signal) => {
  console.log(`[worker] ${signal} received, shutting down...`);
  running = false;
  await prisma.$disconnect().catch(() => {});
  process.exit(0);
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

console.log(
  `[worker] email worker started (poll ${POLL_INTERVAL_MS}ms, mail mock=${env.email.mock})`
);
loop();
