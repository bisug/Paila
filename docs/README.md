<div align="center">

<img src="../src/assets/logo.svg" alt="Paila logo" width="96" />

# Paila Wiki

**Engineering documentation for the Paila travel platform**

</div>

---

> [!NOTE]
> Everything here is kept current with `main`. If a page contradicts the code, trust the code and open an issue.

## 📚 Contents

|                                                                                                                                                                                                                                                                                                                                                                          | Document                                       | What it covers                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- | ----------------------------------------------------------- |
| <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9h.01"/><path d="M9 12h.01"/><path d="M9 15h.01"/></svg>                                                                           | [Architecture](./01-architecture.md)           | System layers, route groups, project layout, demo mode      |
| <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>                                                                                                                                                                      | [Getting Started](./02-getting-started.md)     | Install, environment variables, scripts, demo mode          |
| <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>                                                                                                                          | [UI & Design System](./03-ui-design-system.md) | Color tokens, typography, components, accessibility rules   |
| <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M6 21V9a9 9 0 0 1 9 9"/></svg>                                                                                                                    | [User Flows](./04-user-flows.md)               | End-to-end traces: booking, guides, verification, scan, SOS |
| <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg>                                                                                                      | [Backend & Data](./05-backend-and-data.md)     | Schema, RLS policies, server actions, API routes            |
| <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>                                                       | [Internationalisation](./06-i18n.md)           | 25 locales, RTL, adding translations                        |
| <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>                                                                                                                                                          | [Security](./07-security.md)                   | Auth, RLS trust model, rate limits, guardrails              |
| <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>                                                                                                                  | [Testing & Quality Gates](./08-testing.md)     | bun test, Playwright, lint/format/type gates                |
| <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg> | [Deployment](./09-deployment.md)               | Vercel setup, migrations, production checklist              |
| <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>                                                    | [Contributing](./CONTRIBUTING.md)              | Conventions, commit style, PR checklist                     |

## At a glance

| Layer           | Choice                                                   | Where it lives                 |
| --------------- | -------------------------------------------------------- | ------------------------------ |
| Framework       | Next.js 16 (App Router) + React 19                       | `src/app`                      |
| Styling         | Tailwind CSS v4, oklch design tokens                     | `src/styles.css`               |
| Backend         | Supabase (Postgres, Auth, Storage) + Next server actions | `src/lib/actions`, `supabase/` |
| Maps            | Mapbox GL via `react-map-gl`                             | `src/components/views/map`     |
| i18n            | i18next, 25 locales incl. RTL                            | `src/locales`                  |
| Testing         | Bun test + Playwright (desktop & mobile)                 | `src/**/*.test.ts`, `e2e/`     |
| Package manager | Bun 1.4                                                  | `bun.lock`                     |

## TL;DR commands

```bash
bun install
bun run dev        # demo mode — zero env vars needed
bun run lint && bun run typecheck
bun test && bun run test:e2e
```
