import prismaPkg from "@prisma/client";
import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { listingSchema } from "../validators/zodSchemas.js";
import { parsePagination, buildPaginationMeta } from "../utils/pagination.js";
import { isAdminLevel } from "../utils/roles.js";

const { Prisma } = prismaPkg;

const parseBoolean = (value) => {
  if (value === undefined) return undefined;
  if (value === "true" || value === true) return true;
  if (value === "false" || value === false) return false;
  return undefined;
};

const decimalOrUndefined = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : new Prisma.Decimal(parsed);
};

const intOrUndefined = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const listingInclude = {
  host: {
    select: {
      id: true,
      fullName: true,
      avatarUrl: true,
      isPhoneVerified: true,
      isIdVerified: true
    }
  },
  bills: true,
  houseRules: { orderBy: { orderIndex: "asc" } },
  _count: { select: { applications: true, favorites: true } }
};

const ensureHostOrAdmin = (user) =>
  user && (user.role === "host" || isAdminLevel(user.role));

const canAccessListingMutation = (user, listingHostId) =>
  isAdminLevel(user.role) || user.id === listingHostId;

export const getListings = asyncHandler(async (req, res) => {
  const {
    city,
    district,
    minPrice,
    maxPrice,
    minDeposit,
    maxDeposit,
    totalRooms,
    availableRooms,
    furnished,
    internetIncluded,
    minStayMonths,
    currentOccupants,
    maxOccupants,
    petsAllowed,
    smokingAllowed,
    genderPreference,
    minAge,
    maxAge,
    verifiedHostsOnly,
    hasPhotos,
    availableFrom,
    status,
    isApproved,
    sort = "newest",
    page = "1",
    limit = "12",
    cursor
  } = req.query;

  const normalizedCity = typeof city === "string" ? city.trim() : city;
  const normalizedDistrict =
    typeof district === "string" ? district.trim() : district;

  const where = {
    city: normalizedCity
      ? { equals: normalizedCity, mode: "insensitive" }
      : undefined,
    district: normalizedDistrict
      ? { contains: normalizedDistrict, mode: "insensitive" }
      : undefined,
    monthlyRent: {
      gte: decimalOrUndefined(minPrice),
      lte: decimalOrUndefined(maxPrice)
    },
    deposit: {
      gte: decimalOrUndefined(minDeposit),
      lte: decimalOrUndefined(maxDeposit)
    },
    totalRooms: totalRooms ? intOrUndefined(totalRooms) : undefined,
    availableRooms: availableRooms ? intOrUndefined(availableRooms) : undefined,
    furnished: parseBoolean(furnished),
    internetIncluded: parseBoolean(internetIncluded),
    minStayMonths: minStayMonths ? { gte: intOrUndefined(minStayMonths) } : undefined,
    currentOccupants: currentOccupants ? { lte: intOrUndefined(currentOccupants) } : undefined,
    maxOccupants: maxOccupants ? { gte: intOrUndefined(maxOccupants) } : undefined,
    petsAllowed: parseBoolean(petsAllowed),
    smokingAllowed: smokingAllowed || undefined,
    genderPreference: genderPreference || undefined,
    minAge: minAge ? { gte: intOrUndefined(minAge) } : undefined,
    maxAge: maxAge ? { lte: intOrUndefined(maxAge) } : undefined,
    availableFrom: availableFrom ? { lte: new Date(availableFrom) } : undefined,
    status: status || "active",
    isApproved:
      isApproved !== undefined ? parseBoolean(isApproved) : true,
    photos: parseBoolean(hasPhotos) ? { isEmpty: false } : undefined,
    host: parseBoolean(verifiedHostsOnly)
      ? { isIdVerified: true, isPhoneVerified: true }
      : undefined
  };

  const orderBy =
    sort === "price_asc"
      ? { monthlyRent: "asc" }
      : sort === "price_desc"
        ? { monthlyRent: "desc" }
        : { createdAt: "desc" };

  const safePage = Math.max(intOrUndefined(page) || 1, 1);
  const safeLimit = Math.min(Math.max(intOrUndefined(limit) || 12, 1), 50);

  // Cursor-based pagination: client passes the previous page's nextCursor.
  // Stable order required, so we always tiebreak by id.
  const cursorId = cursor ? intOrUndefined(cursor) : undefined;
  if (cursorId !== undefined) {
    const items = await prisma.listing.findMany({
      where,
      include: listingInclude,
      orderBy: [orderBy, { id: "desc" }],
      take: safeLimit + 1,
      cursor: { id: cursorId },
      skip: 1
    });
    const hasMore = items.length > safeLimit;
    const page = hasMore ? items.slice(0, safeLimit) : items;
    return res.json({
      items: page,
      pagination: {
        limit: safeLimit,
        nextCursor: hasMore ? page[page.length - 1].id : null
      }
    });
  }

  const skip = (safePage - 1) * safeLimit;
  const [items, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: listingInclude,
      orderBy: [orderBy, { id: "desc" }],
      skip,
      take: safeLimit
    }),
    prisma.listing.count({ where })
  ]);

  return res.json({
    items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
      nextCursor: items.length === safeLimit ? items[items.length - 1].id : null
    }
  });
});

export const getListingById = asyncHandler(async (req, res) => {
  const listingId = intOrUndefined(req.params.id);
  if (!listingId) {
    return res.status(400).json({ message: "Invalid listing id" });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: listingInclude
  });

  if (!listing) {
    return res.status(404).json({ message: "Listing not found" });
  }

  return res.json({ item: listing });
});

