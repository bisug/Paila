"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Calendar, Users, MapPin, ChevronLeft, BookOpen } from "lucide-react";
import { listMyBookings } from "@/lib/api/bookings.functions";
import { supabase } from "@/integrations/supabase/client";

type Booking = Awaited<ReturnType<typeof listMyBookings>>[number];

function statusTone(status: string) {
  switch (status) {
    case "confirmed":
      return "bg-pine/10 text-pine border-pine/20";
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "cancelled":
      return "bg-stone-100 text-stone-600 border-stone-200";
    case "failed":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-stone-100 text-stone-600 border-stone-200";
  }
}

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/login");
        return;
      }
      try {
        const list = await listMyBookings({ data: { token: session.access_token } });
        setBookings(list);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center px-4 text-center">
        <p className="text-stone-600">{error}</p>
      </div>
    );
  }
  if (!bookings) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 px-4 pt-5 pb-28 md:pb-8">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1 text-sm font-medium text-stone-500 hover:text-stone-900"
      >
        <ChevronLeft size={16} /> Profile
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-stone-900 flex items-center gap-2">
        <BookOpen className="text-terracotta" size={22} />
        My bookings
      </h1>

      {bookings.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
          <p className="text-sm text-stone-500">You haven't booked a stay yet.</p>
          <Link
            href="/hotels"
            className="mt-4 inline-block rounded-xl bg-terracotta px-4 py-2 text-sm font-bold text-white"
          >
            Browse stays
          </Link>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {bookings.map((b) => (
            <li
              key={b.id}
              className="rounded-2xl bg-white border border-stone-200 shadow-sm overflow-hidden flex"
            >
              {b.hotel_image && (
                <img
                  src={b.hotel_image}
                  alt={b.hotel_name}
                  className="h-auto w-28 shrink-0 object-cover"
                />
              )}
              <div className="flex-1 p-3">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/hotels/${b.hotel_slug}`}
                    className="font-bold text-stone-900 text-sm leading-snug hover:underline"
                  >
                    {b.hotel_name}
                  </Link>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider rounded-full border px-2 py-0.5 ${statusTone(b.status)}`}
                  >
                    {b.status}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-stone-500">
                  <MapPin size={11} /> {b.hotel_location}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-stone-600">
                  <Calendar size={11} /> {b.check_in} → {b.check_out} · {b.nights}n
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-stone-600">
                  <Users size={11} /> {b.guests} guest{b.guests === 1 ? "" : "s"}
                </p>
                <p className="mt-2 text-sm font-bold text-stone-900 tabular-nums">
                  NPR {b.total_npr.toLocaleString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
