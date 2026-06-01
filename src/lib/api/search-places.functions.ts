"use server";

import { fetchWithTimeout } from "@/lib/server/guardrails";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

export async function searchPlaces({
  data,
}: {
  data: {
    query: string;
    bias?: { lat: number; lng: number; radiusMeters?: number };
    rankByDistance?: boolean;
  };
}) {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const gmKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!lovableKey) throw new Error("Missing LOVABLE_API_KEY");
  if (!gmKey) throw new Error("Missing GOOGLE_MAPS_API_KEY");

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

  const res = await fetchWithTimeout(
    `${GATEWAY_URL}/places/v1/places:searchText`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": gmKey,
        "Content-Type": "application/json",
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.priceLevel",
      },
      body: JSON.stringify(body),
    },
    8_000,
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
