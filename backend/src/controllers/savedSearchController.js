import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";

export const getSavedSearches = asyncHandler(async (req, res) => {
  const { skip, take, page, limit } = parsePagination(req.query);
  const where = { userId: req.user.id };
  const [items, total] = await Promise.all([
    prisma.savedSearch.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take
    }),
    prisma.savedSearch.count({ where })
  ]);

  return res.json({ items, pagination: buildPaginationMeta({ page, limit, total }) });
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
