// Himalayan High-Altitude & Acclimatization Safety Engine
// Based on Wilderness Medical Society (WMS) & UIAA High-Altitude Clinical Guidelines.

export type AltitudeTier = "moderate" | "high" | "very_high" | "extreme";

export type AltitudeSafetyProfile = {
  altitudeMeters: number;
  altitudeFeet: number;
  tier: AltitudeTier;
  label: string;
  oxygenPercentage: number; // Effective oxygen relative to sea level (100%)
  requiresAcclimatization: boolean;
  warnings: string[];
  recommendations: string[];
};

export function getAltitudeSafetyProfile(meters: number): AltitudeSafetyProfile {
  const feet = Math.round(meters * 3.28084);

  if (meters >= 5500) {
    return {
      altitudeMeters: meters,
      altitudeFeet: feet,
      tier: "extreme",
      label: "Extreme Altitude",
      oxygenPercentage: 48,
      requiresAcclimatization: true,
      warnings: [
        "Severe hypoxia zone. Human body cannot permanently acclimatize above 5,500m.",
        "High risk of High-Altitude Pulmonary Edema (HAPE) and Cerebral Edema (HACE).",
      ],
      recommendations: [
        "Limit duration of stay to absolute minimum required.",
        "Continuous monitoring of oxygen saturation and pulse.",
        "Descend immediately upon first sign of persistent headache, ataxia, or confusion.",
      ],
    };
  }

  if (meters >= 3500) {
    return {
      altitudeMeters: meters,
      altitudeFeet: feet,
      tier: "very_high",
      label: "Very High Altitude",
      oxygenPercentage: Math.round(100 * Math.exp(-meters / 8500)),
      requiresAcclimatization: true,
      warnings: [
        "Significant hypobaric hypoxia. Atmospheric pressure is ~60% of sea level.",
        "Over 50% of unacclimatized trekkers experience symptoms of Acute Mountain Sickness (AMS).",
      ],
      recommendations: [
        "Ascent rate should not exceed 300m–500m sleeping elevation per day.",
        "Take a mandatory acclimatization rest day every 3–4 days (1,000m gain).",
        "Maintain 4–5 liters of daily fluid intake; avoid alcohol and sleeping pills.",
        "Climb high, sleep low rule applies.",
      ],
    };
  }

  if (meters >= 2500) {
    return {
      altitudeMeters: meters,
      altitudeFeet: feet,
      tier: "high",
      label: "High Altitude",
      oxygenPercentage: Math.round(100 * Math.exp(-meters / 8500)),
      requiresAcclimatization: true,
      warnings: [
        "Onset of noticeable altitude effects. Mild shortness of breath during exertion is normal.",
      ],
      recommendations: [
        "Spend at least 1–2 nights between 2,500m and 3,200m before ascending higher.",
        "Pace yourself deliberately; keep breathing rhythmic and relaxed.",
      ],
    };
  }

  return {
    altitudeMeters: meters,
    altitudeFeet: feet,
    tier: "moderate",
    label: "Moderate Elevation",
    oxygenPercentage: 95,
    requiresAcclimatization: false,
    warnings: [],
    recommendations: ["Standard trekking hydration and sunscreen protection apply."],
  };
}

// Evaluates whether a proposed route ascent rate is medically safe
export function calculateAscentSafety(
  startMeters: number,
  endMeters: number,
  days: number,
): {
  safe: boolean;
  netGainMeters: number;
  dailyGainMeters: number;
  recommendedMinDays: number;
  advisory: string;
} {
  const netGain = Math.max(0, endMeters - startMeters);
  const safeDays = Math.max(1, days);
  const dailyGain = Math.round(netGain / safeDays);

  // If endpoint is above 3,000m and daily sleeping gain > 500m:
  if (endMeters > 3000 && dailyGain > 500) {
    const recommendedDays = Math.ceil(netGain / 400);
    return {
      safe: false,
      netGainMeters: netGain,
      dailyGainMeters: dailyGain,
      recommendedMinDays: recommendedDays,
      advisory: `Ascent of ${dailyGain}m/day exceeds the 500m/day clinical threshold above 3,000m. Plan at least ${recommendedDays} days with an acclimatization stop.`,
    };
  }

  return {
    safe: true,
    netGainMeters: netGain,
    dailyGainMeters: dailyGain,
    recommendedMinDays: Math.ceil(netGain / 500) || 1,
    advisory: `Safe ascent velocity (${dailyGain}m/day). Stay well-hydrated.`,
  };
}
