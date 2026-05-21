import { Router } from "express";
import { login, me, register, switchRole } from "../controllers/authController.js";
import {
  requestEmailCode,
  verifyEmailCode
} from "../controllers/emailVerificationController.js";
import { requireAuth } from "../middleware/auth.js";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", requireAuth, me);
authRouter.patch("/switch-role", requireAuth, switchRole);
// Public: an unverified user isn't logged in yet, so these can't require auth.
authRouter.post("/email/request-code", requestEmailCode);
authRouter.post("/email/verify", verifyEmailCode);

export default authRouter;
