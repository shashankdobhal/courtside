import { describe, expect, it } from "vitest";
import { rateLimit } from "./rate-limit";

describe("rateLimit", () => {
  it("allows requests up to the limit within the window", () => {
    const key = "test-allow-up-to-limit";
    const now = 1_000_000;
    expect(rateLimit(key, 3, 60_000, now).success).toBe(true);
    expect(rateLimit(key, 3, 60_000, now + 10).success).toBe(true);
    expect(rateLimit(key, 3, 60_000, now + 20).success).toBe(true);
  });

  it("rejects the request once the limit is exceeded", () => {
    const key = "test-reject-over-limit";
    const now = 1_000_000;
    rateLimit(key, 2, 60_000, now);
    rateLimit(key, 2, 60_000, now + 10);
    const result = rateLimit(key, 2, 60_000, now + 20);
    expect(result.success).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("allows requests again once the window has passed", () => {
    const key = "test-window-reset";
    const now = 1_000_000;
    rateLimit(key, 1, 60_000, now);
    expect(rateLimit(key, 1, 60_000, now + 30_000).success).toBe(false);
    expect(rateLimit(key, 1, 60_000, now + 60_001).success).toBe(true);
  });

  it("tracks separate keys independently", () => {
    const now = 1_000_000;
    rateLimit("test-key-a", 1, 60_000, now);
    const resultB = rateLimit("test-key-b", 1, 60_000, now);
    expect(resultB.success).toBe(true);
  });
});
