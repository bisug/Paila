<div align="center">

<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d35d47" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M6 21V9a9 9 0 0 1 9 9"/></svg>

# User Flows

</div>

[← Wiki home](./README.md)

---

End-to-end traces of the workflows that matter, with the code paths they touch. Read this before changing any of these screens.

## 1. Booking a stay (the money flow)

```text
/hotels ──▶ /hotels/[slug] ──▶ BookingModal ──▶ checkoutHotel ──▶ /booking/success?id=
```

- **Gate:** `HotelDetail.handleBook` checks dates, guest cap, then session; unauthenticated → `/login` with toast.
- **Mutation:** `lib/actions/bookings.ts → checkoutHotel` re-validates everything server-side (date format, past dates, ≤30 nights, guest count) and inserts with `status: 'pending'`.
- **Confirmation:** `/booking/success` fetches by `id`; honest copy distinguishes _confirmed_ vs _requested_.
- **Cancellation:** `/profile/bookings` → "Cancel request" (confirm dialog) → `cancelBooking` — guarded on `status='pending'` + owner in the WHERE and by RLS.
- **If you touch this flow:** checkout is the one place where outside-click dismissal is prevented mid-form.

## 2. Guide verification → discovery

```text
(onboarding) account-type: "Local Guide" ──▶ /guide/verify ──▶ admin review ──▶ /guides listing
```

- Submission: form validation (name/ID/place/phone regexes, 5 MB image, JPG/PNG/WebP), upload to the private `guide-ids` storage bucket, row in `guide_verifications` with `status='pending'`.
- Statuses: `pending` (editable/resubmittable) → `approved` (fields locked) / `rejected` (resubmit).
- Admin reviews at `/admin/guides` (`requireAdmin()` server-side).
- Listing `/guides` reads `status='approved'` rows — enabled by the RLS policy in `20260919000000_…sql`; before that policy, non-admins could read only their own rows and discovery was dead.

## 3. Guide slot request (prototype)

`/guides/[guideId]` → day/slot picker → "Request slot". Mock guides only; the confirmation is explicitly labelled _prototype — nothing was sent_. If you make it real, add a table + action and delete the disclosure.

## 4. Offline / SOS

```text
SOS FAB (any screen) ──▶ SosPanel
  ├─ Emergency contacts (sanitizePhoneNumber + tel: links)
  ├─ Location capture (geolocation; "Location not shared" fallback)
  ├─ Incident → queued-offline ──▶ (connectivity) ──▶ ready-to-send
  ├─ Safety check-in timer (persisted)
  └─ AMS score (Lake Louise) with severity guidance
```

- Persistence: `localStorage` via `SOS_STORAGE_KEYS`; quota failures surface an action note.
- Offline badge in the shell reacts to `online/offline` events + a "force offline" simulation toggle (`OfflineSyncModal`).
- **Rule for this area:** never fake a "sent" state. Queued ≠ sent; the UI must keep them visually distinct.

## 5. Scan

`/scan` → camera (getUserMedia, torch, front/back) → QR via jsQR → result sheet, **or** capture/upload → `POST /api/scan` (rate-limited 10/min/IP) → AI result.

- Real recognition requires `OPENAI_API_KEY`; without it (non-demo) the route returns 501 and the client toasts.
- The demo path returns a **labelled** sample result for any image — keep that label.
- Unsupported permission states get explicit recovery instructions, not a retry button that can't work.

## 6. Translate

`/talk` → text/voice input (Web Speech API, feature-detected) → `/api/translate` → result with copy/speak. Word-meaning popover is a Radix dialog.

## 7. Map & journey

`/map` → permission banner (with per-browser recovery steps) → pins/journey views. Checkpoint taps geocode via Mapbox then persist to `checkpoints`. Journey stages read `useVisitTracker`; "Mark visited" bumps recommendation depth used by `HomeFeed`.

## Cross-cutting rules

- **Auth redirects preserve `?next=`** (middleware and client guards) so users land where they intended.
- **Every async outcome is announced** — `role="status"`/`role="alert"` or toast; optimistic updates roll back on failure.
- **Deep links must survive**: Back buttons fall back to a real route (`router.back()` only when history allows).
