import bcrypt from "bcryptjs";
import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendVerificationEmail } from "../utils/mailer.js";
import { env } from "../config/env.js";
import { emailVerifySchema, requestCodeSchema } from "../validators/zodSchemas.js";

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds between requests
const MAX_ATTEMPTS = 5;

const generateCode = () => String(Math.floor(100000 + Math.random() * 900000));

/**
 * Invalidate prior unconsumed codes for a user and issue a fresh one.
 * Returns the plaintext code so the caller can email it.
 */
export async function issueCode(userId) {
  await prisma.emailVerification.deleteMany({
    where: { userId, consumedAt: null }
  });
  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  await prisma.emailVerification.create({
    data: { userId, codeHash, expiresAt: new Date(Date.now() + CODE_TTL_MS) }
  });
  return code;
}

// POST /auth/email/request-code  (public) — body: { email }
export const requestEmailCode = asyncHandler(async (req, res) => {
  const { email } = requestCodeSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, email: true, isEmailVerified: true }
  });

  // Don't reveal whether an account exists.
  if (!user) {
    return res.json({ message: "If that account exists, a code was sent." });
  }
  if (user.isEmailVerified) {
    return res.status(400).json({ message: "Email already verified" });
  }

  const recent = await prisma.emailVerification.findFirst({
    where: { userId: user.id, consumedAt: null },
    orderBy: { createdAt: "desc" }
  });
  if (recent && Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    const waitSec = Math.ceil(
      (RESEND_COOLDOWN_MS - (Date.now() - recent.createdAt.getTime())) / 1000
    );
    return res
      .status(429)
      .json({ message: `Please wait ${waitSec}s before requesting a new code` });
  }

  const code = await issueCode(user.id);
  const { mocked } = await sendVerificationEmail(user.email, code);

  const payload = { message: "Verification code sent", email: user.email };
  if (mocked && env.email.mock) {
    payload.devCode = code;
    payload.message = "Verification code generated (mock mode — check server logs)";
  }
  return res.json(payload);
});

// POST /auth/email/verify  (public) — body: { email, code }
export const verifyEmailCode = asyncHandler(async (req, res) => {
  const { email, code } = emailVerifySchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, isEmailVerified: true }
  });

  // Generic message — don't leak account existence.
  if (!user) {
    return res.status(400).json({ message: "Invalid code" });
  }
  if (user.isEmailVerified) {
    return res.json({ message: "Email already verified" });
  }

  const record = await prisma.emailVerification.findFirst({
    where: { userId: user.id, consumedAt: null },
    orderBy: { createdAt: "desc" }
  });

  if (!record) {
    return res
      .status(400)
      .json({ message: "No active code. Please request a new one." });
  }
  if (record.expiresAt.getTime() < Date.now()) {
    return res
      .status(400)
      .json({ message: "Code expired. Please request a new one." });
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    return res
      .status(429)
      .json({ message: "Too many attempts. Please request a new code." });
  }

  const isMatch = await bcrypt.compare(code, record.codeHash);
  if (!isMatch) {
    await prisma.emailVerification.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } }
    });
    return res.status(400).json({ message: "Invalid code" });
  }

  await prisma.$transaction([
    prisma.emailVerification.update({
      where: { id: record.id },
      data: { consumedAt: new Date() }
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true }
    })
  ]);

  return res.json({ message: "Email verified" });
});
