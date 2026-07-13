# Paila — Profile / Account / Preferences UI/UX Audit

Remediation pass on the six profile-area screens. Scope is **UI/chrome only**: no
data fetching, auth, Supabase, API routes, save handlers, i18n keys, or new UI
libraries were touched. Shared UI chrome (`stone-*`/`slate-*`) was unified to the
design-system tokens (`bg-background`, `bg-card`, `border-border`,
`text-foreground`, `text-muted-foreground`, `shadow-card`, `rounded-card`).
Deliberate categorical palettes were **preserved**: booking status tones,
terracotta/pine/amber brand accents, destructive (red) and warning (orange)
palettes, and the admin amber badge.

Severity: High = broken a11y/interaction; Medium = consistency/contrast; Low = polish.

| Page | State | Category | Issue | Severity | Status |
|------|-------|----------|-------|----------|--------|
| profile/page | loaded | A | Page bg hard-codes `bg-stone-50` instead of token `bg-background` | Medium | Fixed |
| profile/page | loaded | A | Cards use `bg-white`/`border-stone-100`/`shadow-sm` instead of `bg-card`/`border-border`/`shadow-card` | Medium | Fixed |
| profile/page | loaded | A | Primary text `text-stone-900` → `text-foreground` | Low | Fixed |
| profile/page | loaded | A | Muted text `text-stone-500` → `text-muted-foreground` | Low | Fixed |
| profile/page | loaded | H | Section labels `text-stone-400` fail AA contrast (~2.5:1) on white | Medium | Fixed |
| profile/page | loaded | A | Neutral icon tiles `bg-stone-100 text-stone-600` → `bg-muted text-muted-foreground` | Low | Fixed |
| profile/page | loaded | D | Row hover `hover:bg-stone-50` → `hover:bg-muted` | Low | Fixed |
| profile/page | logging out | E | Logout button has no disabled/loading state while signing out | Low | Fixed |
| account/page | loading | A | Spinner `text-stone-400` → `text-muted-foreground` | Low | Fixed |
| account/page | loading | F | Loading state has no label/message (spinner only) | Low | Deferred |
| bookings/page | loading | A | Spinner `text-stone-400` → `text-muted-foreground` | Low | Fixed |
| bookings/page | error | E | Error state is bare text — no card, no retry, no back link | Medium | Fixed |
| bookings/page | loaded | A | Cards `bg-white`/`border-stone-200`/`shadow-sm`/`rounded-2xl` → tokens | Medium | Fixed |
| bookings/page | empty | A | Empty card `border-stone-300 bg-white` → `border-border bg-card` | Low | Fixed |
| bookings/page | empty | B | Empty CTA `rounded-xl` → `rounded-lg` (button radius token) | Low | Fixed |
| bookings/page | loaded/empty | B | No max-width wrapper on desktop; full-bleed at 1024/1440 | Low | Fixed |
| settings/page | loaded | A | Page/cards `bg-stone-50`/`bg-white`/`border-stone-100`/`shadow-sm` → tokens | Medium | Fixed |
| settings/page | loaded | H | Notification & Dark Mode "switches" are non-interactive divs: no `role`, `aria-checked`, keyboard support, and do nothing (fake controls) | High | Fixed |
| settings/page | loaded | D | Language toggle buttons `rounded-xl` → `rounded-lg` | Low | Fixed |
| settings/page | loaded | A | Muted text `text-stone-500` → `text-muted-foreground` | Low | Fixed |
| preferences/page | loaded | A | Search input is raw `<input>` with `focus:outline-none` and no `focus:border-terracotta`; should use shared `.input` utility | Medium | Fixed |
| preferences/page | loaded | H | Search input has no descriptive label/`aria-label` | Low | Fixed |
| preferences/page | loaded | A | Active filter pill uses cool `bg-stone-800 text-white`; unify to brand `bg-primary text-primary-foreground` | Medium | Fixed |
| preferences/page | loaded | A | Cards/tiles `bg-white`/`border-stone-200`/`rounded-xl` → `bg-card`/`border-border`/`rounded-card` | Low | Fixed |
| preferences/page | empty | A | Empty-state icon container `bg-stone-100 text-stone-400` → `bg-muted text-muted-foreground` | Low | Fixed |
| preferences/page | loaded | A | Back button `bg-stone-100 text-stone-700 hover:bg-stone-200` → `bg-muted text-foreground hover:bg-accent` | Low | Fixed |
| preferences/page | loaded | C | Filter chips / "Reset all" chip height < 44px touch target | Low | Deferred |
| AccountClient | loaded | A | Page/cards/tiles `bg-stone-50`/`bg-white`/`border-stone-100`/`shadow-sm`/`text-stone-*` → tokens | Medium | Fixed |
| AccountClient | loaded | H | Sub-labels `text-[11px] text-stone-400` fail AA contrast; use `text-muted-foreground` | Medium | Fixed |
| AccountClient | editing | H | Form `<label>` not programmatically tied to inputs (no `htmlFor`/`id`) | Medium | Fixed |
| AccountClient | editing | H | Gender segmented control not exposed as a radiogroup (`role`/`aria-checked` missing) | Medium | Fixed |
| AccountClient | editing | D | Gender control `bg-stone-100`/`text-stone-500` → `bg-muted`/`text-muted-foreground`; Cancel `border-stone-200 text-stone-600` → tokens | Low | Fixed |

## Resolution summary

- Fixed: 30
- Deferred: 2
  - `account/page` loading message — spinner is an accepted app-wide pattern; label not added to keep parity with other screens.
  - `preferences/page` filter/reset chips touch target — small chip affordance consistent with the rest of the app; enlarging to 44px would break the compact filter row layout.

## Brand assumptions (flagged, not changed)

- CTAs in these screens use `bg-terracotta` (`#d35d47`, the lighter brand terracotta)
  while the design system defines `bg-primary` (deep terracotta `oklch(0.5 0.16 32)`)
  for primary buttons. Both are on-brand; left as-is to avoid a visual shift and to
  keep parity across screens. Recommend a single decision (primary CTA = `bg-primary`
  vs `bg-terracotta`) at the design-system level.
- Mock account stats ("4 stamps", "Rs 14,500", "Annapurna Guardian") are hardcoded
  placeholder data, not UI — left untouched per scope.
- Settings toggles (Notifications / Dark Mode) have no persistence handler in this
  prototype; converted to accessible `role="switch"` controls with local visual
  state only. Wire to real persistence when available.
