import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig } from "./config";
import type { Database } from "./types";

const PROTECTED_PREFIXES = [
  "/admin",
  "/booking/success",
  "/guide/verify",
  "/notifications",
  "/onboarding",
  "/profile",
];

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function getSafeRedirectPath(value: string | null, fallback = "/profile") {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  if (value.startsWith("/auth/") || value.startsWith("/login")) return fallback;
  return value;
}

function redirectWithCookies(request: NextRequest, path: string, supabaseResponse: NextResponse) {
  const response = NextResponse.redirect(new URL(path, request.url));
  supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  return response;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { url, publishableKey } = getSupabasePublicConfig();

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data: claimsData } = await supabase.auth.getClaims();

  const { pathname, search } = request.nextUrl;
  const isSignedIn = !!claimsData?.claims?.sub;

  if (!isSignedIn && isProtectedPath(pathname)) {
    const next = encodeURIComponent(`${pathname}${search}`);
    return redirectWithCookies(request, `/login?next=${next}`, supabaseResponse);
  }

  if (isSignedIn && pathname === "/login") {
    const next = getSafeRedirectPath(request.nextUrl.searchParams.get("next"));
    return redirectWithCookies(request, next, supabaseResponse);
  }

  return supabaseResponse;
}
