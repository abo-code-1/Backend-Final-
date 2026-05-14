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

// With no Twilio credentials in the test env, twilioService runs in MOCK mode:
// sendOtp resolves to { status: "pending", mock: true } and checkOtp approves
// only the fixed code "000000".
const MOCK_CODE = "000000";

beforeEach(async () => {
  await truncateAll();
});
afterAll(async () => {
  await closeDb();
});

const validRegister = {
  email: "otp@example.com",
  password: "Sup3rStr0ng!",
  fullName: "Otto P.",
  phone: "+77009998877",
  role: "seeker"
};

const registerUser = () =>
  request(app).post("/api/auth/register").send(validRegister);

describe("POST /api/auth/register — phone verification block", () => {
  it("returns a phoneVerification block flagged required, mock, and dispatched", async () => {
    const res = await registerUser();

    expect(res.status).toBe(201);
    expect(res.body.phoneVerification).toEqual({
      required: true,
      dispatched: true,
      mock: true,
      error: null
    });
    expect(res.body.user.isPhoneVerified).toBe(false);
  });
});

describe("POST /api/auth/phone/send-otp", () => {
  it("rejects an unauthenticated request with 401", async () => {
    const res = await request(app).post("/api/auth/phone/send-otp");
    expect(res.status).toBe(401);
  });

  it("sends an OTP in mock mode for an authenticated user", async () => {
    const reg = await registerUser();

    const res = await request(app)
      .post("/api/auth/phone/send-otp")
      .set("Authorization", `Bearer ${reg.body.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("OTP sent");
    expect(res.body.mock).toBe(true);
  });

  it("short-circuits with alreadyVerified once the phone is verified", async () => {
    const reg = await registerUser();
    const auth = `Bearer ${reg.body.accessToken}`;

    await request(app)
      .post("/api/auth/phone/verify-otp")
      .set("Authorization", auth)
      .send({ code: MOCK_CODE });

    const res = await request(app)
      .post("/api/auth/phone/send-otp")
      .set("Authorization", auth);

    expect(res.status).toBe(200);
    expect(res.body.alreadyVerified).toBe(true);
  });
});

describe("POST /api/auth/phone/verify-otp", () => {
  it("rejects an unauthenticated request with 401", async () => {
    const res = await request(app)
      .post("/api/auth/phone/verify-otp")
      .send({ code: MOCK_CODE });
    expect(res.status).toBe(401);
  });

  it("rejects a malformed code with 422", async () => {
    const reg = await registerUser();

    const res = await request(app)
      .post("/api/auth/phone/verify-otp")
      .set("Authorization", `Bearer ${reg.body.accessToken}`)
      .send({ code: "not-a-code" });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("VALIDATION_FAILED");
  });

  it("rejects a wrong code with 400 INVALID_OTP", async () => {
    const reg = await registerUser();

    const res = await request(app)
      .post("/api/auth/phone/verify-otp")
      .set("Authorization", `Bearer ${reg.body.accessToken}`)
      .send({ code: "123456" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_OTP");
  });

  it("verifies the phone with the correct code and flips isPhoneVerified", async () => {
    const reg = await registerUser();

    const res = await request(app)
      .post("/api/auth/phone/verify-otp")
      .set("Authorization", `Bearer ${reg.body.accessToken}`)
      .send({ code: MOCK_CODE });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Phone verified successfully");
    expect(res.body.user.isPhoneVerified).toBe(true);
  });

  it("is idempotent: a second verify returns alreadyVerified", async () => {
    const reg = await registerUser();
    const auth = `Bearer ${reg.body.accessToken}`;

    await request(app)
      .post("/api/auth/phone/verify-otp")
      .set("Authorization", auth)
      .send({ code: MOCK_CODE });

    const res = await request(app)
      .post("/api/auth/phone/verify-otp")
      .set("Authorization", auth)
      .send({ code: MOCK_CODE });

    expect(res.status).toBe(200);
    expect(res.body.alreadyVerified).toBe(true);
    expect(res.body.user.isPhoneVerified).toBe(true);
  });
});
