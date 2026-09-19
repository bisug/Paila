"use server";

import { fetchJson } from "@/lib/server/osm";
import { assertLatLng, enforceMapRateLimit } from "@/lib/server/maps-guardrails";

// FOSSGIS hosts free OSRM instances per profile (community-run, fair use).
type TravelMode = "WALK" | "DRIVE" | "BICYCLE";
const PROFILE: Record<TravelMode, string> = {
  WALK: "https://routing.openstreetmap.de/routed-foot/route/v1/foot",
  DRIVE: "https://routing.openstreetmap.de/routed-car/route/v1/driving",
  BICYCLE: "https://routing.openstreetmap.de/routed-bike/route/v1/bike",
};

export async function computeRoute({
  data,
}: {
  data: {
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
    travelMode?: TravelMode;
  };
}) {
  await enforceMapRateLimit("maps:route", 30, 60_000);

  const origin = assertLatLng(data.origin);
  const destination = assertLatLng(data.destination);
  const base = PROFILE[data.travelMode || "WALK"];
  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;

  try {
    const json = await fetchJson<{
      code?: string;
      routes?: Array<{ geometry?: string; distance?: number; duration?: number }>;
    }>(`${base}/${coords}?overview=full&geometries=polyline&steps=false`);

    const r = json.routes?.[0];
    if (!r?.geometry) {
      return { route: null, error: "No route found" };
    }
    return {
      route: {
        encodedPolyline: r.geometry,
        distanceMeters: Math.round(r.distance ?? 0),
        durationSeconds: Math.round(r.duration ?? 0),
      },
      error: null as string | null,
    };
  } catch (e) {
    return {
      route: null,
      error: e instanceof Error ? e.message : "Route failed",
    };
  }
}
