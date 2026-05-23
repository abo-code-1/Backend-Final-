import { prisma } from "../src/config/db.js";

export const truncateAll = async () => {
  // ORM-only cleanup (no raw SQL). Delete in FK-safe order: children before
  // parents. Tests don't depend on auto-increment IDs being reset.
  await prisma.emailJob.deleteMany();
  await prisma.review.deleteMany();
  await prisma.application.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.houseRule.deleteMany();
  await prisma.savedSearch.deleteMany();
  await prisma.idVerification.deleteMany();
  await prisma.emailVerification.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.lifestyleProfile.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();
  await prisma.neighborhood.deleteMany();
  await prisma.city.deleteMany();
};

export const closeDb = async () => {
  await prisma.$disconnect();
};
