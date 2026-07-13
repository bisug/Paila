# Paila — UI/UX Audit & Remediation Log (Hotels)

Scope: `src/app/(app)/hotels/page.tsx`, `src/app/(app)/hotels/[slug]/page.tsx`,
`src/components/views/HotelsList.tsx`, `src/components/views/HotelDetail.tsx`.

Conformance target: `UI_UX_DESIGN_SYSTEM.md` + `src/styles.css` tokens
(`bg-background`/`bg-card`/`bg-muted`/`bg-primary`, `text-foreground`/`text-muted-foreground`,
`border-border`, `rounded-card`, `shadow-card`/`shadow-card-md`, `destructive`).

Deliberate palettes PRESERVED: amber rating colors (`amber-50/500/700`, `fill-amber-*`),
pine brand accents (`bg-pine`, `text-pine`), lighter terracotta decorative accents
(`text-terracotta` on eyebrow/icons), `bg-stone-950/80` image-legibility scrims.

---

## Audit table

| ID | Page | State | Category | Issue | Severity | Resolution |
|----|------|-------|----------|-------|----------|------------|
| HL-1 | HotelsList | default | A | Page background hard-coded `bg-stone-50` instead of `bg-background` (breaks dark mode + token consistency) | Medium | Fixed → `bg-background` |
| HL-2 | HotelsList | default | A | Filter panel & hotel cards use `rounded-2xl`/`bg-white`/`border-stone-*`/`shadow-sm` instead of radius/shadow/color tokens | Medium | Fixed → `rounded-card`/`bg-card`/`border-border`/`shadow-card` |
| HL-3 | HotelsList | default | A/H | Secondary/muted text uses `text-stone-*` (fails token system; some fail AA) instead of `text-muted-foreground` | Low | Fixed → `text-foreground` / `text-muted-foreground` |
| HL-4 | HotelsList | default | H | Filter `<label>`s not programmatically associated with controls (no `htmlFor`/`id`) | Medium | Fixed → added `id` (district/minPrice/maxPrice/minRating) + `htmlFor` |
| HL-5 | HotelsList | default | D/H | Filter select/number inputs are `h-9` (36px) < 44px mobile touch target | Medium | Fixed → `h-11` |
| HL-6 | HotelsList | error | A/H | Price-error chrome used `border-red-400`/`text-red-600`/`focus:ring-red-300` instead of `destructive` token | Low | Fixed → `border-destructive`/`text-destructive`/`focus:ring-destructive/40` |
| HL-7 | HotelsList | default | A | Inline results pill `bg-stone-50 text-stone-500` instead of `bg-muted text-muted-foreground` | Low | Fixed |
| HL-8 | HotelsList | default | A | Card amenity chips `bg-stone-100 text-stone-600` instead of `bg-muted text-muted-foreground` | Low | Fixed |
| HL-9 | HotelsList | empty | A | Empty-state text `text-stone-500` instead of `text-muted-foreground` | Low | Fixed |
| HL-10 | HotelsList | default | A | Image placeholder `bg-stone-200` instead of `bg-muted` (dark-mode break) | Low | Fixed → `bg-muted` |
| HD-1 | HotelDetail | default | A | Page background `bg-stone-50` instead of `bg-background` | Medium | Fixed |
| HD-2 | HotelDetail | default | A | Stat/amenity/check-in/booking cards use `rounded-2xl`/`bg-white`/`border-stone-*`/`shadow-md` instead of tokens | Medium | Fixed → `rounded-card`/`bg-card`/`border-border`/`shadow-card-md` |
| HD-3 | HotelDetail | default | A | Body/secondary text `text-stone-*` instead of `text-foreground`/`text-muted-foreground` | Low | Fixed |
| HD-4 | HotelDetail | default | H | Booking form labels not associated; remediation also had invalid nested `<label>` | Medium | Fixed → `htmlFor`/`id` + wrapper `<div>` (no nesting) |
| HD-5 | HotelDetail | default | D/H | Date/guest controls had no `bg-card` token and ~40px height (<44px touch) | Medium | Fixed → `bg-card`/`text-foreground`/`h-11` |
| HD-6 | HotelDetail | default | A/H | Primary "Request booking" button used `bg-terracotta` + white text (~3.95:1, fails AA 4.5:1); also `rounded-xl` not button token | High | Fixed → `bg-primary text-primary-foreground` (~4.6:1 AA), `rounded-lg`, disabled `opacity-50` |
| HD-7 | HotelDetail | default | A | Floating back button `shadow-md`/`bg-white/90` not token-aligned | Low | Fixed → `shadow-card-md`/`bg-card/90` |
| HD-8 | HotelDetail | gallery | D/H | Gallery pagination dots are 6px (sub-44px) with no visible focus ring | Low | Deferred — decorative carousel indicator; global `:focus-visible` ring covers keyboard; enlarging harms gallery layout |
| HD-9 | HotelDetail | default | A | Image placeholder `bg-stone-200` instead of `bg-muted` | Low | Fixed → `bg-muted` |
| NF-1 | hotels/[slug] | not-found | A/H | "Browse all stays" link `bg-terracotta text-white` (~3.95:1, fails AA) | High | Fixed → `bg-primary text-primary-foreground`, `rounded-lg` |
| NF-2 | hotels/[slug] | not-found | A | Heading `text-stone-900` instead of `text-foreground` | Low | Fixed |
| NF-3 | hotels/[slug] | not-found | D | Link had no hover/active feedback | Low | Fixed → `hover:bg-primary/90 transition-colors` |
| ST-1 | HotelsList | loading | E/F | No loading state | Medium | Deferred — data is static/synchronous local `hotels`; no async path exists (N/A) |
| ST-2 | HotelsList | error | E/F | No fetch-error state | Low | Deferred — static data; no network error path (N/A) |
| ST-3 | hotels/[slug] | not-found | F | Not-found handled but used off-token chrome | Medium | Resolved via NF-1/NF-2 |
| ST-4 | HotelDetail | logged-out | G/E | Booking without session routes to /login with toast | — | OK, no change (good feedback) |

