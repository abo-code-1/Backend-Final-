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

let phoneCounter = 0;
const nextPhone = () => {
  phoneCounter += 1;
  return `+7700${String(phoneCounter).padStart(7, "0")}`;
};

const registerUser = (overrides = {}) =>
  request(app)
    .post("/api/auth/register")
    .send({
      email: "alice@example.com",
      password: "Sup3rStr0ng!",
      fullName: "Alice N.",
      role: "seeker",
      phone: nextPhone(),
      ...overrides
    });

describe("RBAC", () => {
  it("returns 401 when access token is missing on a protected route", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("AUTH_REQUIRED");
  });

  it("returns 401 when access token is invalid", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_TOKEN");
  });

  it("seeker cannot create a listing -> 403", async () => {
    const reg = await registerUser({
      email: "seeker@example.com",
      role: "seeker"
    });
    const res = await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${reg.body.accessToken}`)
      .send({
        title: "X",
        description: "Y",
        city: "Almaty",
        monthlyRent: 100000,
        totalRooms: 1,
        availableRooms: 1,
        maxOccupants: 1
      });
    // listingController gates with ensureHostOrAdmin, returning 403
    expect(res.status).toBe(403);
  });

  it("host cannot apply to a listing -> 403", async () => {
    const host = await registerUser({
      email: "host@example.com",
      role: "host"
    });
    const seeker = await registerUser({
      email: "seeker@example.com",
      role: "seeker"
    });

    // Host creates a listing
    const created = await request(app)
      .post("/api/listings")
      .set("Authorization", `Bearer ${host.body.accessToken}`)
      .send({
        title: "Bright room",
        description: "Sunny 14m² room",
        city: "Almaty",
        monthlyRent: 180000,
        totalRooms: 3,
        availableRooms: 1,
        maxOccupants: 3
      });
    expect(created.status).toBe(201);

    // Another host tries to apply (must be a seeker or admin)
    const otherHost = await registerUser({
      email: "host2@example.com",
      role: "host"
    });
    const res = await request(app)
      .post(`/api/listings/${created.body.item.id}/applications`)
      .set("Authorization", `Bearer ${otherHost.body.accessToken}`)
      .send({ message: "hi" });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN_ROLE");
    void seeker; // silence unused
  });
});
