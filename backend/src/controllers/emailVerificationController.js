import bcrypt from "bcryptjs";
import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendVerificationEmail } from "../utils/mailer.js";
import { env } from "../config/env.js";
import { emailVerifySchema } from "../validators/zodSchemas.js";

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds between requests
const MAX_ATTEMPTS = 5;

const authUserSelect = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  role: true,
  avatarUrl: true,
  bio: true,
  gender: true,
  occupation: true,
  isPhoneVerified: true,
  isEmailVerified: true,
  isIdVerified: true,
  isBanned: true,
  createdAt: true
};

const generateCode = () => String(Math.floor(100000 + Math.random() * 900000));

// POST /auth/email/request-code  (authenticated)
export const requestEmailCode = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, isEmailVerified: true }
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  if (user.isEmailVerified) {
    return res.status(400).json({ message: "Email already verified" });
  }

  // Throttle: block resend if a code was issued very recently.
  const recent = await prisma.emailVerification.findFirst({
    where: { userId, consumedAt: null },
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

  // Invalidate any prior unconsumed codes, then issue a fresh one.
  await prisma.emailVerification.deleteMany({
    where: { userId, consumedAt: null }
  });

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);

  await prisma.emailVerification.create({
    data: {
      userId,
      codeHash,
      expiresAt: new Date(Date.now() + CODE_TTL_MS)
    }
  });

  const { mocked } = await sendVerificationEmail(user.email, code);

  const payload = { message: "Verification code sent", email: user.email };
  // In mock mode (no SMTP configured) surface the code so dev/demo can proceed.
  if (mocked && env.email.mock) {
    payload.devCode = code;
    payload.message = "Verification code generated (mock mode — check server logs)";
  }
  return res.json(payload);
});

// POST /auth/email/verify  (authenticated)
export const verifyEmailCode = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { code } = emailVerifySchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isEmailVerified: true }
  });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  if (user.isEmailVerified) {
    const fresh = await prisma.user.findUnique({
      where: { id: userId },
      select: authUserSelect
    });
    return res.json({ message: "Email already verified", user: fresh });
  }

  const record = await prisma.emailVerification.findFirst({
    where: { userId, consumedAt: null },
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

  // Success: consume the code and mark the user verified.
  const [, updatedUser] = await prisma.$transaction([
    prisma.emailVerification.update({
      where: { id: record.id },
      data: { consumedAt: new Date() }
    }),
    prisma.user.update({
      where: { id: userId },
      data: { isEmailVerified: true },
      select: authUserSelect
    })
  ]);

  return res.json({ message: "Email verified", user: updatedUser });
});
