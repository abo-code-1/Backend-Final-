import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getSavedSearches = asyncHandler(async (req, res) => {
  const items = await prisma.savedSearch.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" }
  });

  return res.json({ items });
});

export const createSavedSearch = asyncHandler(async (req, res) => {
  const { name, filterJson } = req.body;
  if (!name || !filterJson || typeof filterJson !== "object") {
    return res.status(400).json({ message: "name and filterJson are required" });
  }

  const item = await prisma.savedSearch.create({
    data: {
      userId: req.user.id,
      name,
      filterJson
    }
  });

  return res.status(201).json({ message: "Saved search created", item });
});
