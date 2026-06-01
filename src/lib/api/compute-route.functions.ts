"use server";

import { fetchGoogleMapsJson } from "@/lib/server/google-maps";
import { assertLatLng, enforceMapRateLimit } from "@/lib/server/maps-guardrails";

const ROUTES_URL = "https://routes.googleapis.com/directions/v2:computeRoutes";

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
  const travelMode = data.travelMode || "WALK";
  const res = await fetchGoogleMapsJson(ROUTES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
    },
    body: JSON.stringify({
      origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
      destination: {
        location: { latLng: { latitude: destination.lat, longitude: destination.lng } },
      },
      travelMode: travelMode,
      polylineEncoding: "ENCODED_POLYLINE",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return {
      route: null as null | {
        encodedPolyline: string;
        distanceMeters: number;
        durationSeconds: number;
      },
      error: `Routes API ${res.status}: ${body.slice(0, 200)}`,
    };
  }

  const json = (await res.json()) as {
    routes?: Array<{
      duration?: string;
      distanceMeters?: number;
      polyline?: { encodedPolyline?: string };
    }>;
  };
  const r = json.routes?.[0];
  if (!r?.polyline?.encodedPolyline) {
    return { route: null, error: "No route found" };
  }
  const durationSeconds = r.duration ? parseInt(r.duration.replace(/s$/, ""), 10) : 0;
  return {
    route: {
      encodedPolyline: r.polyline.encodedPolyline,
      distanceMeters: r.distanceMeters ?? 0,
      durationSeconds,
    },
    error: null as string | null,
  };
}
