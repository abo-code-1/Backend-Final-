import { describe, it, expect, jest } from "@jest/globals";
import {
  emailVerifySchema,
  requestCodeSchema
} from "../../src/validators/zodSchemas.js";
import { sendVerificationEmail } from "../../src/utils/mailer.js";

describe("emailVerifySchema (unit)", () => {
  it("accepts a valid email + 6-digit code", () => {
    const result = emailVerifySchema.safeParse({
      email: "student@example.test",
      code: "123456"
    });
    expect(result.success).toBe(true);
  });

  it.each([
    ["too short", "12345"],
    ["too long", "1234567"],
    ["non-numeric", "12a456"],
    ["letters", "abcdef"],
    ["empty", ""]
  ])("rejects an invalid code (%s)", (_label, code) => {
    const result = emailVerifySchema.safeParse({
      email: "student@example.test",
      code
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing/invalid email", () => {
    expect(emailVerifySchema.safeParse({ code: "123456" }).success).toBe(false);
    expect(
      emailVerifySchema.safeParse({ email: "nope", code: "123456" }).success
    ).toBe(false);
  });
});

describe("requestCodeSchema (unit)", () => {
  it("accepts a valid email", () => {
    expect(requestCodeSchema.safeParse({ email: "a@b.test" }).success).toBe(true);
  });
  it("rejects an invalid email", () => {
    expect(requestCodeSchema.safeParse({ email: "not-an-email" }).success).toBe(
      false
    );
  });
});

describe("mailer.sendVerificationEmail (unit, mock mode)", () => {
  it("returns { mocked: true } and never throws when SMTP is unconfigured", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const result = await sendVerificationEmail("student@example.test", "424242");
    expect(result).toEqual({ mocked: true });
    expect(logSpy.mock.calls.flat().join(" ")).toContain("424242");
    logSpy.mockRestore();
  });
});
