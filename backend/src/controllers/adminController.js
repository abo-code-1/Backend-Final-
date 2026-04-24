import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const parseId = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

export const getAdminStats = asyncHandler(async (_req, res) => {
  const [users, listings, applications, pendingListings, pendingVerifications] =
    await Promise.all([
      prisma.user.count(),
      prisma.listing.count(),
      prisma.application.count(),
      prisma.listing.count({ where: { isApproved: false } }),
      prisma.idVerification.count({ where: { status: "pending" } })
    ]);

  return res.json({
    item: { users, listings, applications, pendingListings, pendingVerifications }
  });
});

export const getAdminUsers = asyncHandler(async (req, res) => {
  const { role, search } = req.query;
  const items = await prisma.user.findMany({
    where: {
      role: role || undefined,
      OR: search
        ? [
            { fullName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } }
          ]
        : undefined
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isBanned: true,
      isPhoneVerified: true,
      isIdVerified: true,
      createdAt: true
    },
    orderBy: { createdAt: "desc" }
  });

  return res.json({ items });
});

export const setUserBan = asyncHandler(async (req, res) => {
  const userId = parseId(req.params.id);
  if (!userId) return res.status(400).json({ message: "Invalid user id" });

  const { isBanned } = req.body;
  const item = await prisma.user.update({
    where: { id: userId },
    data: { isBanned: Boolean(isBanned) },
    select: { id: true, fullName: true, isBanned: true }
  });
  return res.json({ message: "User ban status updated", item });
});

export const setUserRole = asyncHandler(async (req, res) => {
  const userId = parseId(req.params.id);
  if (!userId) return res.status(400).json({ message: "Invalid user id" });

  const { role } = req.body;
  if (!["seeker", "host", "admin"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  const item = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, fullName: true, role: true }
  });
  return res.json({ message: "User role updated", item });
});

export const getPendingListings = asyncHandler(async (_req, res) => {
  const items = await prisma.listing.findMany({
    where: { isApproved: false },
    include: {
      host: {
        select: { id: true, fullName: true, email: true, isIdVerified: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });
  return res.json({ items });
});

export const moderateListing = asyncHandler(async (req, res) => {
  const listingId = parseId(req.params.id);
  if (!listingId) return res.status(400).json({ message: "Invalid listing id" });

  const { approved } = req.body;
  const item = await prisma.listing.update({
    where: { id: listingId },
    data: {
      isApproved: Boolean(approved),
      status: approved ? "active" : "archived"
    }
  });
  return res.json({ message: "Listing moderation updated", item });
});

export const getPendingVerifications = asyncHandler(async (_req, res) => {
  const items = await prisma.idVerification.findMany({
    where: { status: "pending" },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          isIdVerified: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
  return res.json({ items });
});

export const reviewVerification = asyncHandler(async (req, res) => {
  const verificationId = parseId(req.params.id);
  if (!verificationId) return res.status(400).json({ message: "Invalid verification id" });

  const { status, adminNote } = req.body;
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Status must be approved or rejected" });
  }

  const verification = await prisma.idVerification.update({
    where: { id: verificationId },
    data: {
      status,
      adminNote: adminNote || null
    }
  });

  await prisma.user.update({
    where: { id: verification.userId },
    data: { isIdVerified: status === "approved" }
  });

  return res.json({ message: "Verification reviewed", item: verification });
});
