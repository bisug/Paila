import { fetchWithTimeout } from "@/lib/server/guardrails";

export function getGoogleMapsServerKey() {
  return process.env.GOOGLE_MAPS_API_KEY;
}

export function missingGoogleMapsKeyMessage() {
  return "Missing GOOGLE_MAPS_API_KEY";
}

export async function fetchGoogleMapsJson<T>(
  endpoint: string,
  init: RequestInit = {},
  timeoutMs = 8_000,
): Promise<Response> {
  const apiKey = getGoogleMapsServerKey();
  if (!apiKey) {
    throw new Error(missingGoogleMapsKeyMessage());
  }

  const headers = new Headers(init.headers);
  headers.set("X-Goog-Api-Key", apiKey);

  return fetchWithTimeout(
    endpoint,
    {
      ...init,
      headers,
    },
    timeoutMs,
  );
}

export async function fetchGoogleMapsUrl(
  endpoint: string,
  params: Record<string, string | number | boolean | undefined>,
  timeoutMs = 8_000,
) {
  const apiKey = getGoogleMapsServerKey();
  if (!apiKey) {
    throw new Error(missingGoogleMapsKeyMessage());
  }

  const url = new URL(endpoint);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, String(value));
  });
  url.searchParams.set("key", apiKey);

  return fetchWithTimeout(url.toString(), {}, timeoutMs);
}
