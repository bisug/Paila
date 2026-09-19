type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

export function getClientKey(request: Request, scope: string): string {
  return clientKeyFromHeaders(scope, request.headers);
}

export function clientKeyFromHeaders(scope: string, h: { get(name: string): string | null }) {
  const forwardedFor = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = h.get("x-real-ip")?.trim();
  return `${scope}:${forwardedFor || realIp || "unknown"}`;
}

// shortcut: in-memory per-instance buckets; a multi-instance deployment needs a
// shared store (e.g. Redis). Cap prevents unbounded growth from spoofed IPs.
const MAX_BUCKETS = 10_000;

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) {
      for (const [k, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(k);
      }
      // Still full after pruning (all active): refuse rather than grow forever.
      if (buckets.size >= MAX_BUCKETS) return false;
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

export async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export function isDemoEnabled(name: string): boolean {
  return process.env.NODE_ENV !== "production" && process.env[name] === "true";
}

/** True when a real Supabase project is wired (anon key present). */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** Demo mode: no real Supabase and not a production build. */
export function isDemoMode(): boolean {
  return process.env.NODE_ENV !== "production" && !isSupabaseConfigured();
}
