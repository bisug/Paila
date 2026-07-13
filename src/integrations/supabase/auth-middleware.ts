import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured } from "@/lib/server/guardrails";
import { supabase as mockSupabase } from "./client";

// `token` is accepted for backward compatibility with callers that still pass a
// client access token, but it is ignored: in real mode the caller identity is
// resolved from the session cookie, never from a client-supplied value.
export async function createAuthenticatedSupabaseClient(token?: string) {
  if (!isSupabaseConfigured()) {
    // Demo Mode: mocked client + seeded demo admin user.
    return {
      supabase: mockSupabase as any,
      userId: "demo-user-id",
      claims: { sub: "demo-user-id" },
    };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
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
            // Server Component / action context: cookie refresh is handled by middleware.
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  return {
    supabase: supabase as any,
    userId: user.id,
    claims: user.app_metadata,
  };
}
