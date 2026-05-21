import { afterAll, beforeEach, describe, expect, it } from "@jest/globals";
import request from "supertest";
import app from "../../src/index.js";
import { prisma } from "../../src/config/db.js";
import { closeDb, truncateAll } from "../helpers.js";

// SMTP_* are blanked by the test script, so the mailer runs in mock mode:
// codes are logged + returned as `devCode` instead of being emailed.

beforeEach(async () => {
  await truncateAll();
});
afterAll(async () => {
  await closeDb();
});

const validRegister = {
  email: "verify@example.com",
  password: "Sup3rStr0ng!",
  fullName: "Vera Ify",
  phone: "+77001234567",
  role: "seeker"
};

// Create a user straight in the DB so no verification code is issued yet —
// keeps the request-code resend cooldown out of the flow assertions.
const seedUser = (overrides = {}) =>
  prisma.user.create({
    data: {
      email: "flow@example.com",
      passwordHash: "not-a-real-hash",
      fullName: "Flow User",
      phone: "+77009998877",
      ...overrides
    }
  });

const requestCode = (email) =>
  request(app).post("/api/auth/email/request-code").send({ email });

const verify = (email, code) =>
  request(app).post("/api/auth/email/verify").send({ email, code });

describe("Registration dispatches an email code", () => {
  it("creates an unverified user, still issues tokens, and dispatches a code", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(validRegister);

    expect(res.status).toBe(201);
    expect(res.body.user.isEmailVerified).toBe(false);
    // main's token-on-register flow is preserved
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toEqual(expect.any(String));
    expect(res.body.emailVerification).toMatchObject({
      required: true,
      dispatched: true,
      mock: true
    });
  });
});

describe("POST /api/auth/email/request-code", () => {
  it("returns a 6-digit devCode in mock mode for a known account", async () => {
    await seedUser();
    const res = await requestCode("flow@example.com");
    expect(res.status).toBe(200);
    expect(res.body.devCode).toMatch(/^\d{6}$/);
  });

  it("does not reveal whether an unknown account exists", async () => {
    const res = await requestCode("nobody@example.com");
    expect(res.status).toBe(200);
    expect(res.body.devCode).toBeUndefined();
  });
});

describe("POST /api/auth/email/verify", () => {
  it("rejects a wrong code, accepts the right one, and flips isEmailVerified", async () => {
    const user = await seedUser();
    const { body } = await requestCode(user.email);
    const code = body.devCode;

    const wrong = await verify(user.email, code === "000000" ? "111111" : "000000");
    expect(wrong.status).toBe(400);
    expect(wrong.body.message).toBe("Invalid code");

    const ok = await verify(user.email, code);
    expect(ok.status).toBe(200);
    expect(ok.body.message).toBe("Email verified");

    const fresh = await prisma.user.findUnique({ where: { id: user.id } });
    expect(fresh.isEmailVerified).toBe(true);
  });

  it("rejects a malformed code with a 422 validation error", async () => {
    await seedUser();
    const res = await verify("flow@example.com", "12");
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
  });

  it("rejects verify when no code was requested", async () => {
    await seedUser();
    const res = await verify("flow@example.com", "654321");
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/no active code/i);
  });

  it("blocks requesting a code once already verified", async () => {
    const user = await seedUser();
    const { body } = await requestCode(user.email);
    await verify(user.email, body.devCode);

    const again = await requestCode(user.email);
    expect(again.status).toBe(400);
    expect(again.body.message).toBe("Email already verified");
  });
});
