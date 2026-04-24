import { Router } from "express";
import {
  createApplication,
  getMyApplications,
  withdrawApplication
} from "../controllers/applicationController.js";
import { requireAuth } from "../middleware/auth.js";

const applicationRouter = Router();

applicationRouter.post("/listings/:listingId/applications", requireAuth, createApplication);
applicationRouter.get("/applications/me", requireAuth, getMyApplications);
applicationRouter.patch("/applications/:id/withdraw", requireAuth, withdrawApplication);

export default applicationRouter;
