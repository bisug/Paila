"use server";
import { createAuthenticatedSupabaseClient } from "@/integrations/supabase/auth-middleware";
import { getHotel, nprToUsdCents } from "@/lib/hotels";

function imageSrc(image: NonNullable<ReturnType<typeof getHotel>>["images"][number]) {
  return typeof image === "string" ? image : image.src;
}

function parseDateOnly(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Invalid date");
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid date");
  return date;
}

function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function diffDays(a: string, b: string): number {
  const ms = parseDateOnly(b).getTime() - parseDateOnly(a).getTime();
  return Math.round(ms / 86_400_000);
}

export async function checkoutHotel({
  data,
}: {
  data: { hotelSlug: string; checkIn: string; checkOut: string; guests: number; token?: string };
}) {
  if (!data.token) throw new Error("Unauthorized");

  const { supabase, userId } = await createAuthenticatedSupabaseClient(data.token);

  const hotel = getHotel(data.hotelSlug);
  if (!hotel) throw new Error("Hotel not found");

  const checkIn = parseDateOnly(data.checkIn);
  const nights = diffDays(data.checkIn, data.checkOut);
  if (checkIn < todayUtc()) throw new Error("Check-in cannot be in the past");
  if (nights < 1) throw new Error("Check-out must be after check-in");
  if (nights > 30) throw new Error("Bookings are limited to 30 nights");
  if (!Number.isInteger(data.guests) || data.guests < 1) throw new Error("Invalid guest count");
  if (data.guests > hotel.maxGuests) {
    throw new Error(`This hotel hosts up to ${hotel.maxGuests} guests`);
  }

  const totalNpr = nights * hotel.pricePerNight;
  const totalUsdCents = nprToUsdCents(totalNpr);

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      user_id: userId,
      hotel_slug: hotel.slug,
      hotel_name: hotel.name,
      hotel_location: hotel.location,
      hotel_image: hotel.images[0] ? imageSrc(hotel.images[0]) : null,
      check_in: data.checkIn,
      check_out: data.checkOut,
      guests: data.guests,
      nights,
      price_per_night_npr: hotel.pricePerNight,
      total_npr: totalNpr,
      total_usd_cents: totalUsdCents,
      currency: "USD",
      status: "pending",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return { bookingId: booking.id as string };
}

export async function listMyBookings({ data }: { data?: { token?: string } } = {}) {
  if (!data?.token) throw new Error("Unauthorized");

  const { supabase, userId } = await createAuthenticatedSupabaseClient(data.token);

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      "id, hotel_slug, hotel_name, hotel_location, hotel_image, check_in, check_out, guests, nights, total_npr, total_usd_cents, currency, status, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return bookings ?? [];
}

export async function getBooking({ data }: { data: { id: string; token?: string } }) {
  if (!data.token) throw new Error("Unauthorized");

  const { supabase, userId } = await createAuthenticatedSupabaseClient(data.token);

  const { data: row, error } = await supabase
    .from("bookings")
    .select(
      "id, hotel_slug, hotel_name, hotel_location, hotel_image, check_in, check_out, guests, nights, price_per_night_npr, total_npr, total_usd_cents, currency, status, created_at",
    )
    .eq("id", data.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!row) throw new Error("Booking not found");
  return row;
}
