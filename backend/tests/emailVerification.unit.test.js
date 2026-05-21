import { describe, it, expect, jest } from "@jest/globals";
import { emailVerifySchema } from "../src/validators/zodSchemas.js";
import { sendVerificationEmail } from "../src/utils/mailer.js";

describe("emailVerifySchema (unit)", () => {
  it("accepts a 6-digit numeric code", () => {
    const result = emailVerifySchema.safeParse({ code: "123456" });
    expect(result.success).toBe(true);
  });

  it.each([
    ["too short", "12345"],
    ["too long", "1234567"],
    ["non-numeric", "12a456"],
    ["letters", "abcdef"],
    ["empty", ""]
  ])("rejects an invalid code (%s)", (_label, code) => {
    const result = emailVerifySchema.safeParse({ code });
    expect(result.success).toBe(false);
  });

  it("rejects a missing code", () => {
    const result = emailVerifySchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("mailer.sendVerificationEmail (unit, mock mode)", () => {
  it("returns { mocked: true } and never throws when SMTP is unconfigured", async () => {
    // SMTP_* are blanked by the test script, so the mailer is in mock mode.
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const result = await sendVerificationEmail("student@example.test", "424242");
    expect(result).toEqual({ mocked: true });
    // The code is surfaced to the server log in mock mode.
    expect(logSpy.mock.calls.flat().join(" ")).toContain("424242");
    logSpy.mockRestore();
  });
});
