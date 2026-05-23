import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../config/db.js";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../middleware/errorHandler.js";
import {
  hashRefreshToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from "../utils/jwt.js";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema
} from "../validators/zodSchemas.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../utils/mailer.js";
import { enqueueEmail } from "../services/emailQueue.js";
import { issueCode } from "./emailVerificationController.js";

const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000; // 30 minutes
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

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

const ttlToMs = (ttl) => {
  const match = /^(\d+)\s*([smhd])$/.exec(String(ttl).trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const n = Number(match[1]);
  const mult = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2]];
  return n * mult;
};

const issueTokensForUser = async (user) => {
  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id });
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + ttlToMs(env.refreshTokenTtl))
    }
  });
  return { accessToken, refreshToken };
};

export const register = asyncHandler(async (req, res) => {
  const validatedData = registerSchema.parse(req.body);
  const { email, password, fullName, role = "seeker" } = validatedData;
  // Blank phone from the form arrives as "" — store NULL so empty values don't
  // collide on the unique index (multiple NULLs are allowed, "" is not).
  const phone = validatedData.phone?.trim() || null;

  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });
  if (existingUser) {
    const message = "Email already registered";
    return res.status(409).json({
      message,
      error: { code: "EMAIL_TAKEN", message }
    });
  }

  if (phone) {
    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      const message = "Phone already registered";
      return res.status(409).json({
        message,
        error: { code: "PHONE_TAKEN", message }
      });
    }
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
      fullName,
      phone,
      role
    },
    select: authUserSelect
  });

  const { accessToken, refreshToken } = await issueTokensForUser(user);

  // Best-effort: send the email verification code. Failures shouldn't block
  // registration — the client can call /auth/email/request-code to retry.
  let emailDispatched = false;
  let emailError = null;
  let emailMock = false;
  try {
    const code = await issueCode(user.id);
    const { mocked } = await sendVerificationEmail(user.email, code);
    emailDispatched = true;
    emailMock = mocked;
  } catch (e) {
    emailError = e?.message || "Failed to send verification email";
    // eslint-disable-next-line no-console
    console.error("[mailer] sendVerificationEmail on register failed:", emailError);
  }

  // Business-event email, sent asynchronously by the background worker.
  await enqueueEmail("welcome", user.email, { fullName: user.fullName });

  return res.status(201).json({
    message: "Registered successfully",
    accessToken,
    refreshToken,
    token: accessToken,
    user,
    emailVerification: {
      required: true,
      dispatched: emailDispatched,
      mock: emailMock,
      error: emailError
    }
  });
});

export const login = asyncHandler(async (req, res) => {
  const validatedData = loginSchema.parse(req.body);
  const { email, password } = validatedData;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (!user || user.isBanned) {
    const message = "Invalid credentials or account banned";
    return res.status(401).json({
      message,
      error: { code: "INVALID_CREDENTIALS", message }
    });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const message = "Invalid credentials";
    return res.status(401).json({
      message,
      error: { code: "INVALID_CREDENTIALS", message }
    });
  }

  const safeUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: authUserSelect
  });

  const { accessToken, refreshToken } = await issueTokensForUser(safeUser);

  return res.json({
    message: "Logged in successfully",
    accessToken,
    refreshToken,
    token: accessToken,
    user: safeUser
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = refreshSchema.parse(req.body);

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    const message = "Invalid or expired refresh token";
    return res.status(401).json({
      message,
      error: { code: "INVALID_REFRESH", message }
    });
  }

  const tokenHash = hashRefreshToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    const message = "Refresh token revoked or expired";
    return res.status(401).json({
      message,
      error: { code: "REVOKED_REFRESH", message }
    });
  }
  if (stored.userId !== payload.userId) {
    const message = "Refresh token mismatch";
    return res.status(401).json({
      message,
      error: { code: "INVALID_REFRESH", message }
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: stored.userId },
    select: authUserSelect
  });
  if (!user || user.isBanned) {
    const message = "User unavailable";
    return res.status(401).json({
      message,
      error: { code: "USER_DISABLED", message }
    });
  }

  // rotate: revoke the old refresh token and issue a new pair atomically
  const newAccess = signAccessToken({ userId: user.id, role: user.role });
  const newRefresh = signRefreshToken({ userId: user.id });
  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() }
    }),
    prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashRefreshToken(newRefresh),
        expiresAt: new Date(Date.now() + ttlToMs(env.refreshTokenTtl))
      }
    })
  ]);

  return res.json({
    accessToken: newAccess,
    refreshToken: newRefresh,
    token: newAccess
  });
});

