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

const validRegister = {
  email: "alice@example.com",
  password: "Sup3rStr0ng!",
  fullName: "Alice N.",
  phone: "+77001234567",
  role: "seeker"
};

describe("POST /api/auth/register", () => {
  it("creates a user and returns access + refresh tokens", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(validRegister);

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toEqual(expect.any(String));
    expect(res.body.user.email).toBe("alice@example.com");
    expect(res.body.user.role).toBe("seeker");
  });

  it("rejects weak passwords with 422", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validRegister, password: "weakpass" });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
  });

  it("rejects duplicate email with 409", async () => {
    await request(app).post("/api/auth/register").send(validRegister);
    const res = await request(app)
      .post("/api/auth/register")
      .send(validRegister);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_TAKEN");
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send(validRegister);
  });

  it("returns tokens for valid credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: validRegister.email,
      password: validRegister.password
    });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toEqual(expect.any(String));
  });

  it("returns 401 on bad password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: validRegister.email,
      password: "WrongPass1!"
    });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });
});

describe("GET /api/auth/me", () => {
  it("returns the current user when access token is valid", async () => {
    const reg = await request(app)
      .post("/api/auth/register")
      .send(validRegister);

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${reg.body.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(validRegister.email);
    expect(res.body.user).not.toHaveProperty("passwordHash");
  });
});

describe("PATCH /api/auth/switch-role", () => {
  it("flips seeker -> host and returns a fresh access token bound to the new role", async () => {
    const reg = await request(app)
      .post("/api/auth/register")
      .send(validRegister);

    const res = await request(app)
      .patch("/api/auth/switch-role")
      .set("Authorization", `Bearer ${reg.body.accessToken}`)
      .send({ role: "host" });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("host");
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.accessToken).not.toBe(reg.body.accessToken);
  });

  it("rejects invalid roles with 400", async () => {
    const reg = await request(app)
      .post("/api/auth/register")
      .send(validRegister);

    const res = await request(app)
      .patch("/api/auth/switch-role")
      .set("Authorization", `Bearer ${reg.body.accessToken}`)
      .send({ role: "admin" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_ROLE");
  });
});

describe("Refresh + Logout", () => {
  let tokens;
  beforeEach(async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(validRegister);
    tokens = res.body;
  });

  it("rotates refresh token: new tokens issued, old refresh becomes unusable", async () => {
    const r1 = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: tokens.refreshToken });
    expect(r1.status).toBe(200);
    expect(r1.body.refreshToken).not.toBe(tokens.refreshToken);

    // Old refresh token must now be revoked
    const r2 = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: tokens.refreshToken });
    expect(r2.status).toBe(401);
    expect(r2.body.error.code).toBe("REVOKED_REFRESH");
  });

  it("logout revokes the refresh token", async () => {
    const r1 = await request(app)
      .post("/api/auth/logout")
      .send({ refreshToken: tokens.refreshToken });
    expect(r1.status).toBe(200);

    const r2 = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: tokens.refreshToken });
    expect(r2.status).toBe(401);
  });
});