export const getMyListings = asyncHandler(async (req, res) => {
  if (!ensureHostOrAdmin(req.user)) {
    return res.status(403).json({ message: "Only host/admin can view own listings" });
  }

  const where = isAdminLevel(req.user.role) ? undefined : { hostId: req.user.id };
  const { skip, take, page, limit } = parsePagination(req.query);
  const [items, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: listingInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take
    }),
    prisma.listing.count({ where })
  ]);

  return res.json({ items, pagination: buildPaginationMeta({ page, limit, total }) });
});

export const createListing = asyncHandler(async (req, res) => {
  if (!ensureHostOrAdmin(req.user)) {
    return res.status(403).json({ message: "Only host/admin can create listings" });
  }

  const validatedData = listingSchema.parse(req.body);

  const {
    title,
    description,
    city,
    district,
    address,
    latitude,
    longitude,
    monthlyRent,
    deposit,
    totalRooms,
    availableRooms,
    currentOccupants,
    maxOccupants,
    petsAllowed,
    smokingAllowed,
    genderPreference,
    minAge,
    maxAge,
    furnished,
    internetIncluded,
    availableFrom,
    minStayMonths,
    photos,
    status,
    bills,
    houseRules
  } = validatedData;

  const created = await prisma.listing.create({
    data: {
      hostId: req.user.id,
      title,
      description,
      city,
      district,
      address,
      latitude: latitude !== undefined ? Number(latitude) : undefined,
      longitude: longitude !== undefined ? Number(longitude) : undefined,
      monthlyRent: new Prisma.Decimal(monthlyRent),
      deposit: deposit !== undefined ? new Prisma.Decimal(deposit) : undefined,
      totalRooms: totalRooms || 1,
      availableRooms: availableRooms || 1,
      currentOccupants: currentOccupants || 0,
      maxOccupants: maxOccupants || 1,
      petsAllowed: petsAllowed ?? false,
      smokingAllowed: smokingAllowed || undefined,
      genderPreference: genderPreference || "any",
      minAge,
      maxAge,
      furnished: furnished ?? false,
      internetIncluded: internetIncluded ?? false,
      availableFrom: availableFrom ? new Date(availableFrom) : undefined,
      minStayMonths,
      photos: photos || [],
      status: status || "draft",
      // Listings go live immediately instead of waiting on manual moderation;
      // admins can still un-approve/archive via the moderation endpoint.
      isApproved: true,
      bills: Array.isArray(bills) && bills.length
        ? {
            create: bills.map((bill) => ({
              category: bill.category || "other",
              label: bill.label || "Bill",
              amountKzt: new Prisma.Decimal(bill.amountKzt || 0),
              isIncludedInRent: Boolean(bill.isIncludedInRent),
              notes: bill.notes || null
            }))
          }
        : undefined,
      houseRules: Array.isArray(houseRules) && houseRules.length
        ? {
            create: houseRules.map((rule, index) => ({
              ruleText: rule.ruleText || "",
              orderIndex: rule.orderIndex ?? index
            }))
          }
        : undefined
    },
    include: listingInclude
  });

  return res.status(201).json({ message: "Listing created", item: created });
});

export const updateListing = asyncHandler(async (req, res) => {
  const listingId = intOrUndefined(req.params.id);
  if (!listingId) {
    return res.status(400).json({ message: "Invalid listing id" });
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) {
    return res.status(404).json({ message: "Listing not found" });
  }

  if (!canAccessListingMutation(req.user, listing.hostId)) {
    return res.status(403).json({ message: "Not allowed to update this listing" });
  }

  const validatedData = listingSchema.partial().parse(req.body);
  const data = { ...validatedData };

  const nextBills = Array.isArray(data.bills) ? data.bills : null;
  const nextHouseRules = Array.isArray(data.houseRules) ? data.houseRules : null;
  delete data.bills;
  delete data.houseRules;

  if (data.monthlyRent !== undefined) data.monthlyRent = new Prisma.Decimal(data.monthlyRent);
  if (data.deposit !== undefined) data.deposit = new Prisma.Decimal(data.deposit);
  if (data.isApproved !== undefined && !isAdminLevel(req.user.role)) delete data.isApproved;
  if (data.hostId !== undefined) delete data.hostId;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.listing.update({
      where: { id: listingId },
      data
    });

    if (nextBills) {
      await tx.bill.deleteMany({ where: { listingId } });
      if (nextBills.length > 0) {
        await tx.bill.createMany({
          data: nextBills.map((bill) => ({
            listingId,
            category: bill.category || "other",
            label: bill.label || "Bill",
            amountKzt: new Prisma.Decimal(bill.amountKzt || 0),
            isIncludedInRent: Boolean(bill.isIncludedInRent),
            notes: bill.notes || null
          }))
        });
      }
    }

    if (nextHouseRules) {
      await tx.houseRule.deleteMany({ where: { listingId } });
      if (nextHouseRules.length > 0) {
        await tx.houseRule.createMany({
          data: nextHouseRules
            .filter((rule) => rule.ruleText)
            .map((rule, index) => ({
              listingId,
              ruleText: rule.ruleText,
              orderIndex: rule.orderIndex ?? index
            }))
        });
      }
    }

    return tx.listing.findUnique({
      where: { id: listingId },
      include: listingInclude
    });
  });

  return res.json({ message: "Listing updated", item: updated });
});

export const deleteListing = asyncHandler(async (req, res) => {
  const listingId = intOrUndefined(req.params.id);
  if (!listingId) {
    return res.status(400).json({ message: "Invalid listing id" });
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) {
    return res.status(404).json({ message: "Listing not found" });
  }

  if (!canAccessListingMutation(req.user, listing.hostId)) {
    return res.status(403).json({ message: "Not allowed to delete this listing" });
  }

  await prisma.listing.delete({ where: { id: listingId } });
  return res.json({ message: "Listing deleted" });
});
