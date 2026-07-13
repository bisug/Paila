"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  Languages,
  MapPin,
  MessageCircle,
  Phone,
  Star,
  Wallet,
  CalendarClock,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { guides as mockGuides } from "@/lib/data";
import { useGuideBookmarks } from "@/hooks/use-guide-bookmarks";

type VerifiedRow = {
  id: string;
  full_name: string;
  place: string;
};

export default function GuideProfile() {
  const params = useParams();
  const guideId = params.guideId as string;
  const router = useRouter();
  const { isBookmarked, toggleBookmark } = useGuideBookmarks();
  const saved = isBookmarked(guideId);

  const mock = mockGuides.find((g) => g.id === guideId);
  const [verified, setVerified] = useState<VerifiedRow | null>(null);
  const [loading, setLoading] = useState(!mock);

  useEffect(() => {
    if (mock) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("guide_verifications")
        .select("id,full_name,place")
        .eq("id", guideId)
        .maybeSingle();
      if (cancelled) return;
      setVerified((data ?? null) as VerifiedRow | null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [guideId, mock]);

  if (!mock && loading) {
    return <div className="p-6 text-center text-stone-400 text-sm">Loading…</div>;
  }

  if (!mock && !verified) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-stone-600 mb-2">Guide not found.</p>
        <Link href="/guides" className="text-terracotta font-semibold text-sm">
          ← Back to guides
        </Link>
      </div>
    );
  }

  const name = mock?.name ?? verified!.full_name;
  const place = mock?.place ?? verified!.place;
  const image = mock?.image;
  const initial = name?.[0]?.toUpperCase() ?? "G";

  return (
    <div className="px-4 md:px-6 py-5">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900 mb-4"
        aria-label="Back"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex items-start gap-4">
          {image ? (
            <img src={image} alt={name} className="h-20 w-20 rounded-2xl object-cover" />
          ) : (
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-terracotta to-amber-500 text-white text-2xl font-bold flex items-center justify-center">
              {initial}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-stone-900 truncate">{name}</h1>
                <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                  <MapPin size={11} aria-hidden="true" />
                  {place}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleBookmark(guideId)}
                aria-pressed={saved}
                aria-label={saved ? `Remove ${name} from saved` : `Save ${name}`}
                className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  saved
                    ? "bg-terracotta/10 text-terracotta"
                    : "bg-stone-100 text-stone-400 hover:bg-stone-200"
                }`}
              >
                {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-pine-tint text-pine border border-pine/20">
                <BadgeCheck size={10} />
                Verified
              </span>
              {mock?.rating != null && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-stone-700">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  {mock.rating}
                  <span className="text-stone-400 font-normal">({mock.reviews})</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {mock?.specialty && (
          <p className="text-sm text-stone-700 mt-4 leading-relaxed">{mock.specialty}</p>
        )}

        {mock && (
          <div
            className={`mt-4 rounded-2xl border p-3 flex items-center gap-3 ${
              mock.available ? "border-pine/20 bg-pine-tint" : "border-stone-200 bg-stone-50"
            }`}
          >
            <div
              className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                mock.available ? "bg-pine/15 text-pine" : "bg-stone-200 text-stone-500"
              }`}
            >
              <CalendarClock size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    mock.available ? "bg-pine animate-pulse" : "bg-stone-400"
                  }`}
                />
                <p
                  className={`text-sm font-bold ${mock.available ? "text-pine" : "text-stone-700"}`}
                >
                  {mock.available ? "Available now" : "Currently unavailable"}
                </p>
              </div>
              <p className="text-xs text-stone-600 mt-0.5">
                {mock.available
                  ? `Accepting bookings · Next free slot: ${mock.nextAvailable}`
                  : `Next available: ${mock.nextAvailable}`}
              </p>
            </div>
          </div>
        )}

        {mock && (
          <BookingSlotPicker
            available={mock.available}
            nextAvailable={mock.nextAvailable}
            guideName={mock.name}
          />
        )}

        {mock && (
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="rounded-2xl border border-stone-200 p-3">
              <p className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                Experience
              </p>
              <p className="text-sm font-bold text-stone-900 mt-0.5">
                {mock.experienceYears} years
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 p-3">
              <p className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                Day rate
              </p>
              <p className="text-sm font-bold text-stone-900 mt-0.5 flex items-center gap-1">
                <Wallet size={12} className="text-stone-400" />
                {mock.priceUnit} {mock.pricePerDay}
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 p-3 col-span-2">
              <p className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold flex items-center gap-1">
                <Languages size={11} />
                Languages
              </p>
              <p className="text-sm font-medium text-stone-900 mt-0.5">
                {mock.languages.join(" · ")}
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-5">
          {mock?.phone && (
            <a
              href={`tel:${mock.phone}`}
              className="flex-1 inline-flex items-center justify-center gap-1.5 h-11 rounded-xl bg-terracotta text-white text-sm font-semibold hover:bg-terracotta/90 focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2"
            >
              <Phone size={14} />
              Call
            </a>
          )}
          <button
            type="button"
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-11 rounded-xl bg-pine text-white text-sm font-semibold hover:bg-pine/90 focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2"
          >
            <MessageCircle size={14} />
            Message
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingSlotPicker({
  available,
  nextAvailable,
  guideName,
}: {
  available: boolean;
  nextAvailable: string;
  guideName: string;
}) {
  const dayLabels = available
    ? ["Today", "Tomorrow", "Day after"]
    : [nextAvailable, "+1 day", "+2 days"];

  const slots = ["8:00 AM", "11:00 AM", "2:00 PM", "5:00 PM"];

  const [dayIdx, setDayIdx] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const slotsRef = useRef<HTMLDivElement>(null);
  const errorId = "booking-slot-error";

  if (booked) {
    return (
      <div className="mt-4 rounded-2xl border border-pine/30 bg-pine-tint p-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-pine text-white flex items-center justify-center shrink-0">
          <Check size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-pine">Request sent</p>
          <p className="text-xs text-stone-600 mt-0.5">
            {guideName} will confirm your {dayLabels[dayIdx]} · {slot} slot shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-stone-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold flex items-center gap-1">
          <CalendarClock size={11} />
          Book a slot
        </p>
        {!available && (
          <span className="text-[10px] font-semibold text-stone-500">From {nextAvailable}</span>
        )}
      </div>

      <div className="flex gap-2 mb-3" role="group" aria-label="Choose a day">
        {dayLabels.map((label, i) => (
          <button
            key={i}
            type="button"
            aria-pressed={dayIdx === i}
            onClick={() => {
              setDayIdx(i);
              setSlot(null);
            }}
            className={`flex-1 text-xs font-semibold rounded-xl px-2 py-2 border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 ${
              dayIdx === i
                ? "bg-stone-900 text-white border-stone-900"
                : "bg-white text-stone-700 border-stone-200 hover:border-stone-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        ref={slotsRef}
        className="grid grid-cols-4 gap-2 mb-3"
        role="group"
        aria-label="Choose a time slot"
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
      >
        {slots.map((s) => {
          const disabled = available && dayIdx === 0 && s === "8:00 AM";
          const active = slot === s;
          return (
            <button
              key={s}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              aria-label={disabled ? `${s} unavailable` : `${s}${active ? " selected" : ""}`}
              onClick={() => {
                setSlot(s);
                setError(null);
              }}
              className={`text-xs font-semibold rounded-lg px-1 py-2 border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 ${
                disabled
                  ? "bg-stone-50 text-stone-300 border-stone-100 line-through cursor-not-allowed"
                  : active
                    ? "bg-terracotta text-white border-terracotta"
                    : error
                      ? "bg-white text-stone-700 border-red-400 ring-1 ring-red-300"
                      : "bg-white text-stone-700 border-stone-200 hover:border-terracotta/40"
              }`}
            >
              {s}
            </button>
          );
        })}
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-xs font-semibold text-red-600 mb-3">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => {
          if (!slot) {
            setError("Please pick a time slot before requesting.");
            const firstEnabled =
              slotsRef.current?.querySelector<HTMLButtonElement>("button:not([disabled])");
            firstEnabled?.focus();
            return;
          }
          setBooked(true);
          toast.success(`Slot requested: ${dayLabels[dayIdx]} · ${slot}`);
        }}
        className="w-full h-10 rounded-xl bg-terracotta text-white text-sm font-semibold hover:bg-terracotta/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2"
      >
        {slot ? `Request ${dayLabels[dayIdx]} · ${slot}` : "Request slot"}
      </button>
    </div>
  );
}
