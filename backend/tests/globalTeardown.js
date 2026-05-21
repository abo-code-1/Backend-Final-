export default async function globalTeardown() {
  // Prisma client connections are closed per-suite via afterAll hooks;
  // nothing global to clean up here.
}
