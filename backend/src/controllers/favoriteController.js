import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";

const parseId = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

export const getFavorites = asyncHandler(async (req, res) => {
  const { skip, take, page, limit } = parsePagination(req.query);
  const where = { userId: req.user.id };
  const [items, total] = await Promise.all([
    prisma.favorite.findMany({
      where,
      include: {
        listing: {
          include: {
            host: {
              select: {
                id: true,
                fullName: true,
                isPhoneVerified: true,
                isIdVerified: true
              }
            }
          }
        }
      },
      orderBy: { id: "desc" },
      skip,
      take
    }),
    prisma.favorite.count({ where })
  ]);

  return res.json({ items, pagination: buildPaginationMeta({ page, limit, total }) });
});

export const checkFavorite = asyncHandler(async (req, res) => {
  const listingId = parseId(req.query.listingId);
  if (!listingId) {
    return res.status(400).json({ message: "Invalid listingId" });
  }

  const favorite = await prisma.favorite.findUnique({
    where: {
      userId_listingId: {
        userId: req.user.id,
        listingId
      }
    }
  });

  return res.json({ isFavorite: Boolean(favorite) });
});

export const addFavorite = asyncHandler(async (req, res) => {
  const listingId = parseId(req.body.listingId);
  if (!listingId) {
    return res.status(400).json({ message: "Invalid listingId" });
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) {
    return res.status(404).json({ message: "Listing not found" });
  }

  const item = await prisma.favorite.upsert({
    where: {
      userId_listingId: {
        userId: req.user.id,
        listingId
      }
    },
    update: {},
    create: {
      userId: req.user.id,
      listingId
    }
  });

  return res.status(201).json({ message: "Saved to favorites", item });
});

export const removeFavorite = asyncHandler(async (req, res) => {
  const listingId = parseId(req.params.listingId);
  if (!listingId) {
    return res.status(400).json({ message: "Invalid listingId" });
  }

  await prisma.favorite.deleteMany({
    where: {
      userId: req.user.id,
      listingId
    }
  });

  return res.json({ message: "Removed from favorites" });
});
