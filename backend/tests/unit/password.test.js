import { describe, expect, it } from "@jest/globals";
import { passwordSchema } from "../../src/validators/zodSchemas.js";

describe("passwordSchema", () => {
  it("rejects too-short passwords", () => {
    expect(passwordSchema.safeParse("Aa1!aa").success).toBe(false);
  });
  it("rejects without uppercase", () => {
    expect(passwordSchema.safeParse("alongpass1!").success).toBe(false);
  });
  it("rejects without lowercase", () => {
    expect(passwordSchema.safeParse("ALONGPASS1!").success).toBe(false);
  });
  it("rejects without digit", () => {
    expect(passwordSchema.safeParse("LongPass!!").success).toBe(false);
  });
  it("rejects without symbol", () => {
    expect(passwordSchema.safeParse("LongPass11").success).toBe(false);
  });
  it("accepts a strong password", () => {
    expect(passwordSchema.safeParse("Sup3rStr0ng!").success).toBe(true);
  });
});
