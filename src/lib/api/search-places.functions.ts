"use server";

import { fetchWithTimeout } from "@/lib/server/guardrails";
import { fetchGoogleMapsJson } from "@/lib/server/google-maps";

const PLACES_URL = "https://places.googleapis.com/v1/places:searchText";

export async function searchPlaces({
  data,
}: {
  data: {
    query: string;
    bias?: { lat: number; lng: number; radiusMeters?: number };
    rankByDistance?: boolean;
  };
}) {
  const body: Record<string, unknown> = { textQuery: data.query, maxResultCount: 10 };
  if (data.bias) {
    body.locationBias = {
      circle: {
        center: { latitude: data.bias.lat, longitude: data.bias.lng },
        radius: data.bias.radiusMeters || 50000,
      },
    };
    if (data.rankByDistance) {
      body.rankPreference = "DISTANCE";
    }
  }

  const res = await fetchGoogleMapsJson(
    PLACES_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.priceLevel",
      },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    return { places: [], error: `Places API ${res.status}: ${text.slice(0, 200)}` };
  }

  const json = (await res.json()) as {
    places?: Array<{
      id: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      location?: { latitude: number; longitude: number };
      types?: string[];
      rating?: number;
      userRatingCount?: number;
      priceLevel?: string;
    }>;
  };

  const places = (json.places ?? [])
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
      priceLevel: p.priceLevel ?? null,
    }));

  return { places, error: null as string | null };
}
