import { Router } from "express";
import {
  createListing,
  deleteListing,
  getListingById,
  getListings,
  getMyListings,
  updateListing
} from "../controllers/listingController.js";
import { requireAuth } from "../middleware/auth.js";

const listingRouter = Router();

listingRouter.get("/", getListings);
listingRouter.get("/mine", requireAuth, getMyListings);
listingRouter.get("/:id", getListingById);
listingRouter.post("/", requireAuth, createListing);
listingRouter.patch("/:id", requireAuth, updateListing);
listingRouter.delete("/:id", requireAuth, deleteListing);

export default listingRouter;
