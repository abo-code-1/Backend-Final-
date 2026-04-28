import { prisma } from "../config/db.js";
import { verifyAccessToken } from "../utils/jwt.js";

const unauthorized = (res, code, message) =>
  res.status(401).json({ message, error: { code, message } });

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return unauthorized(res, "AUTH_REQUIRED", "Authentication required");
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isPhoneVerified: true,
        isIdVerified: true,
        isBanned: true
      }
    });

    if (!user) {
      return unauthorized(res, "INVALID_TOKEN_USER", "Invalid token user");
    }
    if (user.isBanned) {
      return res.status(403).json({
        message: "User is banned",
        error: { code: "USER_BANNED", message: "User is banned" }
      });
    }

    req.user = user;
    return next();
  } catch (_error) {
    return unauthorized(res, "INVALID_TOKEN", "Invalid or expired token");
  }
};
