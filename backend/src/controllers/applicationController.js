import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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
