import { Router } from "express";
import {
  createSavedSearch,
  getSavedSearches
} from "../controllers/savedSearchController.js";
import { requireAuth } from "../middleware/auth.js";

const savedSearchRouter = Router();

savedSearchRouter.get("/saved-searches", requireAuth, getSavedSearches);
savedSearchRouter.post("/saved-searches", requireAuth, createSavedSearch);

export default savedSearchRouter;
