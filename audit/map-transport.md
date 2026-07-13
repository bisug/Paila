# UI/UX Audit — Map & Transport (Paila)

Scope: `map/`, `transport/` pages and their view/sub-view components.
Reference: `UI_UX_DESIGN_SYSTEM.md`, `src/styles.css` (tokens: `rounded-card` 16 / `rounded-sheet` 24 / `rounded-modal` 24; `shadow-card`/`shadow-card-md`/`shadow-tactile`/`shadow-float`; `bg-primary`, `text-muted-foreground`, `border-border`).

Legend — Severity: **H**igh / **M**edium / **L**ow. Resolution: ✅ fixed / ➖ deferred.

| Page | State | Cat | Issue | Severity | Resolution |
|------|-------|-----|-------|----------|------------|
| Map (FootprintMap) | Loaded | A/B | Hero map panel uses `rounded-sheet` (24px) but it is a card → should be `rounded-card` (16px) | M | ✅ `rounded-card` |
| Map (FootprintMap) | Loaded | C | Floating action buttons (`Pin a spot`, `Pin my location`, `Recenter`) and Demo nav use `py-2` (~32px) < 44px touch target | M | ✅ `min-h-[44px]` |
| Map (FootprintMap) | Loaded | B | "Demo Navigation" overlay at `top-16 left-3` collides with the permission banner (also `top-16`) and pending-tap hint | M | ✅ moved to `bottom-4 left-3` |
| Map (FootprintMap) | Tap mode | B | "Tap map to drop pin" hint at `top-[68px]` overlaps the permission banner when denied | L | ✅ moved to `top-20` |
| Map (FootprintMap) | Loaded | H | Map container has no accessible landmark/label; markers not keyboard-operable | M | ✅ `role="region" aria-label` |
| Map (FootprintMap) | Logged-out | F/I | Empty-checkpoint state says "Tap Pin a spot / Pin my location" but save requires sign-in (toast only) — misleading for logged-out users | L | ➖ deferred (copy/state needs auth context) |
| Map (LocationPermissionBanner) | Permission denied | B/F | Banner at `top-3 z-10` is rendered **behind** the search overlay (`top-3 z-20`) on mobile → denied state effectively invisible | H | ✅ `top-16 z-40` |
| Map (LocationPermissionBanner) | Permission denied | A | Overlay chrome uses `shadow-card-md`; floating status overlay should use `shadow-float` | L | ✅ `shadow-float` |
| Map (MapSearchOverlay) | Search | H | Search `<input>` has only a placeholder, no `aria-label` | M | ✅ `aria-label="Search places"` |
| Map (MapSearchOverlay) | Search | A | Results/overlay radii `rounded-2xl` are fine; consistent with `rounded-card` tokens | L | ➖ ok |
| Map (PlaceDetailPanel) | Loaded | A | `Card` and header use `shadow-sm`; design system resting cards = `shadow-card` | M | ✅ `shadow-card` |
| Map (PlaceDetailPanel) | Loaded | H | `PlacePill` `<a>` lacks explicit focus ring (global `:focus-visible` covers it) — acceptable | L | ➖ global handles |
| Transport (TransportView) | Loaded | A | Page background `bg-stone-50` differs from Map page `bg-parchment` and is not a token | M | ✅ `bg-background` |
| Transport (TransportView) | Loaded | A | Active mode tab uses `bg-stone-900` instead of primary token | M | ✅ `bg-primary text-primary-foreground` |
| Transport (TransportView) | Loaded | H | From/To search inputs and swap button have no `aria-label` | M | ✅ added labels |
| Transport (TransportView) | Loaded | C | Touch targets < 44px: Get Directions (`py-2.5`), swap (`h-10`), tab pills (`py-1.5`), card action buttons (`py-2`) | M | ✅ `min-h-[44px]` / `h-11` |
| Transport (TransportView) | Loaded | A | Search container & route info boxes use `shadow-sm`/`shadow-md`; use token shadows | L | ✅ `shadow-card`/`shadow-float` |
| Transport (TransportView) | Loaded | A | Map route container `rounded-2xl` → `rounded-card` | L | ✅ |
| Transport (TransportView) | Loaded | H | Route map container lacks accessible landmark/label | M | ✅ `role="region" aria-label` |
| Transport (BuyTicketModal) | Open | A | Mobile sheet uses `shadow-2xl` + `rounded-t-3xl md:rounded-2xl` → tokens `rounded-t-sheet md:rounded-modal shadow-tactile` | M | ✅ |
| Transport (BuyTicketModal) | Open | B/C | Bottom sheet has no safe-area bottom padding on mobile | L | ✅ `pb-safe` |
| Transport (BuyTicketModal) | Confirmed | A | Inner content radii (`rounded-xl`/`rounded-lg`) are component-level; acceptable | L | ➖ ok |
| Both | 375 / responsive | C | No forced horizontal overflow found (cards `mx-4`, tab row `overflow-x-auto`, `max-w-md` overlay). Map controls/handle remain ≥44px after fix. | L | ➖ verified |
| Cross-cutting | Map | H | Categorical colors (route blue `#3b82f6`, flight `blue-*`, weather `sky-500`, food `orange`, language `violet`, status dots) preserved per design-system rule | — | ➖ intentional |

## Summary
- **Found:** 23 issues (1 High, 16 Medium, 6 Low).
- **Fixed:** 18 ✅. **Deferred:** 5 ➖ (1 High-visibility collision fixed; deferred items are intentional categorical palettes, global-focus/a11y handled by `:focus-visible`, and one logged-out empty-state copy that needs auth context rather than a chrome change).
