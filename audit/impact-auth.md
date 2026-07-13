# UI/UX Audit — Impact & Auth Surfaces

**Scope:** `impact/page.tsx`, `notifications/page.tsx`, `account-type/page.tsx`,
`interests/page.tsx`, `login/page.tsx`, `auth-code-error/page.tsx`, `ImpactDashboard.tsx`.
UI-only remediation. No logic/data/auth/i18n changes. Tokens from `src/styles.css`
+ `UI_UX_DESIGN_SYSTEM.md`. Categorical palettes (impact metric colors, notification
unread pine tint, pine/terracotta brand accents) preserved.

**Severity:** Critical / High / Medium / Low.

| Page | State | Category | Issue | Severity | Resolution |
|------|-------|----------|-------|----------|------------|
| account-type | Selection / default | A / H | "Other business" toggle gave no selected/expanded visual distinction and had no `aria-expanded` | Medium | Fixed: `aria-expanded`, `border-terracotta bg-terracotta/5` when active, rotating `ChevronDown` |
| account-type | Selection cards | A | Selection + sub-panel used `rounded-2xl` instead of `rounded-card` token | Low | Fixed: `rounded-card` |
| account-type | Business sub-panel | D | `<select>` had no focus-visible style | Low | Fixed: `focus:border-terracotta focus:ring-2 focus:ring-terracotta/30` |
| account-type | Continue CTA | A / H | "Continue" used `bg-terracotta` (#d35d47 ~3.4:1) + white — fails WCAG AA | High | Fixed: `bg-primary` (deep terracotta ~4.6:1) `hover:bg-primary/90` |
| interests | Selection cards | A | Cards used `rounded-2xl` instead of `rounded-card` | Low | Fixed: `rounded-card` |
| interests | Continue CTA | D | CTA had no hover state (no `hover:bg`) | Medium | Fixed: added `transition-colors hover:bg-primary/90` |
| interests | Continue CTA | A / H | CTA used `bg-terracotta` + white — fails AA | High | Fixed: `bg-primary` `hover:bg-primary/90` |
| login | Login/Signup toggle | H | Segmented control buttons lacked `aria-pressed` | Medium | Fixed: `aria-pressed={authMode === mode}` |
| login | Email/Phone toggle | H | Segmented control buttons lacked `aria-pressed` | Medium | Fixed: `aria-pressed={identifierMode === …}` |
| login | Submit CTA | A / H | Submit used `bg-terracotta` + white — fails AA | High | Fixed: `bg-primary` `hover:bg-primary/90 transition-colors` |
| login | Fields | A | Inputs used `ring-terracotta/20`; system `.input`/`Input` use `/30` | Low | Fixed: `ring-terracotta/20` → `/30` (all instances) |
| login | Touch targets | C | Inputs (`py-2.5` ≈40px) and small toggles/password-eye (`h-7`) under 44px | Low | Deferred: matches system `.input` (h-10/py-2.5) and `Button` (h-9); recommend bumping the system token, not per-file overrides |
| notifications | Loaded items | A / B | Cards used `rounded-2xl` (no shadow) — inconsistent with `rounded-card shadow-card` chrome | Low | Fixed: `rounded-card shadow-card` |
| notifications | Loaded items | D | Notification `<Link>` items had no hover/focus affordance | Medium | Fixed: `block rounded-card transition hover:shadow-card-md` (global terracotta focus ring retained) |
| notifications | Long content | B / C | `body` not clamped — very long messages could dominate layout | Low | Fixed: `line-clamp-3` |
| notifications | Header | H | Icon-only back `<Link>` had no accessible name | Medium | Fixed: `aria-label="Back to home"` |
| notifications | Unread | E / F | Unread indicated only by subtle pine tint; no explicit "unread" marker | Low | Deferred: pine tint is the categorical accent and items are marked-read on load (transient); acceptable |
| notifications | Empty | F | "You're all caught up" empty state | — | OK (clear, no change needed) |
| notifications | Loading | E | Spinner state | — | OK (clear) |
| auth-code-error | Card | A | Card used `rounded-2xl`; it is a dialog-like surface | Low | Fixed: `rounded-modal` |
| auth-code-error | Card | A | Used `shadow-card-md`; dialogs use `shadow-tactile` | Low | Fixed: `shadow-tactile` |
| auth-code-error | Back CTA | A / H | "Back to Login" used `bg-terracotta` + white — fails AA | High | Fixed: `bg-primary hover:bg-primary/90`; `rounded-xl`→`rounded-lg` to match `Button` |
| auth-code-error | Microcopy | I | Message clarity | — | OK (expiry reason + next step) |
| ImpactDashboard | Achievements | H | Locked badge text used `stone-400`/`stone-300` (very low contrast) | Low | Fixed: bumped to `stone-500`/`stone-400` (locked state is WCAG-exempt, but improved) |
| ImpactDashboard | Achievements (empty) | F | No empty state if `impactBadges` is empty | Low | Fixed: dashed "No trail stamps yet…" message |
| ImpactDashboard | Loading | E | No loading state (component renders static mock; no data fetch) | Low | Deferred: would require wiring a loading state from a data source — out of scope (no fetch changes) |
| ImpactDashboard | Default | A / B | Radii, shadows, responsive grid (2/3/4 cols) | — | OK (`rounded-card`, `shadow-card`, no horizontal overflow at 375) |
| impact/page.tsx | — | — | Pass-through wrapper | — | N/A (nothing to remediate) |

## Summary

- **Found:** 23 distinct issues (4 High, 9 Medium, 10 Low).
- **Fixed:** 19 (all High + most Medium/Low).
- **Deferred:** 4 — all Low, with reasons: (1) touch-target < 44px is system-wide and should be fixed at the `.input`/`Button` token level, not per-file; (2) unread marker is a transient categorical accent; (3) impact loading state needs a data source, out of scope; (4) impact/page.tsx is a pass-through.

## Brand assumptions (flagged for owner confirmation)

1. **Primary CTA color.** The design system defines `--primary` (deep terracotta,
   `oklch(0.5 0.16 32)`, ~4.6:1 AA) and the shared `Button` `default` variant uses
   `bg-primary`. The audited screens instead used `bg-terracotta` (#d35d47, ~3.4:1 —
   fails AA with white text) for primary actions. I aligned CTAs to `bg-primary`.
   **If the lighter `#d35d47` is the intended brand primary, the design system's
   `--primary` token and `Button` component must be reconciled** (the lighter shade
   cannot carry white label text at AA). Decorative icon chips keep `bg-terracotta`
   (non-text, passes 3:1 graphic contrast per the design system's stated intent).
2. **Radius for cards.** Treated `rounded-card` (16px) as the canonical card radius;
   `rounded-modal`/`shadow-tactile` for the auth-error dialog surface.
3. **`stone-*` is the brand neutral.** The audit only unified *cool* `slate-*` (none
   present) and token-driven chrome; pervasive `stone-*` was left intact as the
   documented warm brand neutral. No `slate-*` chrome was found in these files.
4. **Error/status reds** (`red-50`/`red-700`) and pine notice tints left as-is — they
   are consistent system-status styling already shared across screens.
