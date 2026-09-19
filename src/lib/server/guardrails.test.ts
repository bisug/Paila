import { describe, expect, test } from "bun:test";

import { checkRateLimit, clientKeyFromHeaders } from "./guardrails";

describe("checkRateLimit", () => {
  test("allows up to the limit then blocks within the window", () => {
    const key = `test:${Math.random()}`;
    expect([1, 2, 3].map(() => checkRateLimit(key, 3, 60_000))).toEqual([true, true, true]);
    expect(checkRateLimit(key, 3, 60_000)).toBe(false);
  });

  test("keys are isolated", () => {
    expect(checkRateLimit("iso:a", 1, 60_000)).toBe(true);
    expect(checkRateLimit("iso:a", 1, 60_000)).toBe(false);
    expect(checkRateLimit("iso:b", 1, 60_000)).toBe(true);
  });

  test("expired windows are pruned instead of growing the map forever", () => {
    const key = `sweep:${Math.random()}`;
    expect(checkRateLimit(key, 1, 0)).toBe(true); // 0ms window expires immediately
    expect(checkRateLimit(key, 1, 60_000)).toBe(true); // new bucket replaces expired one
  });
});

describe("clientKeyFromHeaders", () => {
  const headers = (values: Record<string, string>) => ({
    get: (name: string) => values[name] ?? null,
  });

  test("prefers the first x-forwarded-for hop", () => {
    expect(clientKeyFromHeaders("s", headers({ "x-forwarded-for": "1.1.1.1, 2.2.2.2" }))).toBe(
      "s:1.1.1.1",
    );
  });

  test("falls back to x-real-ip, then unknown", () => {
    expect(clientKeyFromHeaders("s", headers({ "x-real-ip": "3.3.3.3" }))).toBe("s:3.3.3.3");
    expect(clientKeyFromHeaders("s", headers({}))).toBe("s:unknown");
  });
});
