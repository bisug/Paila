<div align="center">

<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d35d47" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>

# Security

</div>

[← Wiki home](./README.md)

---

## Trust model

**RLS is the security boundary.** The anon/authenticated Supabase client is assumed hostile: it can only reach rows its policies allow. Server actions exist for validation and orchestration, not to bypass RLS — they run with the caller's identity via `createAuthenticatedSupabaseClient(token)`.

- **Never** use `SUPABASE_SERVICE_ROLE_KEY` on any client-reachable path.
- **Never** derive `userId` from a client-supplied field — always resolve it server-side from the access token.
- `proxy.ts` is defence-in-depth for routing (auth + admin role); page-level and action-level checks remain mandatory.

## Checklist for any new server-side surface

1. Resolve the session through `createAuthenticatedSupabaseClient` (or `requireAdmin()` for admin surfaces).
2. Validate inputs with zod or explicit regexes — sizes, types, ranges, ownership.
3. Scope queries with `.eq("user_id", userId)`; never filter ownership only on the client.
4. Rate-limit public API routes: `checkRateLimit(getClientKey(request, "<scope>"), limit, windowMs)` (in-memory, per-instance — see guardrails comment; Redis needed for multi-instance).
5. Wrap outbound HTTP in `fetchWithTimeout`.
6. Write an admin audit event for privileged actions.

## Secrets

- `.env*` files are gitignored; `SUPABASE_SERVICE_ROLE_KEY`, `MAPBOX_SECRET_TOKEN`, `OPENAI_API_KEY` are server-only.
- Public tokens (`NEXT_PUBLIC_*`) ship to the browser — restrict them at the provider (Mapbox URL allow-list) and assume they are visible.
- Never echo secrets into logs, chat, or commits. If a secret reaches a file, rotate it immediately.

## Headers & CSP

`next.config.ts` sets a strict `Permissions-Policy` (camera/microphone/geolocation `self`) and CSP. Rules when changing it:

- No new `unsafe-*` sources, no inline scripts.
- New external domains (maps tiles, fonts, CDNs) must be whitelisted explicitly.
- `dangerouslySetInnerHTML` is banned without sanitisation (none exists today).

## Input handling

- File uploads: extension-independent MIME checks + size caps (guide ID images, scan images) — both client (UX) and server (enforcement).
- Phone numbers pass through `sanitizePhoneNumber` before `tel:` links (SOS).
- Redirects: `getSafeRedirectPath` rejects protocol-relative, backslashes, and `/auth/*`-loops; fallback `/profile`.
- Storage paths are sanitised and folder-per-user; storage policies enforce folder ownership.

## Known limits (documented, accepted for the prototype)

- Rate limiting is in-memory per instance — multi-instance deployment needs a shared store.
- Demo mode opens `(app)` routes without a session (dev only; `NODE_ENV`-guarded).
- `/api/scan` demo returns canned content — always labelled in the UI; never ship without a label.
