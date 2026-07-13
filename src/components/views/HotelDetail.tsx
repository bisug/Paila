import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star,
  MapPin,
  Users,
  ChevronLeft,
  Calendar,
  Loader2,
  Wifi,
  Coffee,
  Bed,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { type Hotel, nprToUsdCents } from "@/lib/hotels";
import { supabase } from "@/integrations/supabase/client";
import { checkoutHotel } from "@/lib/api/bookings.functions";
import { toast } from "sonner";

function imageSrc(image: Hotel["images"][number]) {
  return typeof image === "string" ? image : image.src;
}

function todayPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function diffDays(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

export function HotelDetail({ hotel }: { hotel: Hotel }) {
  const { t } = useTranslation();
  const router = useRouter();
  const checkout = checkoutHotel;

  const [checkIn, setCheckIn] = useState(todayPlus(1));
  const [checkOut, setCheckOut] = useState(todayPlus(3));
  const [guests, setGuests] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  const nights = diffDays(checkIn, checkOut);
  const totalNpr = nights * hotel.pricePerNight;
  const totalUsd = (nprToUsdCents(totalNpr) / 100).toFixed(2);

  async function handleBook() {
    if (nights < 1) {
      toast.error(t("hotels.errorDates", "Check-out must be after check-in"));
      return;
    }
    if (guests > hotel.maxGuests) {
      toast.error(
        t("hotels.errorGuests", { defaultValue: "Max {{n}} guests", n: hotel.maxGuests }),
      );
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      toast.info(t("hotels.signInToBook", "Sign in to complete your booking"));
      router.push("/login");
      return;
    }

    setSubmitting(true);
    try {
      const { bookingId } = await checkout({
        data: { hotelSlug: hotel.slug, checkIn, checkOut, guests, token: session.access_token },
      });
      router.push("/booking/success?id=" + bookingId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Booking failed";
      toast.error(msg);
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-10">
      {/* Gallery */}
      <div className="relative">
        <div className="aspect-[16/10] md:aspect-[16/7] overflow-hidden bg-muted">
          <img
            src={imageSrc(hotel.images[activeImg])}
            alt={hotel.name}
            className="h-full w-full object-cover"
          />
        </div>
        <Link
          href="/hotels"
          className="absolute top-4 left-4 grid h-9 w-9 place-items-center rounded-full bg-card/90 backdrop-blur shadow-card-md text-foreground hover:bg-card"
          aria-label="Back"
        >
          <ChevronLeft size={18} />
        </Link>
        {hotel.images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {hotel.images.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeImg ? "w-6 bg-card" : "w-1.5 bg-card/60"
                }`}
                aria-label={`Image ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pt-5 md:grid md:grid-cols-3 md:gap-6 md:px-6 md:max-w-5xl md:mx-auto">
        {/* Main info */}
        <div className="md:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{hotel.name}</h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin size={14} /> {hotel.location}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200">
              <Star size={12} className="fill-amber-500 stroke-amber-500" />
              {hotel.rating}
              <span className="text-amber-500 font-medium">({hotel.reviewCount})</span>
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-foreground">{hotel.description}</p>

          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <Stat
              icon={<Users size={16} />}
              label={t("hotels.guests", "Guests")}
              value={`${hotel.maxGuests}`}
            />
            <Stat icon={<Bed size={16} />} label={t("hotels.bed", "Bed")} value={hotel.bedType} />
            <Stat
              icon={<Coffee size={16} />}
              label={t("hotels.host", "Host")}
              value={hotel.hostName}
            />
          </div>

          <div className="mt-6">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide mb-3">
              {t("hotels.amenities", "Amenities")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {hotel.amenities.map((a) => (
                <span
                  key={a}
                  className="inline-flex items-center gap-1.5 rounded-full bg-card border border-border px-3 py-1.5 text-xs font-medium text-foreground"
                >
                  <Wifi size={11} className="text-pine" /> {a}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-card border border-border bg-card p-4 text-xs text-muted-foreground">
            <p>
              <span className="font-bold text-foreground">
                {t("hotels.checkInTime", "Check-in")}:{" "}
              </span>
              {hotel.checkIn}
            </p>
            <p className="mt-1">
              <span className="font-bold text-foreground">
                {t("hotels.checkOutTime", "Check-out")}:{" "}
              </span>
              {hotel.checkOut}
            </p>
          </div>
        </div>

        {/* Booking card */}
        <aside className="mt-6 md:mt-0">
          <div className="md:sticky md:top-20 rounded-card border border-border bg-card shadow-card-md p-5">
            <p className="text-2xl font-bold text-foreground">
              NPR {hotel.pricePerNight.toLocaleString()}
              <span className="text-sm font-medium text-muted-foreground">
                {" "}
                / {t("hotels.night", "night")}
              </span>
            </p>

            <div className="mt-4 space-y-3">
              <div className="block">
                <label htmlFor="checkIn" className="block text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wide">
                  <Calendar size={11} className="inline mr-1" />
                  {t("hotels.checkIn", "Check in")}
                </label>
                <input
                  id="checkIn"
                  type="date"
                  value={checkIn}
                  min={todayPlus(0)}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground h-11 focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                />
              </div>
              <div className="block">
                <label htmlFor="checkOut" className="block text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wide">
                  <Calendar size={11} className="inline mr-1" />
                  {t("hotels.checkOut", "Check out")}
                </label>
                <input
                  id="checkOut"
                  type="date"
                  value={checkOut}
                  min={checkIn}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground h-11 focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                />
              </div>
              <div className="block">
                <label htmlFor="guests" className="block text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wide">
                  <Users size={11} className="inline mr-1" />
                  {t("hotels.guests", "Guests")}
                </label>
                <select
                  id="guests"
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground h-11 focus:outline-none focus:ring-2 focus:ring-terracotta/30"
                >
                  {Array.from({ length: hotel.maxGuests }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 space-y-1.5 text-sm border-t border-border pt-4">
              <div className="flex justify-between text-muted-foreground">
                <span>
                  NPR {hotel.pricePerNight.toLocaleString()} × {nights}{" "}
                  {nights === 1 ? t("hotels.nightOne", "night") : t("hotels.night", "nights")}
                </span>
                <span className="tabular-nums">NPR {totalNpr.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-foreground text-base pt-2 border-t border-border">
                <span>{t("hotels.total", "Total")}</span>
                <span className="tabular-nums">NPR {totalNpr.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">≈ ${totalUsd} USD</p>
            </div>

            <button
              onClick={handleBook}
              disabled={submitting || nights < 1}
              className="mt-5 w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting
                ? t("hotels.processing", "Processing…")
                : t("hotels.requestBooking", "Request booking")}
            </button>
            <p className="mt-3 text-[11px] text-center text-muted-foreground">
              {t(
                "hotels.pendingNotice",
                "Payment is not connected yet. Requests stay pending until the hotel confirms.",
              )}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card border border-border p-3">
      <div className="grid place-items-center text-terracotta mb-1">{icon}</div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{label}</p>
      <p className="text-xs font-bold text-foreground truncate" title={value}>
        {value}
      </p>
    </div>
  );
}
