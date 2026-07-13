"use server";

import { fetchMapboxUrl } from "@/lib/server/mapbox";
import { assertLatLng, enforceMapRateLimit, sanitizePlaceSearchQuery } from "@/lib/server/maps-guardrails";

export async function reverseGeocode({ data }: { data: { lat: number; lng: number } }) {
  await enforceMapRateLimit("maps:reverse-geocode", 60, 60_000);

  const coords = assertLatLng(data);
  const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.lng},${coords.lat}.json`;
  try {
    const res = await fetchMapboxUrl(endpoint, {
      types: "poi,address,place,locality,neighborhood",
      limit: 1,
    });
    if (!res.ok) {
      return {
        name: `Pin ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
        address: null as string | null,
        placeId: null as string | null,
        error: `Geocode ${res.status}`,
      };
    }

    const json = (await res.json()) as {
      features?: Array<{ id?: string; text?: string; place_name?: string }>;
    };
    const top = json.features?.[0];
    if (!top) {
      return {
        name: `Pin ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
        address: null,
        placeId: null,
        error: null,
      };
    }

    const name = top.text || top.place_name || `Pin ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
    return {
      name,
      address: top.place_name ?? null,
      placeId: top.id ?? null,
      error: null as string | null,
    };
  } catch (e) {
    return {
      name: `Pin ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
      address: null,
      placeId: null,
      error: e instanceof Error ? e.message : "Geocode failed",
    };
  }
}

export async function forwardGeocode({
  data,
}: {
  data: { query: string; bias?: { lat: number; lng: number } };
}): Promise<{ point: { lat: number; lng: number } | null; error: string | null }> {
  await enforceMapRateLimit("maps:forward-geocode", 30, 60_000);

  const query = sanitizePlaceSearchQuery(data.query);
  const params: Record<string, string | number | boolean | undefined> = { limit: 1 };
  if (data.bias) params.proximity = `${data.bias.lng},${data.bias.lat}`;
  const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;
  try {
    const res = await fetchMapboxUrl(endpoint, params);
    if (!res.ok) return { point: null, error: `Geocode ${res.status}` };
    const json = (await res.json()) as { features?: Array<{ center?: [number, number] }> };
    const c = json.features?.[0]?.center;
    if (!c) return { point: null, error: "No match found." };
    return { point: { lat: c[1], lng: c[0] }, error: null };
  } catch (e) {
    return { point: null, error: e instanceof Error ? e.message : "Geocode failed" };
  }
}
