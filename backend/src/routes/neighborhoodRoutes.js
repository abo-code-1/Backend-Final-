import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRoles } from "../middleware/roleCheck.js";
import {
  createNeighborhood,
  deleteNeighborhood,
  listAllNeighborhoods,
  listNeighborhoods,
  updateNeighborhood,
} from "../controllers/neighborhoodController.js";

const neighborhoodRouter = Router();
const superAdmin = [requireAuth, requireRoles("super_admin")];

// Public — powers the "Районы" page and district discovery.
neighborhoodRouter.get("/", listNeighborhoods);

// super_admin management.
neighborhoodRouter.get("/all", superAdmin, listAllNeighborhoods);
neighborhoodRouter.post("/", superAdmin, createNeighborhood);
neighborhoodRouter.patch("/:id", superAdmin, updateNeighborhood);
neighborhoodRouter.delete("/:id", superAdmin, deleteNeighborhood);

export default neighborhoodRouter;
