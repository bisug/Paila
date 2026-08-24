"use server";

import { fetchMapboxUrl } from "@/lib/server/mapbox";
import { assertLatLng, enforceMapRateLimit } from "@/lib/server/maps-guardrails";

const PROFILE: Record<string, string> = {
  WALK: "walking",
  DRIVE: "driving",
  BICYCLE: "cycling",
};

export async function computeRoute({
  data,
}: {
  data: {
    origin: { lat: number; lng: number };
    destination: { lat: number; lng: number };
    travelMode?: "WALK" | "DRIVE" | "BICYCLE";
  };
}) {
  await enforceMapRateLimit("maps:route", 30, 60_000);

  const origin = assertLatLng(data.origin);
  const destination = assertLatLng(data.destination);
  const profile = PROFILE[data.travelMode || "WALK"];
  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const endpoint = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coords}.json`;

  try {
    const res = await fetchMapboxUrl(endpoint, {
      geometries: "polyline",
      overview: "full",
      steps: "false",
    });
    if (!res.ok) {
      const body = await res.text();
      return {
        route: null as null | {
          encodedPolyline: string;
          distanceMeters: number;
          durationSeconds: number;
        },
        error: `Directions API ${res.status}: ${body.slice(0, 200)}`,
      };
    }

    const json = (await res.json()) as {
      routes?: Array<{ geometry?: string; distance?: number; duration?: number }>;
    };
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
