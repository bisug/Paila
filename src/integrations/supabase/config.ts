export function getSupabasePublicConfig() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    (typeof window === "undefined" ? process.env.SUPABASE_URL : undefined);
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    (typeof window === "undefined" ? process.env.SUPABASE_PUBLISHABLE_KEY : undefined);

  if (!url || !publishableKey) {
    const missing = [
      ...(!url ? ["NEXT_PUBLIC_SUPABASE_URL"] : []),
      ...(!publishableKey ? ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"] : []),
    ];
    throw new Error(
      `Missing Supabase environment variable(s): ${missing.join(
        ", ",
      )}. Configure Supabase before using authentication.`,
    );
  }

  return { url, publishableKey };
}
