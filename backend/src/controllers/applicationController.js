import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../middleware/errorHandler.js";

const parseId = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

export const createApplication = asyncHandler(async (req, res) => {
  const listingId = parseId(req.params.listingId);
  if (!listingId) {
    return res.status(400).json({ message: "Invalid listing id" });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, hostId: true }
  });
  if (!listing) {
    return res.status(404).json({ message: "Listing not found" });
  }
  if (req.user.id === listing.hostId) {
    return res.status(400).json({ message: "You cannot apply to your own listing" });
  }

  const { message } = req.body;

  const item = await prisma.application.upsert({
    where: {
      listingId_seekerId: {
        listingId,
        seekerId: req.user.id
      }
    },
    update: {
      message: message || null,
      status: "pending"
    },
    create: {
      listingId,
      seekerId: req.user.id,
      message: message || null
    }
  });

  return res.status(201).json({ message: "Application sent", item });
});

export const getListingApplications = asyncHandler(async (req, res) => {
  const listingId = parseId(req.params.listingId);
  if (!listingId) {
    throw new HttpError(400, "INVALID_ID", "Invalid listing id");
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, hostId: true, title: true }
  });
  if (!listing) {
    throw new HttpError(404, "NOT_FOUND", "Listing not found");
  }
  if (listing.hostId !== req.user.id && req.user.role !== "admin") {
    throw new HttpError(
      403,
      "FORBIDDEN",
      "Only the listing host or an admin may view its applicants"
    );
  }

  const items = await prisma.application.findMany({
    where: { listingId },
    include: {
      seeker: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
          occupation: true,
          gender: true,
          isPhoneVerified: true,
          isIdVerified: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return res.json({ listing, items });
});

export const getMyApplications = asyncHandler(async (req, res) => {
  const items = await prisma.application.findMany({
    where: { seekerId: req.user.id },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          city: true,
          district: true,
          monthlyRent: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
  return res.json({ items });
});

// Unified host inbox: every application across all of the caller's listings.
// Admins see applications for every listing.
export const getReceivedApplications = asyncHandler(async (req, res) => {
  const where =
    req.user.role === "admin"
      ? {}
      : { listing: { hostId: req.user.id } };

  const items = await prisma.application.findMany({
    where,
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          city: true,
          district: true,
          monthlyRent: true
        }
      },
      seeker: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
          occupation: true,
          gender: true,
          isPhoneVerified: true,
          isIdVerified: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return res.json({ items });
});

/**
 * Atomically accepts an application:
 *   - SELECT FOR UPDATE on the listing row (row-level lock)
 *   - refuses if available_rooms <= 0
 *   - decrements available_rooms, increments current_occupants
 *   - flips application.status to "accepted"
 * Two concurrent accepts on the last room can never both succeed.
 */
export const acceptApplication = asyncHandler(async (req, res) => {
  const applicationId = parseId(req.params.id);
  if (!applicationId) {
    throw new HttpError(400, "INVALID_ID", "Invalid application id");
  }

  const result = await prisma.$transaction(
    async (tx) => {
      const app = await tx.application.findUnique({
        where: { id: applicationId },
        include: { listing: { select: { id: true, hostId: true } } }
      });
      if (!app) throw new HttpError(404, "NOT_FOUND", "Application not found");
      if (app.listing.hostId !== req.user.id && req.user.role !== "admin") {
        throw new HttpError(
          403,
          "FORBIDDEN",
          "Only the listing host or an admin may accept applications"
        );
      }
      if (app.status !== "pending") {
        throw new HttpError(
          409,
          "INVALID_STATE",
          `Application is already ${app.status}`
        );
      }

      const locked = await tx.$queryRaw`
        SELECT id, available_rooms, current_occupants, max_occupants
        FROM listings
        WHERE id = ${app.listing.id}
        FOR UPDATE
      `;
      const row = Array.isArray(locked) ? locked[0] : null;
      if (!row) throw new HttpError(404, "NOT_FOUND", "Listing not found");
      if (row.available_rooms <= 0) {
        throw new HttpError(
          409,
          "NO_ROOMS",
          "No available rooms remain on this listing"
        );
      }
      if (row.current_occupants + 1 > row.max_occupants) {
        throw new HttpError(
          409,
          "MAX_OCCUPANTS",
          "Listing is at max occupancy"
        );
      }

      await tx.listing.update({
        where: { id: app.listing.id },
        data: {
          availableRooms: { decrement: 1 },
          currentOccupants: { increment: 1 }
        }
      });
      const updated = await tx.application.update({
        where: { id: applicationId },
        data: { status: "accepted" }
      });
      return updated;
    }
  );

  return res.json({ message: "Application accepted", item: result });
});

export const rejectApplication = asyncHandler(async (req, res) => {
  const applicationId = parseId(req.params.id);
  if (!applicationId) {
    throw new HttpError(400, "INVALID_ID", "Invalid application id");
  }

  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { listing: { select: { hostId: true } } }
  });
  if (!app) throw new HttpError(404, "NOT_FOUND", "Application not found");
  if (app.listing.hostId !== req.user.id && req.user.role !== "admin") {
    throw new HttpError(
      403,
      "FORBIDDEN",
      "Only the listing host or an admin may reject applications"
    );
  }
  if (app.status !== "pending") {
    throw new HttpError(
      409,
      "INVALID_STATE",
      `Application is already ${app.status}`
    );
  }

  const item = await prisma.application.update({
    where: { id: applicationId },
    data: { status: "rejected" }
  });
  return res.json({ message: "Application rejected", item });
});

export const withdrawApplication = asyncHandler(async (req, res) => {
  const applicationId = parseId(req.params.id);
  if (!applicationId) {
    return res.status(400).json({ message: "Invalid application id" });
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    select: { id: true, seekerId: true }
  });

  if (!application) {
    return res.status(404).json({ message: "Application not found" });
  }

  if (req.user.role !== "admin" && application.seekerId !== req.user.id) {
    return res.status(403).json({ message: "Not allowed to withdraw this application" });
  }

  const item = await prisma.application.update({
    where: { id: applicationId },
    data: { status: "withdrawn" }
  });

  return res.json({ message: "Application withdrawn", item });
});
