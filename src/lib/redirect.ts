// Shared hardened redirect-target parsing (open-redirect protection).
// Only same-site absolute paths are accepted; protocol-relative ("//"),
// backslashes, and auth loops fall back to the default.
export function getSafeRedirectPath(value: string | null, fallback = "/profile") {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  if (value.startsWith("/auth/") || value.startsWith("/login")) return fallback;
  return value;
}
