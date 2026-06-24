import { supabase as mockSupabase } from "./client";

export async function createSupabaseServerClient() {
  // Demo Mode: Always return the mocked client for server routes too
  return mockSupabase;
}
