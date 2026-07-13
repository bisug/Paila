# UI/UX Audit — Scan · Talk · Booking (Paila)

Scope: 7 files (scan page, talk page, booking success page, ScannerView, TranslatorView, BookingModal).
Design system: `UI_UX_DESIGN_SYSTEM.md`, `src/styles.css`. Tokens (`rounded-card/sheet/modal`, `shadow-card/tactile/float`, `bg-primary`, `text-muted-foreground`, `border-border`). Categorical palettes (language codes, detected-object colors, eSewa/Khalti/bank brand greens/purples/teals, booking statuses, pine/terracotta accents) preserved.

| Page | State | Category | Issue | Severity |
|------|-------|----------|-------|----------|
| ScannerView | result sheet | A | Bottom sheet uses hard-coded `rounded-t-[28px]` instead of `rounded-sheet` token | Low |
| ScannerView | result sheet | A | Sheet grabber uses `bg-stone-200`; should use `border-border` token for shared chrome | Low |
| ScannerView | fair-price ledger | A | Categorical segment uses cool `bg-slate-400` (clashes with warm terracotta/amber); should be warm `bg-stone-400` | Medium |
| ScannerView | controls (gallery/flash/flip) | H | Icon-only floating buttons have no `aria-label` (gallery, flashlight, flip camera) | High |
| ScannerView | flashlight | H/D | Flashlight toggle has no `aria-pressed` / dynamic label reflecting on/off state | Medium |
| ScannerView | controls | A | Floating controls use `shadow-lg` (non-token) instead of `shadow-float` | Low |
| ScannerView | camera error | E/H | Error/fallback message not announced; missing `role="alert"`/`aria-live` | Medium |
| ScannerView | scan result | H | Result sheet not marked `role="dialog"`/`aria-modal`; result text not announced (`aria-live`) | Medium |
| ScannerView | AI result (empty facts) | F | "Quick Facts" header renders with empty list when `aiResult.facts` is empty/undefined | Low |
| TranslatorView | word meaning modal | A | Modal uses `rounded-3xl` + `shadow-float`; should be `rounded-modal` + `shadow-tactile` (dialog, not bottom sheet) | Low |
| TranslatorView | word meaning modal | H | Modal not marked `role="dialog"`/`aria-modal` | Medium |
| TranslatorView | translation output | H | Translated text & "Translating…" status not in an `aria-live` region | Medium |
| TranslatorView | voice bar | H | Listening status text ("Listening…") not announced (`aria-live`) | Medium |
| TranslatorView | speech unsupported | E | Unsupported-speech path uses blocking `window.alert`; should use Sonner toast | Medium |
| TranslatorView | swap / play controls | C | Swap button and play button are 40px (`h-10`); below 44px touch-target guidance | Medium |
| TranslatorView | clear button | C | Source clear (X) button `h-8 w-8` (32px) below 44px guidance | Low |
| BookingModal | method select | A | Selected payment method uses cool `border-slate-800 ring-2 ring-slate-800/10` instead of brand token (`border-primary ring-2 ring-primary/10`) | Medium |
| BookingModal | wallet login | D | Login inputs use `focus:border-stone-500` with no focus ring; inconsistent with the modal's own terracotta date-field focus | Medium |
| BookingModal | back arrows | H | Back arrow buttons render only "←" with no `aria-label` | Medium |
| Booking success | confirmation card | A | Card uses `shadow-sm` instead of `shadow-card` token; `rounded-2xl` should be `rounded-card` | Low |
| Booking success | error CTA | C | Error-state "My bookings" link uses `py-2` (~32px) below 44px touch-target guidance | Medium |
| Booking success | no-data | F | When `getBooking` returns null with no error, page spins `Loader2` forever (no empty/error UX) | Medium (deferred: data-fetch logic) |

## Resolution

| Page | Issue | Resolution |
|------|-------|-----------|
| ScannerView | `rounded-t-[28px]` | Fixed → `rounded-t-sheet` |
| ScannerView | grabber `bg-stone-200` | Fixed → `bg-border` |
| ScannerView | `bg-slate-400` ledger | Fixed → `bg-stone-400` (warm neutral, harmonizes with terracotta/amber) |
| ScannerView | control aria-labels | Fixed → added `aria-label` to gallery/flash/flip buttons |
| ScannerView | flashlight state | Fixed → added `aria-pressed` + dynamic label |
| ScannerView | `shadow-lg` controls | Fixed → `shadow-float` on all four floating buttons |
| ScannerView | camera error a11y | Fixed → added `role="alert"` |
| ScannerView | result sheet a11y | Fixed → `role="dialog" aria-modal aria-label` + `aria-live="polite"` |
| ScannerView | empty facts | Fixed → guarded Quick Facts behind `aiResult.facts?.length > 0` |
| TranslatorView | modal radius/shadow | Fixed → `rounded-modal shadow-tactile` |
| TranslatorView | modal a11y | Fixed → `role="dialog" aria-modal aria-label` |
| TranslatorView | translation aria-live | Fixed → added `aria-live="polite"` to output + status |
| TranslatorView | listening aria-live | Fixed → added `aria-live="polite"` to status text |
| TranslatorView | speech unsupported | Fixed → Sonner `toast` instead of `window.alert` |
| TranslatorView | swap/play targets | Fixed → `h-11 w-11` + grid column `44px` |
| TranslatorView | clear target | Fixed → `h-9 w-9` |
| BookingModal | selected method | Fixed → `border-primary ring-2 ring-primary/10` |
| BookingModal | login focus | Fixed → `focus:border-terracotta focus:ring-2 focus:ring-terracotta/30` |
| BookingModal | back arrows | Fixed → `aria-label="Go back"` |
| Booking success | card shadow | Fixed → `rounded-card shadow-card` |
| Booking success | error CTA target | Fixed → `py-3` (44px) |
| Booking success | no-data spin | Deferred → requires data-fetch/error-state logic change (out of UI-only scope); flagged for follow-up |

## Deferred (with reason)
- **Booking success no-data forever-spin**: resolving needs changing `getBooking` error handling / adding an empty state, which touches data-fetching logic explicitly out of scope. Flagged for a follow-up ticket.
- **Blue "simulation" info banner (`bg-blue-50`)** in BookingModal kept as deliberate semantic info color (not brand chrome) — not a `slate-*` violation.
- **eSewa/Khalti/bank brand colors** (`green-*`/`purple-*`/`teal-*`) preserved as deliberate categorical payment-provider palette.
