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
authRouter.post("/email/request-code", requireAuth, requestEmailCode);
authRouter.post("/email/verify", requireAuth, verifyEmailCode);

export default authRouter;
