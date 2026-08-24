"use server";

import { fetchMapboxUrl } from "@/lib/server/mapbox";
import { enforceMapRateLimit, sanitizePlaceSearchQuery } from "@/lib/server/maps-guardrails";

const GEOCODE_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places";

export async function searchPlaces({
  data,
}: {
  data: {
    query: string;
    bias?: { lat: number; lng: number; radiusMeters?: number };
    rankByDistance?: boolean;
  };
}) {
  await enforceMapRateLimit("maps:search", 30, 60_000);

  const query = sanitizePlaceSearchQuery(data.query);
  const params: Record<string, string | number | boolean | undefined> = {
    types: "poi",
    limit: 10,
  };
  if (data.bias) {
    params.proximity = `${data.bias.lng},${data.bias.lat}`;
  }

  const endpoint = `${GEOCODE_URL}/${encodeURIComponent(query)}.json`;
  try {
    const res = await fetchMapboxUrl(endpoint, params);
    if (!res.ok) {
      const text = await res.text();
      return { places: [], error: `Places API ${res.status}: ${text.slice(0, 200)}` };
    }

    const json = (await res.json()) as {
      features?: Array<{
        id: string;
        text?: string;
        place_name?: string;
        center?: [number, number];
        properties?: { category?: string[] };
      }>;
    };

    const places = (json.features ?? [])
      .filter((p) => p.center)
      .map((p) => ({
        id: p.id,
        name: p.text ?? p.place_name ?? "Unknown",
        address: p.place_name ?? "",
        lat: p.center![1],
        lng: p.center![0],
        types: p.properties?.category ?? [],
        rating: null as number | null,
        userRatingCount: null as number | null,
        priceLevel: null as string | null,
      }));

    return { places, error: null as string | null };
  } catch (e) {
    return { places: [], error: e instanceof Error ? e.message : "Search failed" };
  }
}
