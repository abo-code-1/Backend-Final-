import { describe, expect, it } from "@jest/globals";
import {
  hashRefreshToken,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
} from "../../src/utils/jwt.js";

describe("jwt utils", () => {
  it("round-trips an access token and preserves payload", () => {
    const token = signAccessToken({ userId: 42, role: "host" });
    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(42);
    expect(decoded.role).toBe("host");
  });

  it("round-trips a refresh token and stamps a unique jti per call", () => {
    const a = signRefreshToken({ userId: 1 });
    const b = signRefreshToken({ userId: 1 });
    expect(a).not.toBe(b);
    expect(verifyRefreshToken(a).userId).toBe(1);
    expect(verifyRefreshToken(b).jti).not.toBe(verifyRefreshToken(a).jti);
  });

  it("hashRefreshToken is deterministic and 64 hex chars (sha256)", () => {
    const t = signRefreshToken({ userId: 7 });
    const h1 = hashRefreshToken(t);
    const h2 = hashRefreshToken(t);
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects a tampered access token", () => {
    const token = signAccessToken({ userId: 1, role: "seeker" });
    const tampered = `${token.slice(0, -2)}xx`;
    expect(() => verifyAccessToken(tampered)).toThrow();
  });
});
