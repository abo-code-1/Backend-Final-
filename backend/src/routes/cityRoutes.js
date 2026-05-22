import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireRoles } from "../middleware/roleCheck.js";
import {
  listCities,
  listAllCities,
  createCity,
  updateCity,
  deleteCity,
} from "../controllers/cityController.js";

const cityRouter = Router();
const superAdmin = [requireAuth, requireRoles("super_admin")];

// Public — drives the city dropdowns / home page tabs.
cityRouter.get("/", listCities);

// super_admin management.
cityRouter.get("/all", superAdmin, listAllCities);
cityRouter.post("/", superAdmin, createCity);
cityRouter.patch("/:id", superAdmin, updateCity);
cityRouter.delete("/:id", superAdmin, deleteCity);

export default cityRouter;
