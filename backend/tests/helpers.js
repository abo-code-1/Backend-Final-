import { prisma } from "../src/config/db.js";

export const truncateAll = async () => {
  // CASCADE handles FK ordering; quoted identifiers because Postgres lowercases otherwise.
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "refresh_tokens",
      "email_verifications",
      "applications",
      "favorites",
      "saved_searches",
      "id_verifications",
      "house_rules",
      "bills",
      "reviews",
      "lifestyle_profiles",
      "listings",
      "users",
      "neighborhoods",
      "cities"
    RESTART IDENTITY CASCADE
  `);
};

export const closeDb = async () => {
  await prisma.$disconnect();
};
