# Paila — UI/UX Design System (Audit Remediation)

Brand direction (inferred, not specified in repo): **warm, earthy Nepal community-travel
aesthetic** — terracotta primary, pine secondary, stone/sand neutrals. Deliberate categorical
palettes (event badges, weather, status, map pins) are preserved as-is; this system governs only
shared UI chrome.

## Tokens (src/styles.css)

- `--primary` = deep terracotta `oklch(0.5 0.16 32)` — white label text meets WCAG AA (~4.6:1).
  The lighter brand terracotta `#d35d47` (`--color-terracotta`) stays for decorative accents.
- `--ring` / `--sidebar-ring` = terracotta, for brand-consistent focus visibility.
- Neutrals are warm stone-aligned (hue ~60–85) so chrome harmonizes with pervasive `stone-*`.
- Dark mode uses warm darks; primary brightens to `oklch(0.66 0.17 32)` with dark label text.

## Radii (aligned to actual app usage)

- `--radius-card: 16px` → `rounded-card` (cards, used as `rounded-2xl`).
- `--radius-sheet: 24px` → `rounded-sheet` (bottom/top sheets, `rounded-3xl`).
- `--radius-modal: 24px` → `rounded-modal` (dialogs, `rounded-3xl`).
- Buttons use `rounded-lg`. Inputs use `rounded-xl`.

## Shadows

- `shadow-card` — resting cards. `shadow-card-md` — raised cards.
- `shadow-tactile` — dialogs & sheets (replaces `shadow-lg`/`shadow-2xl`).
- `shadow-float` — bottom-sheet modals & toasts.

## Components (src/components/ui)

- `Button` — `rounded-lg`, `focus-visible:ring-2 ring-ring ring-offset-2`.
- `Input` — `rounded-xl`, `h-10`, white bg, terracotta focus ring.
- `Card` — `rounded-card shadow-card`.
- `Dialog` — `rounded-modal shadow-tactile`.
- `Sheet` — `rounded-sheet shadow-tactile` (per side).
- `Badge` — token-driven, focus ring present.
- `Sonner` — `shadow-float`, token-driven.
- `.input` global utility — same treatment as `Input`, dark-aware (`dark:bg-card`).

## Rules for subsequent work

- Use tokens (`bg-primary`, `text-muted-foreground`, `border-border`) not hard-coded
  `stone-*`/`slate-*` for chrome. Categorical palette objects in views stay as authored.
- Every interactive element gets a visible `focus-visible` ring.
- Touch targets ≥ 44px on mobile; no horizontal overflow at 375px.
- No data-fetching / auth / Supabase / i18n-key changes.
