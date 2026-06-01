"use server";

import { fetchWithTimeout } from "@/lib/server/guardrails";
import { fetchGoogleMapsJson, getGoogleMapsServerKey } from "@/lib/server/google-maps";

const NEARBY_URL = "https://places.googleapis.com/v1/places:searchNearby";

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

const EXPLORE_TYPES = ["tourist_attraction", "museum", "hindu_temple", "buddhist_temple", "park"];
const HOTSPOT_TYPES = ["restaurant", "cafe", "bar", "lodging"];

async function searchNearby(
  lat: number,
  lng: number,
  includedTypes: string[],
  radiusMeters: number,
): Promise<NearbyPlace[]> {
  const res = await fetchGoogleMapsJson(
    NEARBY_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount",
      },
      body: JSON.stringify({
        includedTypes,
        maxResultCount: 10,
        rankPreference: "POPULARITY",
        locationRestriction: {
          circle: { center: { latitude: lat, longitude: lng }, radius: radiusMeters },
        },
      }),
    },
  );
  if (!res.ok) return [];
  const j = (await res.json()) as {
    places?: Array<{
      id: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      location?: { latitude: number; longitude: number };
      types?: string[];
      rating?: number;
      userRatingCount?: number;
    }>;
  };
  return (j.places ?? [])
    .filter((p) => p.location)
    .map((p) => ({
      id: p.id,
      name: p.displayName?.text ?? p.formattedAddress ?? "Unknown",
      address: p.formattedAddress ?? "",
      lat: p.location!.latitude,
      lng: p.location!.longitude,
      types: p.types ?? [],
      rating: p.rating ?? null,
      userRatingCount: p.userRatingCount ?? null,
    }));
}

export async function getNearbyPlaces({
  data,
}: {
  data: { lat: number; lng: number; radiusMeters?: number };
}): Promise<{ explore: NearbyPlace[]; hotspots: NearbyPlace[]; error: string | null }> {
  const radius = data.radiusMeters || 8000;
  if (!getGoogleMapsServerKey()) {
    return { explore: [], hotspots: [], error: "Missing Google Maps credentials" };
  }
  try {
    const [explore, hotspots] = await Promise.all([
      searchNearby(data.lat, data.lng, EXPLORE_TYPES, radius),
      searchNearby(data.lat, data.lng, HOTSPOT_TYPES, radius),
    ]);
    return { explore, hotspots, error: null };
  } catch (e) {
    return { explore: [], hotspots: [], error: e instanceof Error ? e.message : "Search failed" };
  }
}
