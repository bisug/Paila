<div align="center">

<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d35d47" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>

# Deployment

</div>

[← Wiki home](./README.md)

---

## Target

Vercel (Next.js 16 App Router, Node runtime). Supabase for data/auth/storage. Mapbox for geo services.

## Steps

1. **Database & policies** — apply all migrations in order (they are timestamped):
   ```bash
   supabase link --project-ref <ref>
   supabase db push
   ```
   Verify RLS is enabled on every table and the `guide-ids` storage bucket exists.
2. **Admin** — set `admin_settings.admin_email` (SQL editor or dashboard) so signups with that email are auto-promoted.
3. **Environment variables** (Vercel → Project → Settings → Environment Variables):

   | Required for a functioning app  | Optional                                            |
   | ------------------------------- | --------------------------------------------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`      | `SUPABASE_SERVICE_ROLE_KEY`                         |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `MAPBOX_SECRET_TOKEN`                               |
   | `NEXT_PUBLIC_MAPBOX_TOKEN`      | `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL` |

   **Do not set `ENABLE_DEMO_SCAN` in production** — it is hard-guarded to non-production builds anyway; belt and suspenders.

4. **Auth URLs** — in Supabase Auth settings, set the site URL and redirect allow-list to include `https://<domain>/auth/callback`.
5. **Mapbox restrictions** — URL-restrict the public token; use `MAPBOX_SECRET_TOKEN` for server calls if needed.
6. **Deploy** — connect the repo; `bun run build` semantics apply via Vercel's Next builder (framework-detected).

## Production checklist

- [ ] `bun run build` passes locally with production env.
- [ ] Demo-mode flags unset; scanning returns real results or a clean 501 with user-facing copy.
- [ ] All `(app)` routes redirect anonymous users to `/login?next=…` (test a deep link).
- [ ] Admin route redirects non-admins (test with a normal account).
- [ ] Booking → success → cancel round-trip works against the real database.
- [ ] Guide verification submission stores the file in the private bucket and the row is invisible to others until approved.
- [ ] Rate limits acceptable (`/api/scan` 10/min/IP) or backed by a shared store.
- [ ] Secrets present in Vercel, absent from the bundle (grep the build output for `NEXT_PUBLIC_` leakage of sensitive values).

## Rollback

Vercel promotes builds atomically — roll back from the deployment list. Migrations are additive so far (new policies/grants); a code rollback is safe without a DB rollback.

## Known production gaps

- Image recognition has no provider wired (`/api/scan` → 501 without OpenAI config).
- Rate limiting is per-instance memory.
- Payment flows (BookingModal wallet, transport tickets) are labelled prototypes — do not remove the disclosure until real providers are integrated.
