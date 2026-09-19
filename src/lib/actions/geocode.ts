"use server";

import { fetchJson } from "@/lib/server/osm";
import {
  assertLatLng,
  enforceMapRateLimit,
  sanitizePlaceSearchQuery,
} from "@/lib/server/maps-guardrails";

type NominatimPlace = {
  osm_type?: string;
  osm_id?: number;
  display_name?: string;
  name?: string;
  lat?: string;
  lon?: string;
};

function pinName(lat: number, lng: number) {
  return `Pin ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export async function reverseGeocode({ data }: { data: { lat: number; lng: number } }) {
  await enforceMapRateLimit("maps:reverse-geocode", 60, 60_000);

  const coords = assertLatLng(data);
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.lat}&lon=${coords.lng}&zoom=16&addressdetails=0`;
  try {
    const place = await fetchJson<NominatimPlace>(url);
    const name =
      place.name || place.display_name?.split(",")[0]?.trim() || pinName(coords.lat, coords.lng);
    return {
      name,
      address: place.display_name ?? null,
      placeId: place.osm_type && place.osm_id ? `${place.osm_type}/${place.osm_id}` : null,
      error: null as string | null,
    };
  } catch (e) {
    return {
      name: pinName(coords.lat, coords.lng),
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
  // Nominatim has no proximity parameter; a viewbox around the user nudges
  // result ranking toward their area without excluding farther matches.
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "1",
    addressdetails: "0",
  });
  if (data.bias) {
    const d = 0.5; // ~50 km box around the bias point
    params.set(
      "viewbox",
      `${data.bias.lng - d},${data.bias.lat + d},${data.bias.lng + d},${data.bias.lat - d}`,
    );
    params.set("bounded", "0");
  }
  try {
    const places = await fetchJson<NominatimPlace[]>(
      `https://nominatim.openstreetmap.org/search?${params}`,
    );
    const top = places?.[0];
    if (!top?.lat || !top?.lon) return { point: null, error: "No match found." };
    return { point: { lat: Number(top.lat), lng: Number(top.lon) }, error: null };
  } catch (e) {
    return { point: null, error: e instanceof Error ? e.message : "Geocode failed" };
  }
}
