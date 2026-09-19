<div align="center">

<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d35d47" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>

# Getting Started

</div>

[← Wiki home](./README.md)

---

## Prerequisites

| Tool         | Version | Notes                                                          |
| ------------ | ------- | -------------------------------------------------------------- |
| Bun          | ≥ 1.4   | Package manager & test runner (`packageManager` field pins it) |
| Node         | ≥ 20    | Runtime for Next.js dev/build                                  |
| Supabase CLI | latest  | Only needed to apply migrations to a real project              |

## Quick start (demo mode — zero config)

```bash
git clone https://github.com/bisug/Paila.git
cd Paila
bun install
bun run dev
```

Open http://localhost:3000. With no `.env.local`, the app runs in **demo mode**: an in-memory Supabase stand-in serves the bundled catalogue (`src/lib/data`), auth is open, and the scanner returns a labelled sample result.

## Connecting a real Supabase project

1. Create a project at [supabase.com](https://supabase.com/dashboard).
2. Apply the schema (creates tables, RLS, storage bucket, admin trigger):
   ```bash
   supabase link --project-ref <ref>
   supabase db push
   ```
3. Copy `.env.example` → `.env.local` and fill in:

| Variable                                              | Scope       | Purpose                                                        |
| ----------------------------------------------------- | ----------- | -------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                            | client      | Project URL                                                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`                       | client      | Anon key — RLS is the security boundary                        |
| `SUPABASE_SERVICE_ROLE_KEY`                           | server only | Bypasses RLS; **never** expose or use on client paths          |
| `NEXT_PUBLIC_MAPBOX_TOKEN`                            | client      | Maps, geocoding, directions                                    |
| `MAPBOX_SECRET_TOKEN`                                 | server only | Server-side Mapbox calls if the public token is URL-restricted |
| `OPENAI_API_KEY` / `OPENAI_BASE_URL` / `OPENAI_MODEL` | server only | Real site recognition for `/api/scan`                          |
| `ENABLE_DEMO_SCAN`                                    | server only | `true` serves the fixed sample scan; dev-only guard            |

4. Restart `bun run dev`. Middleware now enforces authentication and admin roles.

**Admin account:** set the admin email in the `admin_settings` table (row `id=1`, column `admin_email`). Any signup whose auth email matches is auto-promoted via the `promote_admin_on_signup` trigger (`supabase/migrations/20260713090000_admin_promotion.sql`).

## Scripts

| Command                           | What it does                         |
| --------------------------------- | ------------------------------------ |
| `bun run dev`                     | Dev server                           |
| `bun run build` / `bun start`     | Production build / serve             |
| `bun run lint`                    | ESLint                               |
| `bun run typecheck`               | `tsc --noEmit`                       |
| `bun run format` / `format:check` | Prettier                             |
| `bun test`                        | Unit tests                           |
| `bun run test:e2e`                | Playwright (desktop + mobile Chrome) |

## Quality gates — run before every PR

```bash
npx prettier --check .
bun run lint
bun run typecheck
bun test
bun run test:e2e
```

All five are expected green on `main`. See [Testing](./08-testing.md) for details.
