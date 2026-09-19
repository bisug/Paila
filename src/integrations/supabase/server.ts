import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured } from "@/lib/server/guardrails";
import { supabase as mockSupabase } from "./client";

export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured()) {
    // Demo Mode: mocked client for server routes too.
    return mockSupabase;
  }

  // Real mode: cookie-based server client. Used by the auth callback route,
  // which must be able to both read and write session cookies.
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Cookie writes outside a mutable context; middleware handles refresh.
          }
        },
      },
    },
  );
}
