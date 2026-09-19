<div align="center">

<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d35d47" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg>

# Backend & Data

</div>

[← Wiki home](./README.md)

---

## Schema (from `supabase/migrations/`)

| Table                 | Purpose                   | Key columns                                                                                                                                                                         |
| --------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`            | Account type + basic info | `user_id` PK, `account_type`, `business_type`, `full_name`, `gender`                                                                                                                |
| `user_roles`          | Role assignment           | `user_id`, `role` (`admin`)                                                                                                                                                         |
| `guide_verifications` | Guide KYC                 | `full_name`, `guide_id_number`, `place`, `phone`, `id_card_path`, `status` (`pending/approved/rejected`), `review_note`; `UNIQUE(user_id)`; CHECK constraints mirror client regexes |
| `bookings`            | Hotel bookings            | `hotel_slug/name/location/image`, dates, `nights`, `total_npr`, `total_usd_cents`, `status` (`pending/confirmed/cancelled/failed`)                                                  |
| `checkpoints`         | Map pins                  | `user_id`, `lat`, `lng`, `name`, `address`, `place_id`                                                                                                                              |
| `notifications`       | Inbox                     | `title`, `body`, `link`, `read`, `type`                                                                                                                                             |
| `user_interests`      | Onboarding interests      | `interests` (array), `onboarded`                                                                                                                                                    |
| `admin_settings`      | Singleton config          | `admin_email` (drives admin promotion)                                                                                                                                              |
| `admin_audit_events`  | Admin action log          | —                                                                                                                                                                                   |

Storage: private `guide-ids` bucket, folder-per-user (`user_id/filename`).

Helper: `has_role(_user_id, _role)` — `SECURITY DEFINER` SQL function used inside policies.

## Row Level Security

RLS is enabled on every table. Mental model: **the anon/authenticated client can only ever touch its own rows; anything cross-user goes through a server action.**

| Table                 | authenticated can                                                                                      | Notes                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `profiles`            | SELECT/INSERT/UPDATE own                                                                               | —                                                                                    |
| `user_interests`      | SELECT/INSERT/UPDATE own                                                                               | —                                                                                    |
| `guide_verifications` | SELECT/INSERT/UPDATE own (own = any status); **SELECT approved rows of others**; admins see/update all | The approved-read policy (20260919 migration) is what makes `/guides` discovery work |
| `bookings`            | SELECT/INSERT own; **UPDATE own pending rows** (cancellation)                                          | Cancel action additionally filters `status='pending'`                                |
| `notifications`       | SELECT/UPDATE own                                                                                      | Admins SELECT all                                                                    |
| `checkpoints`         | SELECT/INSERT/DELETE own                                                                               | —                                                                                    |
| `user_roles`          | SELECT own; admin SELECT all                                                                           | Promotion is trigger-based, never client-writable                                    |

**Adding a table:** enable RLS, write owner-scoped policies, GRANT explicitly, and add a migration — never ship a table with RLS disabled.

## Server actions (`src/lib/actions/`)

Actions are the only place mutations should live. Contract:

```ts
"use server";
export async function checkoutHotel({ data }: { data: {...} }) {
  if (!data.token) throw new Error("Unauthorized");           // 1. auth
  const { supabase, userId } =
    await createAuthenticatedSupabaseClient(data.token);       // 2. verified session
  // 3. validate inputs (types, ranges, ownership)
  // 4. query, then `if (error) throw new Error(error.message)`
}
```

| Action file                                                | Exports                                                          |
| ---------------------------------------------------------- | ---------------------------------------------------------------- |
| `bookings.ts`                                              | `checkoutHotel`, `listMyBookings`, `getBooking`, `cancelBooking` |
| `geocode.ts`                                               | `forwardGeocode` (Mapbox, server key)                            |
| `compute-route.ts`                                         | `computeRoute` (Directions + polyline decode)                    |
| `nearby-places.ts`, `search-places.ts`, `place-context.ts` | Map content                                                      |
| `admin-guide-verifications.ts`                             | approve/reject with `requireAdmin()` + audit event               |

## API routes (`src/app/api/`)

| Route                 | Guards                  | Behaviour                                                                                                       |
| --------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `POST /api/scan`      | session + 10 req/min/IP | Validates ≤5 MB JPG/PNG/WebP; 501 unless real recognition or `ENABLE_DEMO_SCAN`; demo returns a labelled sample |
| `POST /api/translate` | rate-limited            | Server-side translation provider call                                                                           |

## Auth plumbing

- `integrations/supabase/client` — browser client (or demo stand-in).
- `integrations/supabase/auth-middleware.ts` — `createAuthenticatedSupabaseClient(token)` resolves the user server-side from the access token; actions derive `userId` from it, never from the payload.
- `proxy.ts` — refreshes cookies on every navigation, gates `(app)` by session and `(admin)` by role, and preserves `?next=` on redirects.
- OAuth/email links land on `/auth/callback`, which exchanges the code and forwards to the safe `next` path.
