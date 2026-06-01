import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/server/guardrails";

const UNKNOWN_CLIENT = "unknown";

function clientKeyFromHeaders(scope: string, h: { get(name: string): string | null }) {
  const forwardedFor = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = h.get("x-real-ip")?.trim();
  return `${scope}:${forwardedFor || realIp || UNKNOWN_CLIENT}`;
}

export async function enforceMapRateLimit(scope: string, limit: number, windowMs: number) {
  const h = await headers();
  if (!checkRateLimit(clientKeyFromHeaders(scope, h), limit, windowMs)) {
    throw new Error("Too many map requests. Try again in a minute.");
  }
}

export function assertLatLng(input: { lat: number; lng: number }) {
  const { lat, lng } = input;
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    throw new Error("Invalid coordinates.");
  }
  return { lat, lng };
}

export function sanitizePlaceName(value: string, fallback = "Selected place") {
  const name = value.trim().replace(/\s+/g, " ");
  if (!name) return fallback;
  return name.slice(0, 120);
}

export function sanitizePlaceSearchQuery(value: string) {
  const query = value.trim().replace(/\s+/g, " ");
  if (query.length < 2) throw new Error("Search query is too short.");
  if (query.length > 120) throw new Error("Search query is too long.");
  return query;
}

export function normalizeRadiusMeters(value: number | undefined, fallback: number, max: number) {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.min(Math.round(value), max);
}
