"use server";

import { fetchJson } from "@/lib/server/osm";
import { enforceMapRateLimit, sanitizePlaceSearchQuery } from "@/lib/server/maps-guardrails";

type NominatimPlace = {
  osm_type?: string;
  osm_id?: number;
  name?: string;
  display_name?: string;
  lat?: string;
  lon?: string;
  category?: string;
  type?: string;
};

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
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "10",
    addressdetails: "0",
    dedupe: "1",
  });
  if (data.bias) {
    const d = 0.5;
    params.set(
      "viewbox",
      `${data.bias.lng - d},${data.bias.lat + d},${data.bias.lng + d},${data.bias.lat - d}`,
    );
    params.set("bounded", "0");
  }

  try {
    const rows = await fetchJson<NominatimPlace[]>(
      `https://nominatim.openstreetmap.org/search?${params}`,
    );
    const places = (rows ?? [])
      .filter((p) => p.lat && p.lon)
      .map((p) => ({
        id: p.osm_type && p.osm_id ? `${p.osm_type}/${p.osm_id}` : `${p.lat},${p.lon}`,
        name: p.name || p.display_name?.split(",")[0]?.trim() || "Unknown",
        address: p.display_name ?? "",
        lat: Number(p.lat),
        lng: Number(p.lon),
        types: [p.category, p.type].filter((t): t is string => !!t),
        rating: null as number | null,
        userRatingCount: null as number | null,
        priceLevel: null as string | null,
      }));
    return { places, error: null as string | null };
  } catch (e) {
    return { places: [], error: e instanceof Error ? e.message : "Search failed" };
  }
}
