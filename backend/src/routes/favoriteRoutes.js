import { Router } from "express";
import {
  addFavorite,
  checkFavorite,
  getFavorites,
  removeFavorite
} from "../controllers/favoriteController.js";
import { requireAuth } from "../middleware/auth.js";

const favoriteRouter = Router();

favoriteRouter.get("/favorites", requireAuth, getFavorites);
favoriteRouter.get("/favorites/check", requireAuth, checkFavorite);
favoriteRouter.post("/favorites", requireAuth, addFavorite);
favoriteRouter.delete("/favorites/:listingId", requireAuth, removeFavorite);

export default favoriteRouter;
