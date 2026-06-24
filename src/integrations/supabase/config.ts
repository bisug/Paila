export function getSupabasePublicConfig() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    (typeof window === "undefined" ? process.env.SUPABASE_URL : undefined) ??
    "https://demo-supabase-url.supabase.co";
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    (typeof window === "undefined" ? process.env.SUPABASE_PUBLISHABLE_KEY : undefined) ??
    "demo-publishable-key";

  return { url, publishableKey };
}
