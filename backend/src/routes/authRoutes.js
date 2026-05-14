import { Router } from "express";
import {
  login,
  logout,
  me,
  refresh,
  register,
  sendPhoneOtp,
  switchRole,
  verifyPhoneOtp
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { authRateLimiter } from "../middleware/rateLimit.js";

const authRouter = Router();

authRouter.post("/register", authRateLimiter, register);
authRouter.post("/login", authRateLimiter, login);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, me);
authRouter.patch("/switch-role", requireAuth, switchRole);
authRouter.post("/phone/send-otp", authRateLimiter, requireAuth, sendPhoneOtp);
authRouter.post("/phone/verify-otp", authRateLimiter, requireAuth, verifyPhoneOtp);

export default authRouter;
