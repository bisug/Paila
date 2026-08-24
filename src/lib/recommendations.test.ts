/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import {
  buildRecommendations,
  depthForVisitCount,
  recommendFor,
  visitChipLabel,
} from "@/lib/recommendations";

describe("depthForVisitCount", () => {
  test("maps visit counts to depth tiers", () => {
    expect(depthForVisitCount(0)).toBe("signature");
    expect(depthForVisitCount(1)).toBe("deeper");
    expect(depthForVisitCount(2)).toBe("insider");
    expect(depthForVisitCount(5)).toBe("insider");
  });
});

describe("recommendFor", () => {
  test("returns an experience for every spot", () => {
    for (const spotId of ["pokhara", "sarangkot", "ghandruk"] as const) {
      expect(recommendFor(spotId, 0)).toBeDefined();
    }
  });

  test("falls back to deeper, then first, when target depth missing", () => {
    const exp = recommendFor("sarangkot", 2);
    expect(exp).toBeDefined();
    expect(exp?.spotId).toBe("sarangkot");
  });
});

describe("buildRecommendations", () => {
  test("builds one recommendation per spot with matching depth", () => {
    const recs = buildRecommendations({ pokhara: 0, sarangkot: 1, ghandruk: 2 });
    expect(recs).toHaveLength(3);

    const pokhara = recs.find((r) => r.spotId === "pokhara");
    expect(pokhara?.depth).toBe("signature");
    expect(pokhara?.reason).toContain("New to Pokhara");

    const sarangkot = recs.find((r) => r.spotId === "sarangkot");
    expect(sarangkot?.depth).toBe("deeper");

    const ghandruk = recs.find((r) => r.spotId === "ghandruk");
    expect(ghandruk?.depth).toBe("insider");
  });

  test("defaults missing visit counts to zero", () => {
    const recs = buildRecommendations({} as Record<"pokhara" | "sarangkot" | "ghandruk", number>);
    expect(recs.every((r) => r.visitCount === 0)).toBe(true);
  });
});

describe("visitChipLabel", () => {
  test("labels repeat visits", () => {
    expect(visitChipLabel(0)).toBe("First visit");
    expect(visitChipLabel(1)).toBe("Returning · 2nd time");
    expect(visitChipLabel(2)).toBe("Returning · 3rd time");
    expect(visitChipLabel(3)).toBe("Returning · 4th time");
  });
});
