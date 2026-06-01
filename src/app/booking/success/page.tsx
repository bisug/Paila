"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CheckCircle2, Loader2, Calendar, Users, MapPin } from "lucide-react";
import { getBooking } from "@/lib/api/bookings.functions";
import { supabase } from "@/integrations/supabase/client";

type Booking = Awaited<ReturnType<typeof getBooking>>;

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen grid place-items-center">
          <Loader2 className="animate-spin text-stone-400" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) {
        setError("Missing booking ID");
        return;
      }
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const b = await getBooking({ data: { id, token: session?.access_token } });
        if (!cancelled) setBooking(b);
      } catch (e) {
        if (!cancelled) {
          if (e instanceof Error && e.message.toLowerCase().includes("unauthorized")) {
            router.push("/login");
          } else {
            setError(e instanceof Error ? e.message : "Failed to load");
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center px-4 text-center">
        <div>
          <p className="text-stone-600">{error}</p>
          <Link
            href="/profile/bookings"
            className="mt-4 inline-block rounded-xl bg-terracotta px-4 py-2 text-sm font-bold text-white"
          >
            My bookings
          </Link>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 px-4 pt-8 pb-20">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-pine/10 text-pine">
          <CheckCircle2 size={36} />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-stone-900">Booking confirmed</h1>
        <p className="mt-2 text-sm text-stone-500">
          Your stay is locked in. We've also added a notification to your inbox.
        </p>

        <div className="mt-6 rounded-2xl bg-white border border-stone-200 shadow-sm overflow-hidden text-left">
          {booking.hotel_image && (
            <img
              src={booking.hotel_image}
              alt={booking.hotel_name}
              className="h-32 w-full object-cover"
            />
          )}
          <div className="p-4 space-y-2">
            <h2 className="font-bold text-stone-900">{booking.hotel_name}</h2>
            <p className="flex items-center gap-1 text-xs text-stone-500">
              <MapPin size={12} /> {booking.hotel_location}
            </p>
            <p className="flex items-center gap-1 text-xs text-stone-600 pt-2 border-t border-stone-100">
              <Calendar size={12} /> {booking.check_in} → {booking.check_out} · {booking.nights}{" "}
              night{booking.nights === 1 ? "" : "s"}
            </p>
            <p className="flex items-center gap-1 text-xs text-stone-600">
              <Users size={12} /> {booking.guests} guest{booking.guests === 1 ? "" : "s"}
            </p>
            <div className="flex justify-between pt-3 border-t border-stone-100">
              <span className="text-sm font-medium text-stone-600">Total paid</span>
              <span className="text-sm font-bold text-stone-900">
                NPR {booking.total_npr.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/profile/bookings"
            className="rounded-xl bg-terracotta px-4 py-3 text-sm font-bold text-white hover:bg-terracotta/90"
          >
            View all bookings
          </Link>
          <Link
            href="/hotels"
            className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-stone-700 hover:bg-stone-50"
          >
            Browse more stays
          </Link>
        </div>
      </div>
    </div>
  );
}
