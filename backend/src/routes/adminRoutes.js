import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRoles } from "../middleware/roleCheck.js";
import {
  deleteUser,
  getAdminStats,
  getAdminUsers,
  getPendingListings,
  getPendingVerifications,
  moderateListing,
  reviewVerification,
  setUserBan,
  setUserRole
} from "../controllers/adminController.js";

const adminRouter = Router();

adminRouter.use(requireAuth, requireRoles("admin", "super_admin"));

adminRouter.get("/stats", getAdminStats);
adminRouter.get("/users", getAdminUsers);
adminRouter.patch("/users/:id/ban", setUserBan);
adminRouter.patch("/users/:id/role", setUserRole);
// Deleting an account is harsher than banning, so it is super-admin only.
adminRouter.delete("/users/:id", requireRoles("super_admin"), deleteUser);
adminRouter.get("/listings/pending", getPendingListings);
adminRouter.patch("/listings/:id/moderate", moderateListing);
adminRouter.get("/verifications/pending", getPendingVerifications);
adminRouter.patch("/verifications/:id/review", reviewVerification);

export default adminRouter;
