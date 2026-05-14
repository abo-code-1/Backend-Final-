import { describe, expect, it } from "@jest/globals";
import {
  checkOtp,
  isTwilioConfigured,
  sendOtp
} from "../../src/services/twilioService.js";

// The test env carries no Twilio credentials, so the service is expected to
// run in MOCK mode throughout this suite.
describe("twilioService (mock mode)", () => {
  it("reports itself as not configured", () => {
    expect(isTwilioConfigured()).toBe(false);
  });

  it("sendOtp resolves to a pending, mock-flagged result", async () => {
    const result = await sendOtp("+77009998877");
    expect(result).toEqual({ status: "pending", mock: true });
  });

  it("checkOtp approves only the fixed mock code", async () => {
    const ok = await checkOtp("+77009998877", "000000");
    expect(ok.status).toBe("approved");
    expect(ok.mock).toBe(true);
  });

  it("checkOtp denies any other code", async () => {
    const bad = await checkOtp("+77009998877", "123456");
    expect(bad.status).toBe("denied");
    expect(bad.mock).toBe(true);
  });
});
