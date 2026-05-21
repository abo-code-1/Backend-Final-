import { describe, it, expect, afterAll } from "@jest/globals";
import request from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/config/db.js";

// Smoke test: exercises the wired-up HTTP endpoints end-to-end against the
// real DB. The mailer runs in mock mode (SMTP_* blanked by the test script),
// so request-code returns the code as `devCode` instead of emailing it.

const createdEmails = [];

const uniqueEmail = () =>
  `smoke_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@example.test`;

async function registerUser() {
  const email = uniqueEmail();
  createdEmails.push(email);
  const res = await request(app)
    .post("/api/auth/register")
    .send({ email, password: "secret123", fullName: "Smoke Test" });
  return { email, res, token: res.body.token, user: res.body.user };
}

const authed = (token) => ({ Authorization: `Bearer ${token}` });

afterAll(async () => {
  if (createdEmails.length) {
    // Cascade removes related email_verifications rows.
    await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
  }
  await prisma.$disconnect();
});

describe("Email verification — smoke", () => {
  it("registers a user that starts unverified", async () => {
    const { res } = await registerUser();
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.isEmailVerified).toBe(false);
  });

  it("rejects request-code without authentication (401)", async () => {
    const res = await request(app).post("/api/auth/email/request-code");
    expect(res.status).toBe(401);
  });

  it("completes the full happy path: request code → wrong code → verify", async () => {
    const { token } = await registerUser();

    // 1) request a code (mock mode surfaces it as devCode)
    const reqRes = await request(app)
      .post("/api/auth/email/request-code")
      .set(authed(token));
    expect(reqRes.status).toBe(200);
    expect(reqRes.body.devCode).toMatch(/^\d{6}$/);
    const code = reqRes.body.devCode;

    // 2) a wrong-but-well-formed code is rejected
    const wrong = await request(app)
      .post("/api/auth/email/verify")
      .set(authed(token))
      .send({ code: "000000" === code ? "111111" : "000000" });
    expect(wrong.status).toBe(400);
    expect(wrong.body.message).toBe("Invalid code");

    // 3) the correct code verifies the email
    const ok = await request(app)
      .post("/api/auth/email/verify")
      .set(authed(token))
      .send({ code });
    expect(ok.status).toBe(200);
    expect(ok.body.message).toBe("Email verified");
    expect(ok.body.user.isEmailVerified).toBe(true);

    // 4) /me reflects the verified state
    const me = await request(app).get("/api/auth/me").set(authed(token));
    expect(me.body.user.isEmailVerified).toBe(true);
  });

  it("rejects a malformed code with a 400 validation error", async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .post("/api/auth/email/verify")
      .set(authed(token))
      .send({ code: "12" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation failed");
  });

  it("rejects verify when no code was requested", async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .post("/api/auth/email/verify")
      .set(authed(token))
      .send({ code: "654321" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/No active code/i);
  });

  it("blocks requesting a new code once already verified", async () => {
    const { token } = await registerUser();
    const { body } = await request(app)
      .post("/api/auth/email/request-code")
      .set(authed(token));
    await request(app)
      .post("/api/auth/email/verify")
      .set(authed(token))
      .send({ code: body.devCode });

    const again = await request(app)
      .post("/api/auth/email/request-code")
      .set(authed(token));
    expect(again.status).toBe(400);
    expect(again.body.message).toBe("Email already verified");
  });
});
