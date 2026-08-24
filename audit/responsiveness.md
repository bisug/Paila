# Paila — Responsiveness & Touch-Target Audit Log

Scope: full mobile-first responsiveness pass (priority viewport **375px**, plus 768px,
1440px, and landscape 740×360). Covers horizontal overflow, desktop layout breaks,
touch targets < 44px, modal/sheet positioning on small screens, and text/image scaling.
Conformance target: `UI_UX_DESIGN_SYSTEM.md` + `src/styles.css`.

## Critical fixes

| Area | Issue | Fix |
|------|-------|-----|
| BookingModal | Overlay used `absolute inset-0` inside the page container — modal anchored to page content, rendered off-screen when the page was scrolled (verified: scrollY 2642 → modal top −2127px) | All 5 overlay states → `fixed inset-0` + desktop centering (`justify-center md:items-center`, inner `md:max-w-md`) |
| ScannerView | Fallback `<img>` sat in normal flex flow and stretched the viewfinder to the image height (1350px on desktop) | `absolute inset-0 h-full w-full object-cover` — viewfinder now 686px |
| ScannerView | Result sheet used `absolute` positioning (same scroll-anchoring class of bug as BookingModal) | `fixed inset-x-0 bottom-0` |
| notifications / preferences | Page headers `sticky top-0` stuck **under** the 56px/64px app-shell header | `sticky top-14 md:top-16` |

## Touch targets raised to ≥ 44px (16 files)

- **AppShellNavigation** — header SOS, menu, drawer close (`h-8 w-8` → `h-11 w-11`); drawer nav/hotels/SOS/profile links `py-3 min-h-[44px]`; compact sync badge spacing bumped (`text-[7px] px-1` → `text-[8px] px-2`)
- **HomeFeed** — search input, location button (`h-10` → `h-11`); alert chips, category chips, "View details" → `min-h-[44px]`; rec-card dismiss X `w-6 h-6` → `w-9 h-9`; `+1` mark-visited `min-w-[44px]`
- **TranslatorView** — language select `h-11`; clear button `h-11 w-11`; phrase chips + auto-speak toggle `min-h-[44px]`; word-meaning modal close `h-11 w-11`
- **TransportView** — From/To inputs `min-h-[44px]`; ticket modal close `h-11 w-11` + `aria-label`
- **guides page** — All/Saved toggle `py-2.5 min-h-[44px]`; "Get verified" link `min-h-[44px]`
- **FootprintMap** — Journey/Pins toggle `min-h-[44px]`
- **preferences page** — back button `w-11 h-11`; "Back to feed" link `min-h-[44px]`
- **notifications page** — back link → `grid h-11 w-11 place-items-center` with hover state
- **SosPanel / OfflineSyncModal** — close buttons `h-11 w-11` + `aria-label`
- **GuidesSection** — "Get verified" link `inline-flex items-center min-h-[44px]`
- **SidebarGuidesGroup** — full/drawer nav links `min-h-[44px]`
- **LanguageSwitcher** — trigger `h-11`; dropdown options `min-h-[44px]`
- **BookingModal** — close/back buttons `h-11 w-11`

## Chrome normalization

- `SosPanel` — 7 `slate-*` chrome classes → `stone-*` (backdrop, heading, close button, overdue card, SMS button, contact links, AMS score buttons)
- `OfflineSyncModal` — backdrop `bg-slate-950/50` → `bg-stone-950/50`

## Resolves earlier deferrals

- `discover.md` — Guides Index All/Saved segmented toggle (was deferred) → fixed, `min-h-[44px]`
- `discover.md` — HomeFeed `+1` mark-visited button (was deferred) → fixed, `min-w-[44px]`
- `scan-talk-booking.md` — TranslatorView clear button (fixed to `h-9 w-9` previously) → now `h-11 w-11`

## Still deferred

- HomeFeed nested-interactive recommendation cards (`role="button"` wrapping real buttons) — needs structural refactor
- Guide Profile bookmark `h-9` — matches sibling bookmark buttons app-wide; cosmetic
- "Online" SyncStatusBadge 34px — status indicator, not an interactive control
- HomeFeed dead modal code (SOSModal/CurrencyModal/PermitModal defined, never rendered) — deletion is a separate cleanup
- login inputs/toggles < 44px — system-wide `.input`/`Button` token decision (see `impact-auth.md`)
- preferences filter/reset chips — compact filter-row pattern

## Verification

- `npx tsc --noEmit` — clean
- `npm run lint` — clean
- `npx playwright test` — **38/38 passed** (desktop-chrome + mobile-chrome Pixel 5; route smoke, no horizontal overflow at mobile, keyboard focus)
- Browser DOM re-measurement: no overflow at 375px; drawer links all 44px; BookingModal visible after deep scroll (top 278); scan viewfinder 686px
- Headless-only artifact noted, no code change: `animate-slide-up` keyframes report frozen `currentTime: 0` in headless Chromium; forcing `animation.finish()` confirms correct final position
