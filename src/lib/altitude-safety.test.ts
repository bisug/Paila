import { describe, expect, test } from "bun:test";
import { getAltitudeSafetyProfile, calculateAscentSafety } from "./altitude-safety";

describe("Altitude Safety Engine", () => {
  test("categorizes elevations accurately into clinical tiers", () => {
    expect(getAltitudeSafetyProfile(1400).tier).toBe("moderate");
    expect(getAltitudeSafetyProfile(2860).tier).toBe("high"); // Lukla
    expect(getAltitudeSafetyProfile(3440).tier).toBe("high"); // Namche (2,500 - 3,500m)
    expect(getAltitudeSafetyProfile(4410).tier).toBe("very_high"); // Dingboche (> 3,500m)
    expect(getAltitudeSafetyProfile(5545).tier).toBe("extreme"); // Kala Patthar (> 5,500m)
  });

  test("calculates ascent rate and flags rapid ascent > 500m/day above 3000m", () => {
    // Lukla (2,860m) to Namche (3,440m) in 1 day (580m gain)
    const dangerousAscent = calculateAscentSafety(2860, 4410, 2); // 775m/day
    expect(dangerousAscent.safe).toBe(false);
    expect(dangerousAscent.dailyGainMeters).toBeGreaterThan(500);

    // Gradual ascent: 3,440m to 3,860m in 1 day (420m gain)
    const safeAscent = calculateAscentSafety(3440, 3860, 1);
    expect(safeAscent.safe).toBe(true);
    expect(safeAscent.dailyGainMeters).toBeLessThanOrEqual(500);
  });
});
