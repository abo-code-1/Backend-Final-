import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it
} from "@jest/globals";
import request from "supertest";
import app from "../../src/index.js";
import { prisma } from "../../src/config/db.js";
import { closeDb, truncateAll } from "../helpers.js";

beforeEach(async () => {
  await truncateAll();
});
afterAll(async () => {
  await closeDb();
});

const registerUser = (overrides) =>
  request(app)
    .post("/api/auth/register")
    .send({
      password: "Sup3rStr0ng!",
      fullName: "User",
      ...overrides
    });

/**
 * Bootstraps: 1 host with 1 listing (availableRooms=1), N seekers with pending
 * applications. Returns { hostToken, listingId, seekers: [{token, appId}, ...] }
 */
const seedHostWithApplications = async (seekerCount) => {
  const host = await registerUser({
    email: "host@example.com",
    role: "host"
  });
  const listing = await request(app)
    .post("/api/listings")
    .set("Authorization", `Bearer ${host.body.accessToken}`)
    .send({
      title: "Last room available",
      description: "Only one bed left",
      city: "Almaty",
      monthlyRent: 200000,
      totalRooms: 3,
      availableRooms: 1,
      maxOccupants: 3
    });
  expect(listing.status).toBe(201);

  const seekers = [];
  for (let i = 0; i < seekerCount; i++) {
    const r = await registerUser({
      email: `seeker${i}@example.com`,
      role: "seeker"
    });
    const appRes = await request(app)
      .post(`/api/listings/${listing.body.item.id}/applications`)
      .set("Authorization", `Bearer ${r.body.accessToken}`)
      .send({ message: `Seeker ${i}` });
    expect(appRes.status).toBe(201);
    seekers.push({ token: r.body.accessToken, appId: appRes.body.item.id });
  }

  return {
    hostToken: host.body.accessToken,
    listingId: listing.body.item.id,
    seekers
  };
};

describe("Atomic accept-application transaction", () => {
  it("two concurrent accepts on the last room: exactly one wins, other gets 409", async () => {
    const { hostToken, listingId, seekers } = await seedHostWithApplications(2);

    const [r1, r2] = await Promise.all([
      request(app)
        .patch(`/api/applications/${seekers[0].appId}/accept`)
        .set("Authorization", `Bearer ${hostToken}`),
      request(app)
        .patch(`/api/applications/${seekers[1].appId}/accept`)
        .set("Authorization", `Bearer ${hostToken}`)
    ]);

    const statuses = [r1.status, r2.status].sort();
    // Either (200, 409) or (200, 409) — never (200, 200)
    expect(statuses).toEqual([200, 409]);

    const listing = await prisma.listing.findUnique({
      where: { id: listingId }
    });
    expect(listing.availableRooms).toBe(0);
    expect(listing.currentOccupants).toBe(1);

    const accepted = await prisma.application.count({
      where: { listingId, status: "accepted" }
    });
    expect(accepted).toBe(1);
  });

  it("rejects accept on listing with no available rooms", async () => {
    const { hostToken, listingId, seekers } = await seedHostWithApplications(1);

    const r1 = await request(app)
      .patch(`/api/applications/${seekers[0].appId}/accept`)
      .set("Authorization", `Bearer ${hostToken}`);
    expect(r1.status).toBe(200);

    // Manually create another pending application (DB direct), since the
    // unique (listingId, seekerId) prevents double-applying.
    const seekerB = await registerUser({
      email: "another@example.com",
      role: "seeker"
    });
    const appB = await request(app)
      .post(`/api/listings/${listingId}/applications`)
      .set("Authorization", `Bearer ${seekerB.body.accessToken}`)
      .send({ message: "me too" });

    const r2 = await request(app)
      .patch(`/api/applications/${appB.body.item.id}/accept`)
      .set("Authorization", `Bearer ${hostToken}`);
    expect(r2.status).toBe(409);
    expect(r2.body.error.code).toBe("NO_ROOMS");
  });
});
