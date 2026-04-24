import { Router } from "express";
import {
  createBill,
  deleteBill,
  getListingBills,
  updateBill
} from "../controllers/billController.js";
import { requireAuth } from "../middleware/auth.js";

const billRouter = Router();

billRouter.get("/listings/:listingId/bills", getListingBills);
billRouter.post("/listings/:listingId/bills", requireAuth, createBill);
billRouter.patch("/bills/:id", requireAuth, updateBill);
billRouter.delete("/bills/:id", requireAuth, deleteBill);

export default billRouter;
