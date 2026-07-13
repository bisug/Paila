"use client";

import { notFound } from "next/navigation";
import { useParams } from "next/navigation";
import Link from "next/link";
import { HotelDetail } from "@/components/views/HotelDetail";
import { getHotel } from "@/lib/hotels";

export default function HotelDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  if (!slug) return null;
  const hotel = getHotel(slug);

  if (!hotel) {
    return (
      <div className="min-h-screen grid place-items-center px-4 text-center">
        <div>
          <h1 className="text-xl font-bold text-foreground">Stay not found</h1>
          <Link
            href="/hotels"
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Browse all stays
          </Link>
        </div>
      </div>
    );
  }

  return <HotelDetail hotel={hotel} />;
}
