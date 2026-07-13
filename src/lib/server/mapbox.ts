import { fetchWithTimeout } from "@/lib/server/guardrails";
import { PNG } from "pngjs";

export function getMapboxToken(): string {
  return process.env.MAPBOX_SECRET_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
}

export function missingMapboxTokenMessage(): string {
  return "Missing Mapbox access token (set NEXT_PUBLIC_MAPBOX_TOKEN)";
}

export async function fetchMapboxUrl(
  endpoint: string,
  params: Record<string, string | number | boolean | undefined> = {},
  timeoutMs = 8_000,
): Promise<Response> {
  const token = getMapboxToken();
  if (!token) throw new Error(missingMapboxTokenMessage());

  const url = new URL(endpoint);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, String(value));
  });
  url.searchParams.set("access_token", token);

  return fetchWithTimeout(url.toString(), {}, timeoutMs);
}

export async function fetchMapboxArrayBuffer(
  endpoint: string,
  params: Record<string, string | number | boolean | undefined> = {},
  timeoutMs = 8_000,
): Promise<ArrayBuffer> {
  const token = getMapboxToken();
  if (!token) throw new Error(missingMapboxTokenMessage());

  const url = new URL(endpoint);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, String(value));
  });
  url.searchParams.set("access_token", token);

  const res = await fetchWithTimeout(url.toString(), {}, timeoutMs);
  if (!res.ok) throw new Error(`Mapbox tile ${res.status}`);
  return res.arrayBuffer();
}

// Mapbox publishes elevation via the terrain-rgb tileset (encoded RGBA → meters).
// Formula: height = -10000 + ((R * 65536 + G * 256 + B) * 0.1)
export async function getElevationMeters(lat: number, lng: number): Promise<number | null> {
  if (!getMapboxToken()) return null;
  try {
    const z = 12;
    const n = Math.pow(2, z);
    const latRad = (lat * Math.PI) / 180;
    const x = Math.floor(((lng + 180) / 360) * n);
    const y = Math.floor(
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
    );

    const buf = await fetchMapboxArrayBuffer(
      `https://api.mapbox.com/v4/mapbox.terrain-rgb/${z}/${x}/${y}.pngraw`,
    );
    const png = PNG.sync.read(Buffer.from(buf));
    if (!png.width || !png.height) return null;

    const fx = ((lng + 180) / 360) * n - x;
    const fy =
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n - y;
    const px = Math.min(png.width - 1, Math.max(0, Math.round(fx * (png.width - 1))));
    const py = Math.min(png.height - 1, Math.max(0, Math.round(fy * (png.height - 1))));

    const i = (png.width * py + px) * 4;
    const r = png.data[i];
    const g = png.data[i + 1];
    const b = png.data[i + 2];
    const height = -10000 + (r * 65536 + g * 256 + b) * 0.1;
    if (!Number.isFinite(height)) return null;
    return Math.round(height);
  } catch {
    return null;
  }
}
