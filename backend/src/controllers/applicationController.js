import { prisma } from "../config/db.js";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../middleware/errorHandler.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";
import { isAdminLevel } from "../utils/roles.js";
import { enqueueEmail } from "../services/emailQueue.js";

const parseId = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const listingUrl = (id) => `${env.clientUrl}/listings/${id}`;

export const createApplication = asyncHandler(async (req, res) => {
  const listingId = parseId(req.params.listingId);
  if (!listingId) {
    return res.status(400).json({ message: "Invalid listing id" });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      hostId: true,
      title: true,
      host: { select: { email: true, fullName: true } }
    }
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

  // Notify the host (background worker).
  const seeker = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { fullName: true }
  });
  await enqueueEmail("application_received", listing.host.email, {
    hostName: listing.host.fullName,
    seekerName: seeker?.fullName,
    listingTitle: listing.title,
    listingUrl: listingUrl(listing.id)
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
  if (listing.hostId !== req.user.id && !isAdminLevel(req.user.role)) {
    throw new HttpError(
      403,
      "FORBIDDEN",
      "Only the listing host or an admin may view its applicants"
    );
  }

  const { skip, take, page, limit } = parsePagination(req.query);
  const [items, total] = await Promise.all([
    prisma.application.findMany({
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
      orderBy: { createdAt: "desc" },
      skip,
      take
    }),
    prisma.application.count({ where: { listingId } })
  ]);

  return res.json({ listing, items, pagination: buildPaginationMeta({ page, limit, total }) });
});

export const getMyApplications = asyncHandler(async (req, res) => {
  const { skip, take, page, limit } = parsePagination(req.query);
  const where = { seekerId: req.user.id };
  const [items, total] = await Promise.all([
    prisma.application.findMany({
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
        }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take
    }),
    prisma.application.count({ where })
  ]);
  return res.json({ items, pagination: buildPaginationMeta({ page, limit, total }) });
});

/**
 * Atomically accepts an application (ORM-only, no raw SQL):
 *   - reads the listing to validate occupancy
 *   - claims a room with a guarded updateMany (availableRooms > 0):
 *     a single atomic write whose condition is re-checked under Postgres row
 *     locking, so two concurrent accepts on the last room can never both win
 *     (the loser matches 0 rows -> count 0 -> NO_ROOMS).
 *   - flips application.status to "accepted"
 */
export const acceptApplication = asyncHandler(async (req, res) => {
  const applicationId = parseId(req.params.id);
  if (!applicationId) {
    throw new HttpError(400, "INVALID_ID", "Invalid application id");
  }

  const result = await prisma.$transaction(async (tx) => {
    const app = await tx.application.findUnique({
      where: { id: applicationId },
      include: {
        listing: { select: { id: true, hostId: true, title: true } },
        seeker: { select: { email: true, fullName: true } }
      }
    });
    if (!app) throw new HttpError(404, "NOT_FOUND", "Application not found");
    if (app.listing.hostId !== req.user.id && !isAdminLevel(req.user.role)) {
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

    const listing = await tx.listing.findUnique({
      where: { id: app.listing.id },
      select: { availableRooms: true, currentOccupants: true, maxOccupants: true }
    });
    if (!listing) throw new HttpError(404, "NOT_FOUND", "Listing not found");
    if (listing.availableRooms <= 0) {
      throw new HttpError(409, "NO_ROOMS", "No available rooms remain on this listing");
    }
    if (listing.currentOccupants + 1 > listing.maxOccupants) {
      throw new HttpError(409, "MAX_OCCUPANTS", "Listing is at max occupancy");
    }

    // Atomic claim: only succeeds if a room is still free at write time.
    const claim = await tx.listing.updateMany({
      where: { id: app.listing.id, availableRooms: { gt: 0 } },
      data: {
        availableRooms: { decrement: 1 },
        currentOccupants: { increment: 1 }
      }
    });
    if (claim.count === 0) {
      throw new HttpError(409, "NO_ROOMS", "No available rooms remain on this listing");
    }

    const updated = await tx.application.update({
      where: { id: applicationId },
      data: { status: "accepted" }
    });
    return { updated, app };
  });

  await enqueueEmail("application_accepted", result.app.seeker.email, {
    seekerName: result.app.seeker.fullName,
    listingTitle: result.app.listing.title,
    listingUrl: listingUrl(result.app.listing.id)
  });

  return res.json({ message: "Application accepted", item: result.updated });
});

export const rejectApplication = asyncHandler(async (req, res) => {
  const applicationId = parseId(req.params.id);
  if (!applicationId) {
    throw new HttpError(400, "INVALID_ID", "Invalid application id");
  }

  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      listing: { select: { id: true, hostId: true, title: true } },
      seeker: { select: { email: true, fullName: true } }
    }
  });
  if (!app) throw new HttpError(404, "NOT_FOUND", "Application not found");
  if (app.listing.hostId !== req.user.id && !isAdminLevel(req.user.role)) {
    throw new HttpError(
      403,
      "FORBIDDEN",
      "Only the listing host or an admin may reject applications"
    );
  }

  if (app.status === "rejected") {
    return res.json({ message: "Application already rejected", item: app });
  }

  if (app.status === "accepted") {
    // If we reject an already accepted application, we must revert the room counts
    await prisma.$transaction([
      prisma.listing.update({
        where: { id: app.listing.id },
        data: {
          availableRooms: { increment: 1 },
          currentOccupants: { decrement: 1 }
        }
      }),
      prisma.application.update({
        where: { id: applicationId },
        data: { status: "rejected" }
      })
    ]);
  } else {
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: "rejected" }
    });
  }

  await enqueueEmail("application_rejected", app.seeker.email, {
    seekerName: app.seeker.fullName,
    listingTitle: app.listing.title
  });

  return res.json({ message: "Application rejected" });
});

export const withdrawApplication = asyncHandler(async (req, res) => {
  const applicationId = parseId(req.params.id);
  if (!applicationId) {
    return res.status(400).json({ message: "Invalid application id" });
  }

  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    select: { id: true, seekerId: true, status: true, listingId: true }
  });

  if (!app) {
    return res.status(404).json({ message: "Application not found" });
  }

  if (!isAdminLevel(req.user.role) && app.seekerId !== req.user.id) {
    return res.status(403).json({ message: "Not allowed to withdraw this application" });
  }

  if (app.status === "withdrawn") {
    return res.json({ message: "Application already withdrawn", item: app });
  }

  if (app.status === "accepted") {
    // If we withdraw an already accepted application, we must revert the room counts
    await prisma.$transaction([
      prisma.listing.update({
        where: { id: app.listingId },
        data: {
          availableRooms: { increment: 1 },
          currentOccupants: { decrement: 1 }
        }
      }),
      prisma.application.update({
        where: { id: applicationId },
        data: { status: "withdrawn" }
      })
    ]);
  } else {
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: "withdrawn" }
    });
  }

  return res.json({ message: "Application withdrawn" });
});
