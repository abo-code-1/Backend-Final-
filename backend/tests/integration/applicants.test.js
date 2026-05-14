import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it
} from "@jest/globals";
import request from "supertest";
import app from "../../src/index.js";
import { closeDb, truncateAll } from "../helpers.js";

beforeEach(async () => {
  await truncateAll();
});
afterAll(async () => {
  await closeDb();
});

let seq = 0;
const registerUser = (overrides = {}) => {
  seq += 1;
  return request(app)
    .post("/api/auth/register")
    .send({
      email: `applicants-u${seq}@example.com`,
      password: "Sup3rStr0ng!",
      fullName: `User ${seq}`,
      role: "seeker",
      phone: `+7702${String(seq).padStart(7, "0")}`,
      ...overrides
    });
};

const createListing = (token) =>
  request(app)
    .post("/api/listings")
    .set("Authorization", `Bearer ${token}`)
    .send({
      title: "Bright room near center",
      description: "Sunny 14m² room with a desk",
      city: "Almaty",
      monthlyRent: 180000,
      totalRooms: 3,
      availableRooms: 2,
      maxOccupants: 3
    });

const applyTo = (token, listingId, message) =>
  request(app)
    .post(`/api/listings/${listingId}/applications`)
    .set("Authorization", `Bearer ${token}`)
    .send({ message });

describe("GET /api/listings/:listingId/applications", () => {
  it("lets the listing host see its applicants with seeker info", async () => {
    const host = await registerUser({ role: "host" });
    const seeker = await registerUser({ role: "seeker" });

    const listing = await createListing(host.body.accessToken);
    expect(listing.status).toBe(201);
    const listingId = listing.body.item.id;

    await applyTo(seeker.body.accessToken, listingId, "I'd love this room");

    const res = await request(app)
      .get(`/api/listings/${listingId}/applications`)
      .set("Authorization", `Bearer ${host.body.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.listing.id).toBe(listingId);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].message).toBe("I'd love this room");
    expect(res.body.items[0].seeker.fullName).toEqual(expect.any(String));
    expect(res.body.items[0].seeker).not.toHaveProperty("passwordHash");
  });

  it("forbids a different host from viewing another host's applicants", async () => {
    const host = await registerUser({ role: "host" });
    const otherHost = await registerUser({ role: "host" });

    const listing = await createListing(host.body.accessToken);
    const listingId = listing.body.item.id;

    const res = await request(app)
      .get(`/api/listings/${listingId}/applications`)
      .set("Authorization", `Bearer ${otherHost.body.accessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("returns an empty list when nobody has applied yet", async () => {
    const host = await registerUser({ role: "host" });
    const listing = await createListing(host.body.accessToken);

    const res = await request(app)
      .get(`/api/listings/${listing.body.item.id}/applications`)
      .set("Authorization", `Bearer ${host.body.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  it("returns 404 for a listing that does not exist", async () => {
    const host = await registerUser({ role: "host" });

    const res = await request(app)
      .get("/api/listings/999999/applications")
      .set("Authorization", `Bearer ${host.body.accessToken}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("rejects a seeker with 403 (role-gated)", async () => {
    const host = await registerUser({ role: "host" });
    const seeker = await registerUser({ role: "seeker" });

    const listing = await createListing(host.body.accessToken);
    const listingId = listing.body.item.id;

    const res = await request(app)
      .get(`/api/listings/${listingId}/applications`)
      .set("Authorization", `Bearer ${seeker.body.accessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN_ROLE");
  });

  it("requires authentication", async () => {
    const res = await request(app).get("/api/listings/1/applications");
    expect(res.status).toBe(401);
  });
});
