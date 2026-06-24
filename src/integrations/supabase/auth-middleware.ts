import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { supabase as mockSupabase } from "./client";

export async function createAuthenticatedSupabaseClient(token: string) {
  // Demo Mode: Always return the mocked supabase client and a mock userId
  return {
    supabase: mockSupabase as any,
    userId: "demo-user-id",
    claims: { sub: "demo-user-id" },
  };
}
