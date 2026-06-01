"use server";

import { fetchGoogleMapsUrl } from "@/lib/server/google-maps";

export async function snapPath({ data }: { data: { points: { lat: number; lng: number }[] } }) {
  const path = data.points.map((p) => `${p.lat},${p.lng}`).join("|");
  const res = await fetchGoogleMapsUrl("https://roads.googleapis.com/v1/snapToRoads", {
    interpolate: true,
    path,
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
