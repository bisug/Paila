// Mapbox client config + helpers (client-safe; no server secrets here).
export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

// Decode a Google/Mapbox-format encoded polyline into { lat, lng } points.
// Mapbox Directions with geometries=polyline uses the same encoding as Google.
export function decodePolyline(str: string): { lat: number; lng: number }[] {
  const coords: { lat: number; lng: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < str.length) {
    let result = 1;
    let shift = 0;
    let byte: number;
    do {
      byte = str.charCodeAt(index++) - 63 - 1;
      result += byte << shift;
      shift += 5;
    } while (byte >= 0x1f);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 1;
    shift = 0;
    do {
      byte = str.charCodeAt(index++) - 63 - 1;
      result += byte << shift;
      shift += 5;
    } while (byte >= 0x1f);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coords.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return coords;
}
