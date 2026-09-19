<div align="center">

<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d35d47" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9h.01"/><path d="M9 12h.01"/><path d="M9 15h.01"/></svg>

# Architecture

</div>

[← Wiki home](./README.md)

---

## System overview

Paila is a **single Next.js application** that contains both the UI and the server logic. There is no separate backend service — the boundary lives inside the repo and is enforced by convention:

```text
┌────────────────────────────────────────────────────────────┐
│                     Browser (React 19)                     │
│  src/app/** — pages, route groups, client components       │
│  Auth: Supabase JS client (anon key, RLS-limited)          │
└──────────────┬─────────────────────────────────────────────┘
               │ fetch / server action invocation
┌──────────────▼─────────────────────────────────────────────┐
│                Next.js server (Node runtime)               │
│  • proxy.ts  — middleware: session refresh + route gating  │
│  • src/lib/actions — "use server" mutations (validated)    │
│  • src/app/api    — route handlers (scan, translate)       │
│  • src/lib/server — guardrails, rate limits, secrets       │
└──────────────┬─────────────────────────────────────────────┘
               │
┌──────────────▼─────────────────────────────────────────────┐
│                          Supabase                          │
│  Postgres + RLS · Auth · Storage (guide-ids bucket)        │
└────────────────────────────────────────────────────────────┘
```

**Why no separate backend?** Supabase already provides auth, database, and storage. Server actions are the cheapest correct place for mutations. A standalone API service only becomes worth it when a second consumer (mobile app, partner API) or heavy async compute appears — see the trade-off note at the end.

---

## Route groups

`src/app` is organised into four groups with distinct shells and access rules:

| Group          | Path                                                                                                                                             | Shell                                      | Access                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ | ------------------------------------------------------------------------ |
| `(public)`     | `/login`, `/auth/*`                                                                                                                              | Auth layout, no app chrome                 | Public                                                                   |
| `(onboarding)` | `/onboarding/*`                                                                                                                                  | Focused single-column layout               | Public (page guards auth itself)                                         |
| `(app)`        | `/`, `/map`, `/scan`, `/talk`, `/transport`, `/guides`, `/hotels`, `/profile`, `/notifications`, `/preferences`, `/impact`, `/booking`, `/guide` | `AppShell` (sidebar / bottom nav / drawer) | Authenticated (gated by middleware)                                      |
| `(admin)`      | `/admin/*`                                                                                                                                       | Admin layout                               | `admin` role, enforced by middleware **and** `requireAdmin()` in actions |

Route groups never appear in URLs — `(app)/hotels/[slug]` serves `/hotels/sangachok-lodge`.

---

## Project layout

```text
src/
├─ app/                      # App Router: route groups, pages, api/
├─ components/
│  ├─ layout/                # AppShell, navigation, sync modal
│  ├─ views/                 # Screen bodies (HomeFeed, HotelsList, map/…)
│  ├─ modals/                # BookingModal, SosPanel
│  └─ ui/                    # Primitives: button, sheet, page-primitives
├─ lib/
│  ├─ actions/               # "use server" mutations — the backend boundary
│  ├─ server/                # guardrails, rate limiting, secrets (never client)
│  ├─ data/                  # Static catalogue: experiences, guides, transport…
│  ├─ hooks/                 # useVisitTracker, useGuideBookmarks, useUserInterests
│  └─ i18n.ts, translator.ts, location.ts, mapbox-loader.ts, …
├─ integrations/supabase/    # Client (browser), mock stand-in, auth middleware
├─ locales/                  # 25 language packs (common.json each)
├─ proxy.ts                  # Middleware (Next 16 name for middleware.ts)
└─ styles.css                # Tailwind v4 theme + design tokens
supabase/migrations/         # SQL schema + RLS + storage policies
e2e/                         # Playwright specs
```

**Import rules**

- Only `lib/actions/*` and `app/api/*` perform authenticated server-side Supabase work; client components use the anon client and rely on RLS.
- `lib/server/*` must never be imported from a client component (contains env-dependent guardrails).
- `lib/data/*` is the static catalogue used in demo mode and as seed content.

---

## Demo mode

A deliberate first-class feature so the app runs with **zero configuration**:

- `isDemoMode()` (`lib/server/guardrails.ts`) is true when `NODE_ENV !== "production"` and no Supabase env vars are set.
- `src/integrations/supabase/client` swaps the real client for an in-memory stand-in, so queries resolve against bundled data in `lib/data`.
- `proxy.ts` skips session refresh entirely when Supabase is not configured — the `(app)` group is open in demo.
- `ENABLE_DEMO_SCAN=true` makes `/api/scan` return a fixed sample result instead of erroring with 501.

Demo UI states are labelled honestly (prototype banners) so screens are never mistaken for real backend calls.

---

## Rendering & data-flow patterns

- **Client-heavy screens, server-validated mutations.** Pages fetch via the Supabase client; writes go through server actions that re-validate ownership and constraints.
- **Optimistic UI with rollback** — notifications mark-as-read reverts the list on failure.
- **Cross-component state**:
  - _Persisted domain state_ — localStorage hooks (`useVisitTracker`, `useGuideBookmarks`, event preferences).
  - _Pub-sub_ — `src/lib/notifications.ts` dispatches a window event so the shell's unread badge refreshes when the notifications page writes.
- **Forms** — client-side validation mirrors the server; the server action is the source of truth.

---

## When to split out a backend

| Signal                             | Action                                                 |
| ---------------------------------- | ------------------------------------------------------ |
| Second consumer (mobile, partners) | Extract actions into an API layer with typed contracts |
| Real ML for `/scan` / async jobs   | Dedicated worker + queue; keep Next thin               |
| Multi-instance rate limits         | Redis-backed rate limiting replaces in-memory buckets  |
| Heavy read traffic                 | Supabase read replicas / edge caching                  |

None of these are true today; splitting early only adds deployment and auth handoff cost.
