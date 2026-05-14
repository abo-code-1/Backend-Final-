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
  loginSchema,
  refreshSchema,
  registerSchema,
  updateProfileSchema,
  verifyOtpSchema
} from "../validators/zodSchemas.js";
import {
  checkOtp,
  isTwilioConfigured,
  sendOtp
} from "../services/twilioService.js";

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
  const { email, password, fullName, phone, role = "seeker" } = validatedData;

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

  // Best-effort: kick off SMS OTP send. Failures should not block registration —
  // the client can call /auth/phone/send-otp to retry.
  let otpDispatched = false;
  let otpError = null;
  try {
    await sendOtp(phone);
    otpDispatched = true;
  } catch (e) {
    otpError = e?.message || "Failed to send OTP";
    // eslint-disable-next-line no-console
    console.error("[twilio] sendOtp on register failed:", otpError);
  }

  return res.status(201).json({
    message: "Registered successfully",
    accessToken,
    refreshToken,
    token: accessToken,
    user,
    phoneVerification: {
      required: true,
      dispatched: otpDispatched,
      mock: !isTwilioConfigured(),
      error: otpError
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

export const sendPhoneOtp = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, phone: true, isPhoneVerified: true }
  });

  if (!user?.phone) {
    const message = "No phone number on file";
    return res.status(400).json({
      message,
      error: { code: "NO_PHONE", message }
    });
  }
  if (user.isPhoneVerified) {
    return res.json({
      message: "Phone already verified",
      alreadyVerified: true
    });
  }

  try {
    const result = await sendOtp(user.phone);
    return res.json({
      message: "OTP sent",
      status: result.status,
      mock: result.mock || false
    });
  } catch (e) {
    const message = e?.message || "Failed to send OTP";
    return res.status(502).json({
      message,
      error: { code: "OTP_SEND_FAILED", message }
    });
  }
});

export const verifyPhoneOtp = asyncHandler(async (req, res) => {
  const { code } = verifyOtpSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, phone: true, isPhoneVerified: true }
  });

  if (!user?.phone) {
    const message = "No phone number on file";
    return res.status(400).json({
      message,
      error: { code: "NO_PHONE", message }
    });
  }
  if (user.isPhoneVerified) {
    const updated = await prisma.user.findUnique({
      where: { id: user.id },
      select: authUserSelect
    });
    return res.json({
      message: "Phone already verified",
      alreadyVerified: true,
      user: updated
    });
  }

  let result;
  try {
    result = await checkOtp(user.phone, code);
  } catch (e) {
    const message = e?.message || "Failed to check OTP";
    return res.status(502).json({
      message,
      error: { code: "OTP_CHECK_FAILED", message }
    });
  }

  if (result.status !== "approved") {
    const message = "Invalid or expired code";
    return res.status(400).json({
      message,
      error: { code: "INVALID_OTP", message }
    });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { isPhoneVerified: true },
    select: authUserSelect
  });

  return res.json({
    message: "Phone verified successfully",
    user: updated
  });
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
