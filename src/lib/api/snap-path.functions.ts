"use server";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

export async function snapPath({ data }: { data: { points: { lat: number; lng: number }[] } }) {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const gmKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!lovableKey) throw new Error("Missing LOVABLE_API_KEY");
  if (!gmKey) throw new Error("Missing GOOGLE_MAPS_API_KEY");

  const path = data.points.map((p) => `${p.lat},${p.lng}`).join("|");
  const url = `${GATEWAY_URL}/roads/v1/snapToRoads?interpolate=true&path=${encodeURIComponent(path)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": gmKey,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    return {
      snapped: [] as { lat: number; lng: number }[],
      error: `Roads API ${res.status}: ${body.slice(0, 200)}`,
    };
  }

  const json = (await res.json()) as {
    snappedPoints?: Array<{ location: { latitude: number; longitude: number } }>;
  };
  const snapped = (json.snappedPoints ?? []).map((p) => ({
    lat: p.location.latitude,
    lng: p.location.longitude,
  }));
  return { snapped, error: null as string | null };
}