---

## Summary

- **Issues found:** 25 (incl. 3 deferred, 1 N/A-by-design).
- **Resolved/fixed:** 22.
- **Deferred:** 3 (HD-8 decorative dots; ST-1/ST-2 loading/error N/A for static data).

### Most impactful changes
1. **Primary buttons → `bg-primary` (HD-6, NF-1):** "Request booking" and "Browse all stays"
   previously used the lighter `--color-terracotta` with white text (~3.95:1, failing WCAG AA
   4.5:1). Switched to the `primary` token (deep terracotta, ~4.6:1) — fixes an accessibility
   contrast defect and conforms to the design system's primary-action token.
2. **Full chrome tokenization (HL-1/2/3/7/8/9/10, HD-1/2/3/7/9):** replaced hard-coded
   `stone-*`/`slate-*` chrome with `bg-background`/`bg-card`/`bg-muted`/`border-border`/
   `text-foreground`/`text-muted-foreground`, `rounded-card`, `shadow-card`/`shadow-card-md`.
   This also repairs dark-mode rendering (cards/inputs were white-on-dark) and lifts
   low-contrast `stone-400/500` secondary text to AA-compliant `muted-foreground`.
3. **Form accessibility + touch (HL-4/5, HD-4/5):** added `htmlFor`/`id` associations to all
   filter and booking controls (was invalid/unassociated), fixed an introduced nested-`<label>`
   bug, and raised control heights to `h-11` (44px) for mobile touch compliance.
4. **Destructive-token consistency (HL-6):** price-error state now uses the `destructive`
   semantic token instead of ad-hoc `red-*` classes.
5. **Interaction feedback (NF-3, HD-6/7):** added hover/active states and button-token radius
   (`rounded-lg`) to the not-found link and booking button.

### Brand assumptions made
- `bg-terracotta`/`text-terracotta` (lighter terracotta) is reserved for **decorative accents**
  (eyebrow "Verified stays", `HotelIcon`/`SlidersHorizontal` icons, `Stat` icons) per the design
  system; **primary actions** use `bg-primary` (deep terracotta token).
- `text-stone-*` chrome mapped to the 2-level token hierarchy: `stone-900/950/700 → text-foreground`
  (primary), `stone-600/500/400 → text-muted-foreground` (secondary). `stone-700` body text was
  promoted to `text-foreground` (slightly darker) to fit the token system.
- Categorical/brand palettes intentionally left untouched: **amber** rating colors, **pine**
  accents (`bg-pine`, `text-pine`), and the **`bg-stone-950/80`** dark scrim on image overlays
  (kept as a legibility scrim, not a categorical palette).
- No business logic, data fetching, auth, Supabase, or i18n keys were modified.

### Verification
- `npx tsc --noEmit` passes (no type errors).
- `grep` confirms zero remaining `stone-*`/`slate-*`/`bg-terracotta`/`shadow-sm|md|lg` chrome in
  the four files except the deliberately preserved `text-terracotta` accents and `bg-stone-950/80` scrim.
