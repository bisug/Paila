"use server";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

export async function reverseGeocode({ data }: { data: { lat: number; lng: number } }) {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const gmKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!lovableKey) throw new Error("Missing LOVABLE_API_KEY");
  if (!gmKey) throw new Error("Missing GOOGLE_MAPS_API_KEY");

  const url = `${GATEWAY_URL}/maps/api/geocode/json?latlng=${data.lat},${data.lng}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": gmKey,
    },
  });

  if (!res.ok) {
    return {
      name: `Pin ${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`,
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
      name: `Pin ${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`,
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
    `Pin ${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`;

  return {
    name,
    address: top.formatted_address ?? null,
    placeId: top.place_id ?? null,
    error: null as string | null,
  };
}
