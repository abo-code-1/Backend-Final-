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

const PASSWORD = "Sup3rStr0ng!";

let seq = 0;
// Registers a fresh user and returns { res, email } so tests can log back in.
const registerUser = async (overrides = {}) => {
  seq += 1;
  const email = `profile-u${seq}@example.com`;
  const res = await request(app)
    .post("/api/auth/register")
    .send({
      email,
      password: PASSWORD,
      fullName: `User ${seq}`,
      role: "seeker",
      phone: `+7703${String(seq).padStart(7, "0")}`,
      ...overrides
    });
  return { res, email };
};

describe("PATCH /api/auth/me", () => {
  it("updates profile fields and returns the fresh user", async () => {
    const { res: reg } = await registerUser();

    const res = await request(app)
      .patch("/api/auth/me")
      .set("Authorization", `Bearer ${reg.body.accessToken}`)
      .send({
        fullName: "Renamed Person",
        bio: "Tidy, quiet, early riser",
        gender: "female",
        occupation: "Designer"
      });

    expect(res.status).toBe(200);
    expect(res.body.user.fullName).toBe("Renamed Person");
    expect(res.body.user.bio).toBe("Tidy, quiet, early riser");
    expect(res.body.user.gender).toBe("female");
    expect(res.body.user.occupation).toBe("Designer");
    expect(res.body.user).not.toHaveProperty("passwordHash");
  });

  it("requires authentication", async () => {
    const res = await request(app)
      .patch("/api/auth/me")
      .send({ fullName: "Nobody" });
    expect(res.status).toBe(401);
  });

  it("rejects an empty payload with 422", async () => {
    const { res: reg } = await registerUser();

    const res = await request(app)
      .patch("/api/auth/me")
      .set("Authorization", `Bearer ${reg.body.accessToken}`)
      .send({});

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
  });

  it("rejects an invalid avatar URL with 422", async () => {
    const { res: reg } = await registerUser();

    const res = await request(app)
      .patch("/api/auth/me")
      .set("Authorization", `Bearer ${reg.body.accessToken}`)
      .send({ avatarUrl: "not-a-url" });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
  });
});

describe("POST /api/auth/change-password", () => {
  const newPassword = "Even5tr0nger!";

  it("requires authentication", async () => {
    const res = await request(app)
      .post("/api/auth/change-password")
      .send({ currentPassword: PASSWORD, newPassword });
    expect(res.status).toBe(401);
  });

  it("rejects a wrong current password with 400", async () => {
    const { res: reg } = await registerUser();

    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${reg.body.accessToken}`)
      .send({ currentPassword: "WrongPass1!", newPassword });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_PASSWORD");
  });

  it("rejects a weak new password with 422", async () => {
    const { res: reg } = await registerUser();

    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${reg.body.accessToken}`)
      .send({ currentPassword: PASSWORD, newPassword: "weak" });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
  });

  it("changes the password: old one stops working, new one logs in", async () => {
    const { res: reg, email } = await registerUser();

    const change = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${reg.body.accessToken}`)
      .send({ currentPassword: PASSWORD, newPassword });
    expect(change.status).toBe(200);

    const oldLogin = await request(app)
      .post("/api/auth/login")
      .send({ email, password: PASSWORD });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post("/api/auth/login")
      .send({ email, password: newPassword });
    expect(newLogin.status).toBe(200);
    expect(newLogin.body.accessToken).toEqual(expect.any(String));
  });

  it("revokes existing refresh tokens after a password change", async () => {
    const { res: reg } = await registerUser();
    const oldRefresh = reg.body.refreshToken;

    await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${reg.body.accessToken}`)
      .send({ currentPassword: PASSWORD, newPassword });

    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: oldRefresh });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("REVOKED_REFRESH");
  });
});
