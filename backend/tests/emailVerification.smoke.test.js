import { describe, it, expect, afterAll } from "@jest/globals";
import request from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/config/db.js";

// Smoke test for the register -> verify -> login flow against the real DB.
// SMTP_* are blanked by the test script, so request-code returns the code as
// `devCode` instead of emailing it.

const createdEmails = [];
const uniqueEmail = () =>
  `smoke_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@example.test`;

async function registerUser(extra = {}) {
  const email = uniqueEmail();
  createdEmails.push(email);
  const res = await request(app)
    .post("/api/auth/register")
    .send({ email, password: "secret123", fullName: "Smoke Test", ...extra });
  return { email, res };
}

const requestCode = (email) =>
  request(app).post("/api/auth/email/request-code").send({ email });

afterAll(async () => {
  if (createdEmails.length) {
    await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
  }
  await prisma.$disconnect();
});

describe("Auth flow — register → verify → login (smoke)", () => {
  it("register creates an unverified account and returns NO token", async () => {
    const { res } = await registerUser();
    expect(res.status).toBe(201);
    expect(res.body.token).toBeUndefined();
    expect(res.body.user.isEmailVerified).toBe(false);
  });

  it("login is blocked with 403 until the email is verified", async () => {
    const { email } = await registerUser();
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "secret123" });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("completes register → request code → verify → login", async () => {
    const { email } = await registerUser();

    const reqRes = await requestCode(email);
    expect(reqRes.status).toBe(200);
    expect(reqRes.body.devCode).toMatch(/^\d{6}$/);
    const code = reqRes.body.devCode;

    // wrong-but-well-formed code is rejected
    const wrong = await request(app)
      .post("/api/auth/email/verify")
      .send({ email, code: code === "000000" ? "111111" : "000000" });
    expect(wrong.status).toBe(400);
    expect(wrong.body.message).toBe("Invalid code");

    // correct code verifies
    const ok = await request(app)
      .post("/api/auth/email/verify")
      .send({ email, code });
    expect(ok.status).toBe(200);
    expect(ok.body.message).toBe("Email verified");

    // login now succeeds and returns a token
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "secret123" });
    expect(login.status).toBe(200);
    expect(login.body.token).toBeTruthy();
    expect(login.body.user.isEmailVerified).toBe(true);
  });

  it("rejects a malformed code with a 400 validation error", async () => {
    const { email } = await registerUser();
    const res = await request(app)
      .post("/api/auth/email/verify")
      .send({ email, code: "12" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation failed");
  });

  it("rejects verify when no code was requested", async () => {
    const { email } = await registerUser();
    const res = await request(app)
      .post("/api/auth/email/verify")
      .send({ email, code: "654321" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/No active code/i);
  });

  it("blocks requesting a code once already verified", async () => {
    const { email } = await registerUser();
    const { body } = await requestCode(email);
    await request(app)
      .post("/api/auth/email/verify")
      .send({ email, code: body.devCode });

    const again = await requestCode(email);
    expect(again.status).toBe(400);
    expect(again.body.message).toBe("Email already verified");
  });
});

describe("Registration — phone handling (regression)", () => {
  it("allows multiple signups with a blank phone (empty string → NULL)", async () => {
    const r1 = await registerUser({ phone: "" });
    const r2 = await registerUser({ phone: "" });
    expect(r1.res.status).toBe(201);
    expect(r2.res.status).toBe(201);
  });

  it("rejects a duplicate real phone with 409, not a 500", async () => {
    const phone = `+7701${Date.now().toString().slice(-7)}`;
    const r1 = await registerUser({ phone });
    const r2 = await registerUser({ phone });
    expect(r1.res.status).toBe(201);
    expect(r2.res.status).toBe(409);
    expect(r2.res.body.message).toMatch(/already registered/i);
  });
});
