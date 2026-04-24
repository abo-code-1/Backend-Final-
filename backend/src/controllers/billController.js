import prismaPkg from "@prisma/client";
import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const { Prisma } = prismaPkg;

const intOrUndefined = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const canMutate = (user, hostId) => user.role === "admin" || user.id === hostId;

export const getListingBills = asyncHandler(async (req, res) => {
  const listingId = intOrUndefined(req.params.listingId);
  if (!listingId) {
    return res.status(400).json({ message: "Invalid listing id" });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true }
  });
  if (!listing) {
    return res.status(404).json({ message: "Listing not found" });
  }

  const items = await prisma.bill.findMany({
    where: { listingId },
    orderBy: [{ isIncludedInRent: "desc" }, { amountKzt: "asc" }]
  });

  return res.json({ items });
});

export const createBill = asyncHandler(async (req, res) => {
  const listingId = intOrUndefined(req.params.listingId);
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
  if (!canMutate(req.user, listing.hostId)) {
    return res.status(403).json({ message: "Not allowed to add bill to this listing" });
  }

  const { category, label, amountKzt, isIncludedInRent, notes } = req.body;
  if (!label || amountKzt === undefined) {
    return res.status(400).json({ message: "label and amountKzt are required" });
  }

  const item = await prisma.bill.create({
    data: {
      listingId,
      category: category || "other",
      label,
      amountKzt: new Prisma.Decimal(amountKzt),
      isIncludedInRent: Boolean(isIncludedInRent),
      notes: notes || null
    }
  });

  return res.status(201).json({ message: "Bill created", item });
});

export const updateBill = asyncHandler(async (req, res) => {
  const billId = intOrUndefined(req.params.id);
  if (!billId) {
    return res.status(400).json({ message: "Invalid bill id" });
  }

  const bill = await prisma.bill.findUnique({
    where: { id: billId },
    include: { listing: { select: { hostId: true } } }
  });
  if (!bill) {
    return res.status(404).json({ message: "Bill not found" });
  }
  if (!canMutate(req.user, bill.listing.hostId)) {
    return res.status(403).json({ message: "Not allowed to update this bill" });
  }

  const data = { ...req.body };
  if (data.amountKzt !== undefined) data.amountKzt = new Prisma.Decimal(data.amountKzt);
  if (data.isIncludedInRent !== undefined) {
    data.isIncludedInRent = Boolean(data.isIncludedInRent);
  }

  const item = await prisma.bill.update({
    where: { id: billId },
    data
  });

  return res.json({ message: "Bill updated", item });
});

export const deleteBill = asyncHandler(async (req, res) => {
  const billId = intOrUndefined(req.params.id);
  if (!billId) {
    return res.status(400).json({ message: "Invalid bill id" });
  }

  const bill = await prisma.bill.findUnique({
    where: { id: billId },
    include: { listing: { select: { hostId: true } } }
  });
  if (!bill) {
    return res.status(404).json({ message: "Bill not found" });
  }
  if (!canMutate(req.user, bill.listing.hostId)) {
    return res.status(403).json({ message: "Not allowed to delete this bill" });
  }

  await prisma.bill.delete({ where: { id: billId } });
  return res.json({ message: "Bill deleted" });
});