export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = refreshSchema.parse(req.body);
  const tokenHash = hashRefreshToken(refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() }
  });
  return res.json({ message: "Logged out" });
});

export const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: authUserSelect
  });

  return res.json({ user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const data = updateProfileSchema.parse(req.body);

  const patch = {};
  if (data.fullName !== undefined) patch.fullName = data.fullName;
  if (data.bio !== undefined) patch.bio = data.bio || null;
  if (data.gender !== undefined) patch.gender = data.gender;
  if (data.occupation !== undefined) patch.occupation = data.occupation || null;
  if (data.avatarUrl !== undefined) patch.avatarUrl = data.avatarUrl || null;

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: patch,
    select: authUserSelect
  });

  return res.json({ message: "Profile updated", user });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, passwordHash: true }
  });
  if (!user) {
    throw new HttpError(404, "NOT_FOUND", "User not found");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    const message = "Current password is incorrect";
    return res.status(400).json({
      message,
      error: { code: "INVALID_PASSWORD", message }
    });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  // Change the password and revoke every outstanding refresh token so any
  // other session is forced to re-authenticate.
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    }),
    prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() }
    })
  ]);

  return res.json({ message: "Password changed successfully" });
});

// POST /auth/forgot-password  (public) — body: { email }
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = forgotPasswordSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, email: true, isBanned: true }
  });

  // Always return the same response so we never reveal whether an account exists.
  const genericMessage =
    "If that account exists, a password reset link has been sent.";

  if (!user || user.isBanned) {
    return res.json({ message: genericMessage });
  }

  // Invalidate prior unused reset tokens, then issue a fresh one.
  await prisma.passwordReset.deleteMany({
    where: { userId: user.id, usedAt: null }
  });
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS)
    }
  });

  const resetUrl = `${env.clientUrl}/reset-password?token=${token}`;

  const payload = { message: genericMessage };
  try {
    const { mocked } = await sendPasswordResetEmail(user.email, resetUrl);
    // In mock mode (no SMTP) surface the link so the flow is testable in dev.
    if (mocked && env.email.mock) {
      payload.devResetUrl = resetUrl;
      payload.message =
        "Password reset link generated (mock mode — check server logs).";
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[mailer] sendPasswordResetEmail failed:", e?.message);
  }

  return res.json(payload);
});

// POST /auth/reset-password  (public) — body: { token, password }
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = resetPasswordSchema.parse(req.body);

  const record = await prisma.passwordReset.findUnique({
    where: { tokenHash: sha256(token) }
  });
  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
    const message = "Invalid or expired reset link";
    return res.status(400).json({
      message,
      error: { code: "INVALID_RESET_TOKEN", message }
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Set the new password, consume the token, and revoke all sessions so any
  // attacker holding an old token is logged out.
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash }
    }),
    prisma.passwordReset.update({
      where: { id: record.id },
      data: { usedAt: new Date() }
    }),
    prisma.refreshToken.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() }
    })
  ]);

  return res.json({ message: "Password has been reset. You can now log in." });
});

export const switchRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!["seeker", "host"].includes(role)) {
    const message = "Role must be seeker or host";
    return res.status(400).json({
      message,
      error: { code: "INVALID_ROLE", message }
    });
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: { role },
    select: authUserSelect
  });

  const accessToken = signAccessToken({
    userId: updatedUser.id,
    role: updatedUser.role
  });

  return res.json({
    message: "Role switched successfully",
    accessToken,
    token: accessToken,
    user: updatedUser
  });
});
