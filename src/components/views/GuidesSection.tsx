import { BadgeCheck, MessageCircle, Phone, Star } from "lucide-react";
import Link from "next/link";
import { guides, milestones } from "@/lib/data";
import { calculateDistance } from "@/lib/location";

interface GuidesSectionProps {
  currentLocation: { lat: number; lng: number };
}

export function GuidesSection({ currentLocation }: GuidesSectionProps) {
  const milestoneById = new Map(milestones.map((m) => [m.id, m]));

  const sorted = [...guides]
    .map((g) => {
      const m = milestoneById.get(g.milestoneId);
      const distance = m
        ? calculateDistance(currentLocation, { lat: m.lat, lng: m.lng })
        : Infinity;
      return { ...g, distance };
    })
    .sort((a, b) => a.distance - b.distance);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">
          Local Guides Near You
        </h2>
        <Link href="/guide/verify" className="text-[11px] font-semibold text-pine hover:underline">
          Are you a guide? Get verified →
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0 snap-x">
        {sorted.map((g) => {
          const phoneDigits = g.phone.replace(/\D/g, "");
          const waText = encodeURIComponent(
            `Namaste ${g.name}, I found you on Paila and would like to ask about a guided tour around ${g.place}.`,
          );
          const waHref = `https://wa.me/${phoneDigits}?text=${waText}`;
          const telHref = `tel:${g.phone}`;
          const distanceLabel = Number.isFinite(g.distance)
            ? g.distance < 1
              ? `${Math.round(g.distance * 1000)} m`
              : `${g.distance.toFixed(1)} km`
            : "—";

          return (
            <article
              key={g.id}
              className="snap-start min-w-[260px] max-w-[260px] bg-white rounded-2xl p-4 shadow-sm border border-stone-100 shrink-0 flex flex-col"
            >
              <div className="flex items-start gap-3">
                <img
                  src={g.image}
                  alt={g.name}
                  loading="lazy"
                  className="w-14 h-14 rounded-full object-cover border border-stone-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <h3 className="font-bold text-stone-900 truncate">{g.name}</h3>
                    {g.verified && (
                      <BadgeCheck
                        className="w-4 h-4 text-pine shrink-0"
                        aria-label="Verified guide"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] text-stone-500 truncate">{g.place}</span>
                    <span className="text-[10px] font-bold text-terracotta bg-terracotta/10 px-1.5 py-0.5 rounded-full shrink-0">
                      {distanceLabel}
                    </span>
                  </div>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                        g.available
                          ? "bg-pine-tint text-pine border-pine/20"
                          : "bg-stone-100 text-stone-500 border-stone-200"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          g.available ? "bg-pine animate-pulse" : "bg-stone-400"
                        }`}
                      />
                      {g.available ? "Available now" : "Unavailable"}
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-xs text-stone-600 line-clamp-2">{g.specialty}</p>

              <div className="mt-2 flex flex-wrap gap-1">
                {g.languages.map((lang) => (
                  <span
                    key={lang}
                    className="text-[10px] font-semibold text-pine bg-pine/10 px-1.5 py-0.5 rounded-md"
                  >
                    {lang}
                  </span>
                ))}
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500">
                <span className="inline-flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-stone-700">{g.rating}</span>
                  <span>({g.reviews})</span>
                </span>
                <span>{g.experienceYears}+ yrs</span>
                <span className="font-semibold text-stone-700">
                  {g.priceUnit} {g.pricePerDay}/day
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Message ${g.name} on WhatsApp`}
                  className="inline-flex items-center justify-center gap-1 rounded-lg bg-pine text-white text-xs font-semibold py-2 hover:bg-pine/90 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Message
                </a>
                <a
                  href={telHref}
                  aria-label={`Call ${g.name}`}
                  className="inline-flex items-center justify-center gap-1 rounded-lg bg-terracotta text-white text-xs font-semibold py-2 hover:bg-terracotta/90 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Call
                </a>
              </div>
              <p className="mt-1.5 text-[10px] text-stone-400 text-center tracking-wide">
                {g.phone}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
