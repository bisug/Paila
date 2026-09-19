// Free OpenStreetMap services replace the Mapbox REST APIs:
//   geocoding  → Nominatim (nominatim.openstreetmap.org)
//   routing    → OSRM public instances (routing.openstreetmap.de, FOSSGIS)
//   POI search → Overpass (overpass-api.de)
//   elevation  → Open-Meteo elevation API
// Nominatim usage policy requires a identifying User-Agent and no hard
// hammering — the map actions already rate-limit via enforceMapRateLimit.
import { fetchWithTimeout } from "@/lib/server/guardrails";

const USER_AGENT = "Paila/1.0 (https://github.com/bisug/Paila; prototype)";

export async function fetchJson<T>(url: string, timeoutMs = 10_000): Promise<T> {
  const res = await fetchWithTimeout(url, { headers: { "User-Agent": USER_AGENT } }, timeoutMs);
  if (!res.ok) throw new Error(`OSM service ${res.status}`);
  return (await res.json()) as T;
}

// Open-Meteo elevation: free, no key. Returns meters for the coordinate.
export async function getElevationMeters(lat: number, lng: number): Promise<number | null> {
  try {
    const json = await fetchJson<{ elevation?: number[] }>(
      `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`,
      8_000,
    );
    const m = json.elevation?.[0];
    return typeof m === "number" && Number.isFinite(m) ? Math.round(m) : null;
  } catch {
    return null;
  }
}
