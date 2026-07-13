"use server";

import { fetchMapboxUrl, getMapboxToken } from "@/lib/server/mapbox";
import { assertLatLng, enforceMapRateLimit, normalizeRadiusMeters } from "@/lib/server/maps-guardrails";

const GEOCODE_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places";

export type NearbyPlace = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  types: string[];
  rating: number | null;
  userRatingCount: number | null;
};

const EXPLORE_CATS = [
  "museum",
  "monument",
  "temple",
  "shrine",
  "park",
  "garden",
  "viewpoint",
  "attraction",
  "arts",
  "culture",
  "heritage",
  "historic",
];
const HOTSPOT_CATS = ["restaurant", "cafe", "bar", "pub", "lodging", "hotel", "food", "nightlife"];

async function searchNearby(
  lat: number,
  lng: number,
  radiusMeters: number,
): Promise<NearbyPlace[]> {
  const endpoint = `${GEOCODE_URL}/${lng},${lat}.json`;
  const res = await fetchMapboxUrl(endpoint, {
    types: "poi",
    limit: 20,
    proximity: `${lng},${lat}`,
  });
  if (!res.ok) return [];
  const j = (await res.json()) as {
    features?: Array<{
      id: string;
      text?: string;
      place_name?: string;
      center?: [number, number];
      properties?: { category?: string[] };
    }>;
  };
  return (j.features ?? [])
    .filter((p) => p.center)
    .map((p) => ({
      id: p.id,
      name: p.text ?? p.place_name ?? "Unknown",
      address: p.place_name ?? "",
      lat: p.center![1],
      lng: p.center![0],
      types: p.properties?.category ?? [],
      rating: null,
      userRatingCount: null,
    }));
}

export async function getNearbyPlaces({
  data,
}: {
  data: { lat: number; lng: number; radiusMeters?: number };
}): Promise<{ explore: NearbyPlace[]; hotspots: NearbyPlace[]; error: string | null }> {
  await enforceMapRateLimit("maps:nearby", 30, 60_000);

  const center = assertLatLng(data);
  normalizeRadiusMeters(data.radiusMeters, 8000, 20000);
  if (!getMapboxToken()) {
    return { explore: [], hotspots: [], error: "Missing Mapbox access token" };
  }
  try {
    const places = await searchNearby(center.lat, center.lng, data.radiusMeters ?? 8000);
    const match = (cats: string[], keys: string[]) =>
      cats.some((c) => keys.some((k) => c.toLowerCase().includes(k)));
    const explore = places.filter((p) => match(p.types, EXPLORE_CATS));
    const hotspots = places.filter(
      (p) => !match(p.types, EXPLORE_CATS) && match(p.types, HOTSPOT_CATS),
    );
    return { explore, hotspots, error: null };
  } catch (e) {
    return { explore: [], hotspots: [], error: e instanceof Error ? e.message : "Search failed" };
  }
}
