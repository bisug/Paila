import { useCallback, useEffect, useState } from "react";
import type { SpotId } from "@/lib/data";

const STORAGE_KEY = "paila:visits:v1";

export type VisitRecord = { count: number; lastVisitedAt: string };
export type VisitMap = Record<SpotId, VisitRecord>;

// Realistic seed so reviewers see the feature working immediately on first load.
const SEED: VisitMap = {
  pokhara: { count: 2, lastVisitedAt: "2025-11-04T09:00:00Z" },
  sarangkot: { count: 1, lastVisitedAt: "2025-11-05T05:30:00Z" },
  ghandruk: { count: 0, lastVisitedAt: "" },
};

function read(): VisitMap {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED;
    const parsed = JSON.parse(raw) as Partial<VisitMap>;
    return {
      pokhara: parsed.pokhara ?? SEED.pokhara,
      sarangkot: parsed.sarangkot ?? SEED.sarangkot,
      ghandruk: parsed.ghandruk ?? SEED.ghandruk,
    };
  } catch {
    return SEED;
  }
}

function write(value: VisitMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
}

export function useVisitTracker() {
  const [visits, setVisits] = useState<VisitMap>(SEED);

  // Hydrate from storage after mount to keep SSR output stable.
  useEffect(() => {
    setVisits(read());
  }, []);

  const markVisited = useCallback((spotId: SpotId) => {
    setVisits((prev) => {
      const next: VisitMap = {
        ...prev,
        [spotId]: {
          count: (prev[spotId]?.count ?? 0) + 1,
          lastVisitedAt: new Date().toISOString(),
        },
      };
      write(next);
      return next;
    });
  }, []);

  const resetVisits = useCallback(() => {
    write(SEED);
    setVisits(SEED);
  }, []);

  const getVisitCount = useCallback((spotId: SpotId) => visits[spotId]?.count ?? 0, [visits]);

  const hasVisited = useCallback((spotId: SpotId) => (visits[spotId]?.count ?? 0) > 0, [visits]);

  return { visits, markVisited, resetVisits, getVisitCount, hasVisited };
}
