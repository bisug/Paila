import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Demo Mode: Always treat the user as authenticated and return next response
  const supabaseResponse = NextResponse.next({ request });
  return supabaseResponse;
}
