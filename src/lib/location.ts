// lib/location.ts

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Calculates the distance between two coordinates in kilometers using the Haversine formula.
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const toRadian = (angle: number) => (Math.PI / 180) * angle;
  const distance = (a: number, b: number) => (Math.PI / 180) * (a - b);
  const RADIUS_OF_EARTH_IN_KM = 6371;

  const dLat = distance(coord2.lat, coord1.lat);
  const dLon = distance(coord2.lng, coord1.lng);

  const lat1 = toRadian(coord1.lat);
  const lat2 = toRadian(coord2.lat);

  // Haversine Formula
  const a =
    Math.pow(Math.sin(dLat / 2), 2) +
    Math.pow(Math.sin(dLon / 2), 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.asin(Math.sqrt(a));

  return RADIUS_OF_EARTH_IN_KM * c;
}

/**
 * Helper to fetch the user's current location via browser Geolocation API.
 */
export function getUserLocation(): Promise<Coordinates> {
  // Demo Mode: Always return a static location (Pokhara Lakeside) without prompting the browser
  return Promise.resolve({
    lat: 28.2096,
    lng: 83.9586,
  });
}
