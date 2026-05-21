import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const signAccessToken = (payload) =>
  jwt.sign(payload, env.jwtSecret, { expiresIn: env.accessTokenTtl });

export const verifyAccessToken = (token) => jwt.verify(token, env.jwtSecret);

export const signRefreshToken = (payload) =>
  jwt.sign(
    { ...payload, jti: crypto.randomBytes(16).toString("hex") },
    env.jwtRefreshSecret,
    { expiresIn: env.refreshTokenTtl }
  );

export const verifyRefreshToken = (token) =>
  jwt.verify(token, env.jwtRefreshSecret);

export const hashRefreshToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

// kept for backwards-compat references
export const signToken = signAccessToken;
export const verifyToken = verifyAccessToken;
