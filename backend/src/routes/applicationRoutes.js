import { Router } from "express";
import {
  acceptApplication,
  createApplication,
  getListingApplications,
  getMyApplications,
  rejectApplication,
  withdrawApplication
} from "../controllers/applicationController.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRoles } from "../middleware/roleCheck.js";

const applicationRouter = Router();

applicationRouter.post(
  "/listings/:listingId/applications",
  requireAuth,
  requireRoles("seeker", "admin"),
  createApplication
);
applicationRouter.get("/applications/me", requireAuth, getMyApplications);
applicationRouter.get(
  "/listings/:listingId/applications",
  requireAuth,
  requireRoles("host", "admin"),
  getListingApplications
);
applicationRouter.patch(
  "/applications/:id/withdraw",
  requireAuth,
  withdrawApplication
);
applicationRouter.patch(
  "/applications/:id/accept",
  requireAuth,
  requireRoles("host", "admin"),
  acceptApplication
);
applicationRouter.patch(
  "/applications/:id/reject",
  requireAuth,
  requireRoles("host", "admin"),
  rejectApplication
);

export default applicationRouter;
