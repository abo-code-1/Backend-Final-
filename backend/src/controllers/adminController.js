import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";
import { isSuperAdmin, ELEVATED_ROLES } from "../utils/roles.js";

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
  const { skip, take, page, limit } = parsePagination(req.query);
  const where = {
    role: role || undefined,
    OR: search
      ? [
          { fullName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } }
        ]
      : undefined
  };
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
      skip,
      take
    }),
    prisma.user.count({ where })
  ]);

  return res.json({ items, pagination: buildPaginationMeta({ page, limit, total }) });
});

export const setUserBan = asyncHandler(async (req, res) => {
  const userId = parseId(req.params.id);
  if (!userId) return res.status(400).json({ message: "Invalid user id" });

  if (userId === req.user.id) {
    return res.status(400).json({ message: "You cannot ban your own account" });
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true }
  });
  if (!target) return res.status(404).json({ message: "User not found" });

  // A super_admin account can only be touched by another super_admin.
  if (target.role === "super_admin" && !isSuperAdmin(req.user.role)) {
    return res
      .status(403)
      .json({ message: "Only a super admin can manage a super admin account" });
  }

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
  if (!["seeker", "host", "admin", "super_admin"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true }
  });
  if (!target) return res.status(404).json({ message: "User not found" });

  // Granting/revoking an elevated role (admin or super_admin), or changing a
  // user who already holds one, is reserved for super_admins.
  const touchesElevated =
    ELEVATED_ROLES.includes(role) || ELEVATED_ROLES.includes(target.role);
  if (touchesElevated && !isSuperAdmin(req.user.role)) {
    return res
      .status(403)
      .json({ message: "Only a super admin can manage admin roles" });
  }

  // Don't let a super_admin demote themselves and risk locking everyone out.
  if (userId === req.user.id && req.user.role === "super_admin" && role !== "super_admin") {
    return res
      .status(400)
      .json({ message: "You cannot change your own super admin role" });
  }

  const item = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, fullName: true, role: true }
  });
  return res.json({ message: "User role updated", item });
});

export const getPendingListings = asyncHandler(async (req, res) => {
  const { skip, take, page, limit } = parsePagination(req.query);
  const where = { isApproved: false };
  const [items, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: {
        host: {
          select: { id: true, fullName: true, email: true, isIdVerified: true }
        }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take
    }),
    prisma.listing.count({ where })
  ]);
  return res.json({ items, pagination: buildPaginationMeta({ page, limit, total }) });
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

export const getPendingVerifications = asyncHandler(async (req, res) => {
  const { skip, take, page, limit } = parsePagination(req.query);
  const where = { status: "pending" };
  const [items, total] = await Promise.all([
    prisma.idVerification.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
      skip,
      take
    }),
    prisma.idVerification.count({ where })
  ]);
  return res.json({ items, pagination: buildPaginationMeta({ page, limit, total }) });
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
