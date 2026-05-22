import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  neighborhoodCreateSchema,
  neighborhoodUpdateSchema,
} from "../validators/zodSchemas.js";

const parseId = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const byCityThenOrder = (a, b) =>
  (a.city.sortOrder ?? 0) - (b.city.sortOrder ?? 0) ||
  a.city.nameRu.localeCompare(b.city.nameRu, "ru") ||
  (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
  a.name.localeCompare(b.name, "ru");

const toResponse = ({ city, ...item }) => ({
  ...item,
  citySlug: city.slug,
  cityName: city.nameRu,
});

const listingsUsingNeighborhood = ({ citySlug, name }) =>
  prisma.listing.count({
    where: {
      city: { equals: citySlug, mode: "insensitive" },
      district: { equals: name, mode: "insensitive" },
    },
  });

const ensureCity = async (cityId) => {
  const city = await prisma.city.findUnique({ where: { id: cityId } });
  return city;
};

const findNameClash = ({ cityId, name, excludeId }) =>
  prisma.neighborhood.findFirst({
    where: {
      cityId,
      name: { equals: name, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

export const listNeighborhoods = asyncHandler(async (req, res) => {
  const citySlug =
    typeof req.query.city === "string" ? req.query.city.trim().toLowerCase() : "";

  const activeCities = await prisma.city.findMany({
    where: {
      isActive: true,
      ...(citySlug ? { slug: { equals: citySlug, mode: "insensitive" } } : {}),
    },
    select: { id: true },
  });

  if (activeCities.length === 0) {
    return res.json({ items: [] });
  }

  const rows = await prisma.neighborhood.findMany({
    where: {
      isActive: true,
      cityId: { in: activeCities.map((city) => city.id) },
    },
    include: { city: true },
  });

  return res.json({ items: rows.sort(byCityThenOrder).map(toResponse) });
});

export const listAllNeighborhoods = asyncHandler(async (_req, res) => {
  const rows = await prisma.neighborhood.findMany({ include: { city: true } });
  return res.json({ items: rows.sort(byCityThenOrder).map(toResponse) });
});

export const createNeighborhood = asyncHandler(async (req, res) => {
  const data = neighborhoodCreateSchema.parse(req.body);
  const city = await ensureCity(data.cityId);
  if (!city) return res.status(404).json({ message: "Город не найден" });

  const clash = await findNameClash({ cityId: city.id, name: data.name });
  if (clash) {
    return res.status(409).json({
      message: `Район «${data.name}» уже существует в городе «${city.nameRu}»`,
    });
  }

  const item = await prisma.neighborhood.create({
    data: {
      cityId: city.id,
      name: data.name,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      priceLabel: data.priceLabel || null,
      trendLabel: data.trendLabel || null,
      tags: data.tags || [],
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
    },
    include: { city: true },
  });

  return res
    .status(201)
    .json({ message: "Район создан", item: toResponse(item) });
});

export const updateNeighborhood = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid neighborhood id" });

  const data = neighborhoodUpdateSchema.parse(req.body);
  const neighborhood = await prisma.neighborhood.findUnique({
    where: { id },
    include: { city: true },
  });
  if (!neighborhood) return res.status(404).json({ message: "Район не найден" });

  const nextCityId = data.cityId ?? neighborhood.cityId;
  const nextName = data.name ?? neighborhood.name;

  let nextCity = neighborhood.city;
  if (data.cityId && data.cityId !== neighborhood.cityId) {
    nextCity = await ensureCity(data.cityId);
    if (!nextCity) return res.status(404).json({ message: "Город не найден" });
  }

  const changesListingKey =
    nextCityId !== neighborhood.cityId || nextName !== neighborhood.name;
  if (changesListingKey) {
    const inUse = await listingsUsingNeighborhood({
      citySlug: neighborhood.city.slug,
      name: neighborhood.name,
    });
    if (inUse > 0) {
      return res.status(409).json({
        message: `Нельзя сменить город или название: ${inUse} объявлений ссылаются на этот район.`,
      });
    }

    const clash = await findNameClash({
      cityId: nextCityId,
      name: nextName,
      excludeId: id,
    });
    if (clash) {
      return res.status(409).json({
        message: `Район «${nextName}» уже существует в городе «${nextCity.nameRu}»`,
      });
    }
  }

  const item = await prisma.neighborhood.update({
    where: { id },
    data: {
      ...(data.cityId !== undefined ? { cityId: data.cityId } : {}),
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined
        ? { description: data.description || null }
        : {}),
      ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl || null } : {}),
      ...(data.priceLabel !== undefined
        ? { priceLabel: data.priceLabel || null }
        : {}),
      ...(data.trendLabel !== undefined
        ? { trendLabel: data.trendLabel || null }
        : {}),
      ...(data.tags !== undefined ? { tags: data.tags } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
    },
    include: { city: true },
  });

  return res.json({ message: "Район обновлён", item: toResponse(item) });
});

export const deleteNeighborhood = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid neighborhood id" });

  const neighborhood = await prisma.neighborhood.findUnique({
    where: { id },
    include: { city: true },
  });
  if (!neighborhood) return res.status(404).json({ message: "Район не найден" });

  const inUse = await listingsUsingNeighborhood({
    citySlug: neighborhood.city.slug,
    name: neighborhood.name,
  });
  if (inUse > 0) {
    return res.status(409).json({
      message: `Нельзя удалить: ${inUse} объявлений ссылаются на этот район. Скрыть район можно без удаления.`,
      inUse,
    });
  }

  await prisma.neighborhood.delete({ where: { id } });
  return res.json({ message: "Район удалён", item: { id } });
});
