"use server";

import { fetchGoogleMapsUrl } from "@/lib/server/google-maps";
import { assertLatLng, enforceMapRateLimit } from "@/lib/server/maps-guardrails";

export async function reverseGeocode({ data }: { data: { lat: number; lng: number } }) {
  await enforceMapRateLimit("maps:reverse-geocode", 60, 60_000);

  const coords = assertLatLng(data);
  const res = await fetchGoogleMapsUrl("https://maps.googleapis.com/maps/api/geocode/json", {
    latlng: `${coords.lat},${coords.lng}`,
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
    results?: Array<{
      formatted_address?: string;
      place_id?: string;
      address_components?: Array<{ long_name: string; types: string[] }>;
    }>;
  };
  const top = json.results?.[0];
  if (!top) {
    return {
      name: `Pin ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
      address: null,
      placeId: null,
      error: null,
    };
  }

  // Prefer a meaningful short name: locality > sublocality > neighborhood > route
  const comps = top.address_components ?? [];
  const pick = (t: string) => comps.find((c) => c.types.includes(t))?.long_name;
  const name =
    pick("point_of_interest") ||
    pick("premise") ||
    pick("route") ||
    pick("neighborhood") ||
    pick("sublocality") ||
    pick("locality") ||
    pick("administrative_area_level_2") ||
    pick("administrative_area_level_1") ||
    `Pin ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;

  return {
    name,
    address: top.formatted_address ?? null,
    placeId: top.place_id ?? null,
    error: null as string | null,
  };
}
