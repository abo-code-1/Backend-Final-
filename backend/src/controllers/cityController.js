import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { cityCreateSchema, cityUpdateSchema } from "../validators/zodSchemas.js";

const parseId = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const orderBy = [{ sortOrder: "asc" }, { nameRu: "asc" }];

// Count listings still referencing a city slug (listings store the slug as a
// plain string, so a delete/slug-change would orphan them in the UI filters).
const listingsUsingSlug = (slug) =>
  prisma.listing.count({ where: { city: { equals: slug, mode: "insensitive" } } });

// Public: active cities only, for dropdowns / home page.
export const listCities = asyncHandler(async (_req, res) => {
  const items = await prisma.city.findMany({ where: { isActive: true }, orderBy });
  return res.json({ items });
});

// super_admin: every city, including deactivated ones, for management.
export const listAllCities = asyncHandler(async (_req, res) => {
  const items = await prisma.city.findMany({ orderBy });
  return res.json({ items });
});

export const createCity = asyncHandler(async (req, res) => {
  const data = cityCreateSchema.parse(req.body);
  const slug = data.slug.toLowerCase();

  const existing = await prisma.city.findUnique({ where: { slug } });
  if (existing) {
    return res
      .status(409)
      .json({ message: `Город со слагом «${slug}» уже существует` });
  }

  const item = await prisma.city.create({
    data: {
      slug,
      nameRu: data.nameRu,
      nameKk: data.nameKk || null,
      imageUrl: data.imageUrl || null,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
    },
  });
  return res.status(201).json({ message: "Город создан", item });
});

export const updateCity = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid city id" });

  const data = cityUpdateSchema.parse(req.body);
  const city = await prisma.city.findUnique({ where: { id } });
  if (!city) return res.status(404).json({ message: "Город не найден" });

  // Changing the slug would detach existing listings from the city — block it
  // while any listing still references the old slug.
  if (data.slug && data.slug.toLowerCase() !== city.slug) {
    const inUse = await listingsUsingSlug(city.slug);
    if (inUse > 0) {
      return res.status(409).json({
        message: `Нельзя сменить слаг: ${inUse} объявлений ссылаются на «${city.slug}».`,
      });
    }
    const clash = await prisma.city.findUnique({
      where: { slug: data.slug.toLowerCase() },
    });
    if (clash) {
      return res.status(409).json({ message: "Город с таким слагом уже существует" });
    }
  }

  const item = await prisma.city.update({
    where: { id },
    data: {
      ...(data.slug ? { slug: data.slug.toLowerCase() } : {}),
      ...(data.nameRu !== undefined ? { nameRu: data.nameRu } : {}),
      ...(data.nameKk !== undefined ? { nameKk: data.nameKk || null } : {}),
      ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl || null } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
    },
  });
  return res.json({ message: "Город обновлён", item });
});

export const deleteCity = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid city id" });

  const city = await prisma.city.findUnique({ where: { id } });
  if (!city) return res.status(404).json({ message: "Город не найден" });

  const inUse = await listingsUsingSlug(city.slug);
  if (inUse > 0) {
    return res.status(409).json({
      message: `Нельзя удалить: ${inUse} объявлений в этом городе. Деактивируйте город вместо удаления.`,
      inUse,
    });
  }

  await prisma.city.delete({ where: { id } });
  return res.json({ message: "Город удалён", item: { id } });
});
