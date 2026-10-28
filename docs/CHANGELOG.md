# Changelog

All notable changes to Paila. Format follows [Keep a Changelog](https://keepachangelog.com/); dates are ISO.

## [Unreleased]

### Added

- Mobile sticky booking dock in `HotelDetail` for quick access to nightly totals and booking requests without scrolling.
- Direct `Impact` navigation item in desktop sidebar, mobile drawer, and active title resolution in `AppShell`.
- Quick phrase category tabs in `TranslatorView` with horizontal scrolling and pill controls.
- Viewfinder standby visual state in `ScannerView` with clear camera permission and upload actions.
- Collapse/expand indicator buttons for the desktop sidebar in `AppShellNavigation`.

### Changed

- Modernized mobile header breadcrumb context (`Paila / <Title>`) and bottom navigation with tactile pill indicators and safe-area padding.
- Modernized `WeatherWidget` with Himalayan trail design, consistent contrast, and stone/alpine palette.
- Modernized `EssentialsSection` with Lucide `ChevronDown`, authentic digital pass design for TIMS and ACAP permits, and currency converter inputs.
- Refined `TransportView` with segmented mode tabs, clear departure tags, route corridor badges, and responsive card styling.
- Polished `ImpactDashboard` metric cards and unlocked achievement stamps with accessible contrast.
- Polished `HotelsList` and `HotelCard` with brand terracotta pricing and responsive filters.
- Replaced browser `alert()` in `HomeFeed` with Sonner `toast.error()`.
- Adjusted floating map and voice controls in `FootprintMap` and `TranslatorView` to prevent overlap with mobile bottom navigation and the SOS FAB.

### Fixed

- Added graceful transient tile error handling to `FootprintMap` (`FootprintMap.tsx`):
  - Handled transient vector tile network hiccups, aborted requests during rapid map zooming/panning, and status 0 network drops via `onError`, eliminating uncaught `AJAXError` terminal traces while preserving automatic MapLibre retry behavior.
- Fixed MapLibre GL background web worker resolution in Next.js Turbopack (`src/lib/maps.ts`, `next.config.ts`):
  - Resolved `[browser] Error: Worker failed to load. Check that the worker URL is correct.` on `/map` by placing `maplibre-gl-worker.mjs` into `public/` and configuring `setWorkerUrl("/maplibre-gl-worker.mjs")`.
  - Added `worker-src 'self' blob:` to the Content Security Policy in `next.config.ts` to authorize local web worker script execution.
- Fixed landscape navigation breakdown across mobile and compact viewports (`AppShellNavigation.tsx`, `AppShell.tsx`, `styles.css`):
  - Resolved dual-sidebar collision on mobile landscape: added `.landscape-hide` to `DesktopSidebar` so the 256px desktop sidebar is suppressed on short landscape screens (height <= 550px) where Tailwind's `md:` breakpoint (width >= 768px) previously caused both `DesktopSidebar` and `LandscapeRail` to render simultaneously and overlap page content.
  - Expanded landscape media query breakpoint in `styles.css` from `max-width: 900px` to `max-width: 1080px`, ensuring modern large landscape phones (iPhone 14/15/16 Pro Max at 932px, Galaxy Ultra at 915px) properly activate landscape mode rather than breaking into desktop layout.
  - Added full navigation parity to `LandscapeRail`: added `Hotels` (`/hotels`), `Impact` (`/impact`), and `Profile` (`/profile`) routes alongside `SidebarGuidesGroup` and the emergency SOS button.
  - Wrapped `LandscapeRail` top brand icon in a home link and added `no-scrollbar` with smooth overflow scrolling for compact landscape devices.
  - Fixed duplicate branding and header alignment in `MobileHeader` during landscape orientation: hid duplicate logo and breadcrumbs when the rail is active, showing the clean page title and compact online status badge on the left, and preserving drawer menu access on the right.
  - Integrated safe-area insets (`env(safe-area-inset-left)`, `env(safe-area-inset-right)`, `env(safe-area-inset-bottom)`) into `LandscapeRail` and content offset for phones with display notches and dynamic islands.
- Resolved mobile layout and fixed-element collisions between the SOS FAB, bottom navigation, and action docks:
  - Elevated `MobileSosFab` above the sticky booking dock on `/hotels/[slug]` to prevent obstructing "Request Booking".
  - Docked the `HotelDetail` mobile booking bar above `MobileBottomNav` with `pb-40` content padding to ensure all information and actions are reachable.
  - Positioned `VoiceBar` on `/talk` above `MobileSosFab` and `MobileBottomNav` with `pb-44` scroll clearance, eliminating speech text and microphone tap overlaps.
  - Added bottom padding `pb-36` to `ImpactDashboard` and `pb-32` to `ScannerView` so cards and camera controls never tuck under the mobile navigation dock.
- Fixed desktop sidebar header overflow and clipped collapse toggle button:
  - Removed duplicate notification bell from the desktop sidebar (already present in the top desktop header).
  - Ensured `PanelLeftClose` toggle button fits comfortably with full visibility and zero border clipping.
- Fixed network status button touch target accessibility:
  - Enlarged `NetworkStatusButton` to `h-10 w-10` (40x40px touch box) meeting WCAG 2.5.5 / 2.5.8 touch target standards on mobile while maintaining the sleek 10px status dot.
- Fixed itinerary label formatting and elevation lookup:
  - Cleaned internal `(Return)` milestone suffix from `Pokhara Lakeside`, fixing the hero heading typography ("Plan the next step around Pokhara Lakeside") and weather widget elevation lookup (`822 m`).
- Fixed mobile horizontal clipping in `TransportView` mode tabs:
  - Replaced rigid `inline-flex` with responsive smooth-scrolling `flex no-scrollbar` container so all travel mode tabs (including "Trek" and "Shared") remain fully legible.
- Added smooth horizontal gradient edge fade to `HomeFeed` local alerts marquee.
- Replaced duplicate "6 stays" count badge in `HotelsList` with an active "Reset filters" action button.
- Fixed Next.js client hydration mismatch on `HomeFeed` (`LocalEventsSection` returning `null` during hydration vs SSR render due to direct `localStorage` read in `useState` and past event timestamps):
  - Deferred `localStorage` event preferences reading to post-hydration mount in `useEffect`.
  - Added `mounted` hydration guard to keep SSR and CSR initial render trees completely aligned.
  - Added `empty:hidden` to the events grid container so empty states don't introduce phantom layout gaps.
  - Updated mock dates in `LOCAL_EVENTS` to late 2026 and 2027 so demo events remain active and upcoming across all categories.
  - Added fallback resilience so expired demo events gracefully remain visible rather than disappearing.
  - Fixed matching hydration risk on `PreferencesPage` (`/preferences`).
- Removed invalid HTML markup (`<button>` inside `<p>`) in `ScannerView` standby state.
- Removed unused imports and variables across views (`FootprintMap`, `HomeFeed`, `AccountClient`, `SidebarGuidesGroup`, `hotels/[slug]`).
- Cleaned up redundant spread fallbacks in `src/lib/event-preferences.ts`.

### Changed

- Updated development workflows and package scripts: formatting uses `bun fmt`, typechecking uses `bun check`, and linting uses `oxlint`.
- Bumped `next` 16.3.2 → 16.3.5 and `sharp` → 0.35.4 (`bun audit` was failing with 2 critical Next.js RCE advisories and 1 high sharp/libheif advisory; now clean).
- API routes (`/api/scan`, `/api/translate`) now verify sessions with `supabase.auth.getUser()` instead of `getSession()`, per Supabase guidance (cookie session data is not re-validated server-side).
- `createSupabaseServerClient()` (auth callback route) and `supabaseAdmin` (admin guide verifications) now build real Supabase clients when env vars are configured instead of always returning the demo mock — production auth-code exchange and signed ID-card URLs would previously have hit the mock.
- Rate limiter buckets are capped (10k entries, expired windows pruned) so spoofed client IPs cannot grow the map unboundedly. Still per-instance in-memory; a multi-instance deployment needs a shared store.
- Moved `@types/pngjs` from dependencies to devDependencies.

- Deduplicated shared logic: hardened `getSafeRedirectPath` (login page + auth callback) now lives in `src/lib/redirect.ts`; API routes reuse `createAuthenticatedSupabaseClient()` instead of hand-rolled cookie clients; Mapbox fetchers share one URL builder.

### Removed

- Removed `prettier`, `eslint-config-prettier`, `eslint-plugin-prettier`, `.prettierrc`, and `.prettierignore` in favor of native `bun fmt`.
- Dead modules with no importers: `src/lib/error-capture.ts` and `src/lib/error-page.ts` (leftovers from a pre-Next h3 scaffold), `src/lib/config.server.ts` (empty placeholder).

### Fixed

- `format:check` no longer fails on `.agent/AGENTS.md` and `docs/CHANGELOG.md` (now prettier-formatted).

### Changed

- Updated all dependencies to latest: `@supabase/ssr` 0.12.5, `@supabase/supabase-js` 2.112.4, `lucide-react` 1.34.0, plus transitive bumps (browserslist data, eslint tooling, babel 7.x). `bun outdated` and `bun audit` clean.
- `.agent/AGENTS.md`: added mandatory Security section (secrets, auth/RLS, CSP, input validation, `bun audit` on dep changes, demo-mode guards).

### Fixed

- `bun audit` clean: bumped transitive `brace-expansion` 5.0.7 → 5.0.9 (2 high DoS advisories, via eslint/minimatch).

### Changed

- Moved AI agent guide to `.agent/AGENTS.md` (tracked in git); root `AGENTS.md`/`CLAUDE.md` stubs stay gitignored.
- Moved `CHANGELOG.md` and `CONTRIBUTING.md` into `docs/`; AI agents must read and update docs with every change (rule in `.agent/AGENTS.md`).
- CI hardened: bun pinned via `packageManager`, concurrency group, `format:check` step, chromium-only Playwright install, failure artifact upload.

## 2026-08-24

### Changed

- Migrated fully to **Bun** as the package manager (`bun.lock`, `packageManager: bun@1.4.0`, CI via `oven-sh/setup-bun`). npm removed.
- Restructured `src/lib`: server actions live in `src/lib/actions/`, static data split from one 677-line file into `src/lib/data/` modules behind a barrel.
- Renamed `src/components/ui/page.tsx` → `page-primitives.tsx`.

### Removed

- Auxiliary markdown docs (`AGENTS.md`, `CLAUDE.md`, `UI_UX_DESIGN_SYSTEM.md`, `audit/`); only `README.md` remains. `AGENTS.md`/`CLAUDE.md` gitignored (regenerated by `next dev`).
- Dead `SOSModal`, `CurrencyModal`, `PermitModal` components from `HomeFeed`.

## 2026-08-23

### Added

- Session guard for `(app)` routes in `src/proxy.ts`.
- Notifications bell in mobile header with unread-count badge (head-only count query).
- Floating SOS button on mobile (replaces header entry).

### Changed

- Mobile drawer moved from left to right.
- Online sync indicator replaced with a simple dot.
- CSP: `'unsafe-eval'` only in development; Mapbox domains replace Google Maps.
- Booking success page shows an empty state instead of an infinite spinner when the booking is missing.
- Recommendation cards: flattened nested interactive elements for valid a11y.
- Added `notifications` key to all 25 locale files.

## 2026-08-22

### Added

- Responsiveness pass across all routes; verified with Playwright (desktop + mobile Pixel 5), 38 e2e smoke tests green.
