import { Router } from "express";
import {
  changePassword,
  login,
  logout,
  me,
  refresh,
  register,
  switchRole,
  updateProfile
} from "../controllers/authController.js";
import {
  requestEmailCode,
  verifyEmailCode
} from "../controllers/emailVerificationController.js";
import { requireAuth } from "../middleware/auth.js";
import { authRateLimiter, emailRateLimiter } from "../middleware/rateLimit.js";

const authRouter = Router();

authRouter.post("/register", authRateLimiter, register);
authRouter.post("/login", authRateLimiter, login);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, me);
authRouter.patch("/me", requireAuth, updateProfile);
authRouter.post(
  "/change-password",
  authRateLimiter,
  requireAuth,
  changePassword
);
authRouter.patch("/switch-role", requireAuth, switchRole);
// Public: a freshly-registered user may not be logged in, so these can't
// require auth. They take the email in the body and flip isEmailVerified.
authRouter.post("/email/request-code", emailRateLimiter, requestEmailCode);
authRouter.post("/email/verify", emailRateLimiter, verifyEmailCode);

export default authRouter;
