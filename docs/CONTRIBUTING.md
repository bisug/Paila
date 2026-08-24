# Contributing to Paila

Paila is a Next.js 16 (App Router, Turbopack) + React 19 + TypeScript travel platform for Nepal. Package manager is **Bun** — do not use npm/yarn/pnpm.

## Setup

1. Install [Bun](https://bun.sh) (pinned via `packageManager` in `package.json`).
2. `bun install`
3. `cp .env.example .env.local` — optional. With no env vars the app runs in **demo mode**: an in-memory Supabase stand-in, dev only.
4. `bun run dev`

## Scripts

| Command             | Purpose                                             |
| ------------------- | --------------------------------------------------- |
| `bun run dev`       | Dev server (Turbopack)                              |
| `bun run build`     | Production build                                    |
| `bun run lint`      | ESLint                                              |
| `bun run typecheck` | `tsc --noEmit`                                      |
| `bun run format`    | Prettier                                            |
| `bun run test:e2e`  | Playwright smoke suite (38 tests, desktop + mobile) |

Run `typecheck`, `lint`, and `test:e2e` before pushing; CI runs the same.

## Conventions

- **Structure**: server actions in `src/lib/actions/`, static data in `src/lib/data/` (import via the `@/lib/data` barrel), server-only helpers in `src/lib/server/`, route views in `src/components/views/`.
- **Styling**: Tailwind v4 design tokens in `src/styles.css` (terracotta/pine palette, `shadow-card`, `rounded-card`). Use tokens, not raw hex.
- **i18n**: user-facing strings go in `src/locales/<locale>/common.json` — all 25 locales must get new keys.
- **Auth/authz**: route guards live in `src/proxy.ts`; admin checks via `requireAdmin()` in server actions; RLS enforces owner-only data.
- **Env vars**: read them in server-only modules (`src/lib/server/`, `src/lib/config.server.ts`). Only `NEXT_PUBLIC_*` may reach the client. Update `.env.example` when adding one.
- **Commits**: small, focused commits with conventional-style messages (`feat:`, `fix:`, `chore:`, `refactor:`).

## Pull requests

1. Branch from `main`.
2. Keep diffs minimal — reuse existing helpers before adding new ones.
3. Describe what changed and how it was verified (typecheck/lint/e2e output).
