"use server";

import {
  assertLatLng,
  enforceMapRateLimit,
  normalizeRadiusMeters,
} from "@/lib/server/maps-guardrails";

export type NearbyPlace = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  types: string[];
  rating: number | null;
  userRatingCount: number | null;
};

// OSM tag filters per category group (Overpass regexes).
const EXPLORE_FILTER =
  '["tourism"~"^(museum|monument|attraction|viewpoint|artwork|gallery|zoo)$"];["historic"~"^."];["leisure"~"^(park|garden)$"]';
const HOTSPOT_FILTER =
  '["amenity"~"^(restaurant|cafe|bar|pub|fast_food|nightclub)$"];["tourism"~"^(hotel|hostel|guest_house)$"]';

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function toPlace(el: OverpassElement): NearbyPlace | null {
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  const name = el.tags?.name;
  if (lat === undefined || lng === undefined || !name) return null;
  const tags = el.tags ?? {};
  const types = [tags.tourism, tags.amenity, tags.historic, tags.leisure].filter(
    (t): t is string => !!t,
  );
  const street = tags["addr:street"];
  const city = tags["addr:city"];
  return {
    id: `${el.type}/${el.id}`,
    name,
    address: [street, city].filter(Boolean).join(", "),
    lat,
    lng,
    types,
    rating: null,
    userRatingCount: null,
  };
}

export async function getNearbyPlaces({
  data,
}: {
  data: {
    lat: number;
    lng: number;
    radiusMeters: number;
  };
}) {
  await enforceMapRateLimit("maps:nearby", 20, 60_000);

  const coords = assertLatLng(data);
  const radius = normalizeRadiusMeters(data.radiusMeters, 3000, 20_000);

  // One Overpass request covers both groups; classify locally by tags.
  const query =
    `[out:json][timeout:15];` +
    `nwr(around:${radius},${coords.lat},${coords.lng})${EXPLORE_FILTER};` +
    `nwr(around:${radius},${coords.lat},${coords.lng})${HOTSPOT_FILTER};` +
    `out center 40;`;

  try {
    const res = await fetch(`https://overpass-api.de/api/interpreter`, {
      method: "POST",
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(15_000),
      headers: { "User-Agent": "Paila/1.0 (https://github.com/bisug/Paila; prototype)" },
    });
    if (!res.ok) {
      return { explore: [], hotspots: [], error: `Overpass ${res.status}` };
    }
    const json = (await res.json()) as { elements?: OverpassElement[] };

    const exploreTags =
      /^(museum|monument|attraction|viewpoint|artwork|gallery|zoo|.*historic.*|park|garden)$/;
    const explore: NearbyPlace[] = [];
    const hotspots: NearbyPlace[] = [];
    for (const el of json.elements ?? []) {
      const place = toPlace(el);
      if (!place) continue;
      if (place.types.some((t) => exploreTags.test(t))) explore.push(place);
      else hotspots.push(place);
    }
    return {
      explore: explore.slice(0, 20),
      hotspots: hotspots.slice(0, 20),
      error: null as string | null,
    };
  } catch (e) {
    return {
      explore: [],
      hotspots: [],
      error: e instanceof Error ? e.message : "Nearby search failed",
    };
  }
}
