# Paila UI/UX Audit — Discover Log

Scope: `src/app/(app)/*`, `src/components/views/*` (7 files). Conformance target:
`UI_UX_DESIGN_SYSTEM.md` + `src/styles.css` tokens (warm terracotta/pine/stone,
`rounded-card/sheet/modal`, `shadow-card/card-md/tactile/float`). Deliberate
categorical palettes (event badges, weather colors, severity, map pins, permit
mocks) preserved as authored.

Resolution legend: **Fixed** (edited), **Deferred** (reason noted), **N/A** (covered by global rule).

| Page | State | Category | Issue | Severity | Resolution |
|------|-------|----------|-------|----------|------------|
| HomeFeed | loaded | A | Resting cards (WeatherWidget, EssentialsSection currency/SOS/permit, recommendation strip, event article, GuidesSection card) use Tailwind `shadow-sm` (cool grey) instead of brand `shadow-card` (warm) | Medium | Fixed — `shadow-sm` → `shadow-card` on resting cards |
| HomeFeed | loaded | A | Alert `SheetContent` uses `rounded-t-2xl` (16px) but brand sheet radius is 24px (`rounded-t-3xl`) | Low | Fixed — `rounded-t-2xl` → `rounded-t-3xl` |
| HomeFeed | weather error | E | WeatherWidget fetch failure shows only "—"/"Unavailable" with no retry affordance or accessible error announcement | Low | Deferred — weather palette is categorical; adding retry/aria would touch data-fetch — out of scope per constraints |
| HomeFeed | loaded | H | Recommendation strip cards are `role="button"` containing nested `<button>` controls (dismiss X + "Not interested") — invalid nested interactive controls | Medium | Deferred — needs structural refactor (flatten card to a group, promote title/image to its own button, keep dismiss actions as siblings); beyond a surgical edit |
| HomeFeed | loaded | C | Recommendation "Picked for your next visit" `+1` mark-visited button is ~24px tall (< 44px touch target) | Low | Deferred — secondary control; bumping height changes card density — low impact |
| GuidesSection | loaded | C | Message & Call action buttons are `py-2` (~32px) tall, below the 44px mobile touch-target minimum | High | Fixed — `py-2` → `h-11` on both Message/Call buttons |
| GuidesSection | loaded | A | Guide card uses `shadow-sm` instead of brand `shadow-card` | Medium | Fixed — `shadow-sm` → `shadow-card` |
| Guide Profile | loaded | B | Profile card uses `rounded-3xl` (24px) while every other app card uses `rounded-card` (16px / `rounded-2xl`) | Low | Fixed — `rounded-3xl` → `rounded-2xl` |
| Guide Profile | loaded | C | Bookmark icon button is `h-9` (36px), under 44px touch target | Low | Deferred — header icon control; 36px matches sibling bookmark buttons app-wide; bumping is cosmetic |
| Guides Index | loaded | A | List item hover raise uses `shadow-sm` instead of `shadow-card-md` | Low | Fixed — `hover:shadow-sm` → `hover:shadow-card-md` |
| Guides Index | loaded | C | "All"/"Saved" segmented toggle buttons are `py-1.5` (~28px), under 44px touch target | Low | Deferred — compact segmented control pattern reused app-wide; 44px would disrupt the bar; acceptable mobile pattern |
| Guide Verify | approved state | A | Approved status banner uses `sky-*` palette while the rest of the app renders "Verified" in pine (`bg-pine-tint text-pine`) — brand inconsistency | Medium | Fixed — approved branch recolored to `pine` + `BadgeCheck` icon |
| Guide Verify | intro copy | I | Copy says "blue tick" but the app's verified indicator is a pine/terracotta check, not blue | Low | Fixed — "blue tick" → "verified tick" |
| Guide Verify | error/success | E | Error/success messages lack `role="alert"`/`aria-live`, so AT is not notified of state changes | Low | Fixed — error `<p role="alert">`, success `<p role="status">` |

## Summary
- Issues found: 14
- Fixed: 9
- Deferred: 5 (4 touch-target/pattern items reused app-wide + 1 nested-interactive structural refactor)
- Critical: 0 · High: 1 · Medium: 4 · Low: 9

## Deferred details
- **HomeFeed nested interactive (H/Medium):** The outer `role="button"` wraps two real `<button>`s. Correct fix is to drop `role="button"`/`tabIndex`/`onKeyDown` from the card, make the image+title block its own `<button>` that opens the card, and keep the dismiss X / "Not interested" as sibling buttons. Flagged for a follow-up structural pass rather than a risky in-place edit.
- **Touch targets (C/Low x3):** Guides Index segmented toggle, Guide Profile bookmark button, and HomeFeed `+1` button are all below 44px but use patterns repeated across the app; normalizing them here would create inconsistency with the rest of the codebase, so left as-is pending an app-wide touch-target pass.
- **WeatherWidget error (E/Low):** recovery/announcement would require touching the fetch/state model; out of the no-data-fetch-change constraint.
