<div align="center">

<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d35d47" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>

# UI & Design System

</div>

[← Wiki home](./README.md)

---

## Tokens

All colors live in `src/styles.css` as **oklch** CSS custom properties, mapped to Tailwind utilities via `@theme inline`. Brand palette:

| Token                | Value                 | Use                                         |
| -------------------- | --------------------- | ------------------------------------------- |
| `terracotta`         | `#d35d47`             | Primary actions, accents, focus rings       |
| `terracotta-tint`    | `#fbf0ee`             | Primary-tinted surfaces                     |
| `pine`               | `#2a5c43`             | Success, secondary actions, "verified" cues |
| `pine-tint`          | `#eef5f1`             | Success-tinted surfaces                     |
| `sand` / `parchment` | `#f7f4f0` / `#ede6d8` | Backgrounds                                 |

Semantic tokens (`--background`, `--card`, `--muted-foreground`, `--destructive`, sidebar set, chart set) follow the shadcn convention; a `.dark` token block exists but is **not wired** — treat dark mode as unsupported until the app-wide conversion is done.

Radii: `--radius-card` (16px), `--radius-sheet`/`--radius-modal` (24px). Custom shadows: `shadow-card`, `shadow-card-md`, `shadow-float`, `shadow-tactile`.

## Typography & legibility rules

- Page title `text-2xl font-bold tracking-tight`; section headers `text-lg`; body `text-sm`.
- **Floor metadata text at 11px.** Anything below fails legibility; audit history here.
- Metadata uses `text-stone-500` minimum — `stone-400` on white (~2.9:1) fails WCAG AA.
- Terracotta on white ≈ 3.5:1: reserve for bold/large text, not small captions.

## Components

| Component                                                | File                                | Notes                                                                      |
| -------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------- |
| `Button`                                                 | `components/ui/button.tsx`          | shadcn/cva variants; `size="icon"` etc.                                    |
| `PageFrame` / `PageHeader` / `SectionHeader` / `Surface` | `components/ui/page-primitives.tsx` | Page scaffolding — prefer these over hand-rolled headers                   |
| `Sheet`                                                  | `components/ui/sheet.tsx`           | Radix-based bottom sheet                                                   |
| `AppShell` + nav parts                                   | `components/layout/AppShell*.tsx`   | Sidebar (desktop), bottom nav (mobile), drawer, SOS FAB, offline badge     |
| Modals                                                   | Radix `Dialog`                      | **All modals must use Radix** — focus trap, Escape, `aria-modal` come free |
| Toasts                                                   | `sonner`                            | Errors as `toast.error`, successes sparingly                               |

## Accessibility rules (enforced in review)

1. **Focus visibility** — global `:focus-visible` outline exists in `styles.css`; never `outline-none` without a replacement ring.
2. **Touch targets ≥ 44px** (`min-h-[44px]` / `h-11`). Small visuals may keep a larger hit area via `after:absolute after:-inset-*`.
3. **Icon-only buttons need `aria-label`.** Toggle-like controls get `aria-pressed`; menus follow the menu pattern (`aria-haspopup`, `aria-expanded`, Escape, focus return — see `LanguageSwitcher.tsx`).
4. **Forms** — every input has a bound `<label>` (`htmlFor`/`id`); errors use `role="alert"`, async outcomes `role="status"`.
5. **Reduced motion** — global `@media (prefers-reduced-motion)` collapses animations; new keyframe classes are covered automatically.
6. **Images** — `alt` present; decorative images use `alt=""` (they sit inside labelled cards).
7. **Dialogs** — Radix only. A hand-rolled `role="dialog"` without a focus trap is a review rejection.

## Honesty pattern (project-specific)

Prototype/demo behaviour is **always labelled on-screen** (amber note or "prototype" eyebrow): booking confirmations, transport reservations, guide slot requests, scan results, offline sync. Never show a fake success as a real one. New mock features must ship with their own disclosure.
