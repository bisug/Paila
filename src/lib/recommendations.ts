import { experiences, type Experience, type SpotId, type ExperienceDepth } from "./data";

/**
 * Map a visit count to a "depth" tier:
 *   0 visits → signature (the must-see)
 *   1 visit  → deeper (next-level)
 *   2+       → insider (locals' pick)
 */
export function depthForVisitCount(count: number): ExperienceDepth {
  if (count <= 0) return "signature";
  if (count === 1) return "deeper";
  return "insider";
}

/** Recommend the best experience for a given spot based on prior visit count. */
export function recommendFor(spotId: SpotId, visitCount: number): Experience | undefined {
  const targetDepth = depthForVisitCount(visitCount);
  const inSpot = experiences.filter((e) => e.spotId === spotId);
  return (
    inSpot.find((e) => e.depth === targetDepth) ??
    inSpot.find((e) => e.depth === "deeper") ??
    inSpot[0]
  );
}

export type SpotRecommendation = {
  spotId: SpotId;
  spotLabel: string;
  visitCount: number;
  depth: ExperienceDepth;
  experience: Experience;
  reason: string;
};

const SPOT_LABELS: Record<SpotId, string> = {
  pokhara: "Pokhara",
  sarangkot: "Sarangkot",
  ghandruk: "Ghandruk",
};

function reasonFor(spotLabel: string, visitCount: number): string {
  if (visitCount === 0) return `New to ${spotLabel} — start here`;
  if (visitCount === 1) return `Been to ${spotLabel} once · go a level deeper`;
  return `Returning to ${spotLabel} · locals' pick`;
}

/** Build a ranked list of recommendations across all spots given current visit counts. */
export function buildRecommendations(visitCounts: Record<SpotId, number>): SpotRecommendation[] {
  const spotIds: SpotId[] = ["pokhara", "sarangkot", "ghandruk"];
  return spotIds
    .map((spotId) => {
      const visitCount = visitCounts[spotId] ?? 0;
      const exp = recommendFor(spotId, visitCount);
      if (!exp) return null;
      return {
        spotId,
        spotLabel: SPOT_LABELS[spotId],
        visitCount,
        depth: depthForVisitCount(visitCount),
        experience: exp,
        reason: reasonFor(SPOT_LABELS[spotId], visitCount),
      } satisfies SpotRecommendation;
    })
    .filter((r): r is SpotRecommendation => r !== null);
}

export function visitChipLabel(visitCount: number): string {
  if (visitCount <= 0) return "First visit";
  if (visitCount === 1) return "Returning · 2nd time";
  if (visitCount === 2) return "Returning · 3rd time";
  return `Returning · ${visitCount + 1}th time`;
}
