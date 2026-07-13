"use server";

import { fetchMapboxUrl } from "@/lib/server/mapbox";
import { assertLatLng, enforceMapRateLimit } from "@/lib/server/maps-guardrails";

export async function snapPath({ data }: { data: { points: { lat: number; lng: number }[] } }) {
  await enforceMapRateLimit("maps:snap-path", 20, 60_000);

  if (data.points.length < 2) throw new Error("At least two points are required.");
  if (data.points.length > 100) throw new Error("Road snapping supports at most 100 points.");

  const points = data.points.map(assertLatLng);
  const coords = points.map((p) => `${p.lng},${p.lat}`).join(";");
  const endpoint = `https://api.mapbox.com/matching/v5/mapbox/driving/${coords}.json`;

  try {
    const res = await fetchMapboxUrl(endpoint, {
      geometries: "geojson",
      overview: "full",
    });
    if (!res.ok) {
      const body = await res.text();
      return {
        snapped: [] as { lat: number; lng: number }[],
        error: `Map Matching ${res.status}: ${body.slice(0, 200)}`,
      };
    }

    const json = (await res.json()) as {
      matchings?: Array<{ geometry?: { coordinates?: [number, number][] } }>;
    };
    const coordsOut = json.matchings?.[0]?.geometry?.coordinates ?? [];
    const snapped = coordsOut.map((c) => ({ lat: c[1], lng: c[0] }));
    return { snapped, error: null as string | null };
  } catch (e) {
    return {
      snapped: [] as { lat: number; lng: number }[],
      error: e instanceof Error ? e.message : "Snap failed",
    };
  }
}
