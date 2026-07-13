import Link from "next/link";
import {
  Star,
  MapPin,
  Users,
  Hotel as HotelIcon,
  AlertCircle,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { hotels, type Hotel } from "@/lib/hotels";

function imageSrc(image: Hotel["images"][number]) {
  return typeof image === "string" ? image : image.src;
}

export function HotelsList() {
  const { t } = useTranslation();
  const [district, setDistrict] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [minRating, setMinRating] = useState<number>(0);

  const priceError = minPrice !== "" && maxPrice !== "" && minPrice > maxPrice;

  const districts = useMemo(
    () => ["all", ...Array.from(new Set(hotels.map((h) => h.district)))],
    [],
  );

  const filtered = hotels.filter((h) => {
    if (district !== "all" && h.district !== district) return false;
    if (minPrice !== "" && h.pricePerNight < minPrice) return false;
    if (maxPrice !== "" && h.pricePerNight > maxPrice) return false;
    if (h.rating < minRating) return false;
    return true;
  });

  function parsePriceInput(value: string): number | "" {
    if (value === "") return "";
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) return "";
    return num;
  }

  function handleMinPriceChange(value: string) {
    const parsed = parsePriceInput(value);
    setMinPrice(parsed);
    if (parsed !== "" && maxPrice !== "" && parsed > maxPrice) {
      setMaxPrice(parsed);
    }
  }

  function handleMaxPriceChange(value: string) {
    const parsed = parsePriceInput(value);
    setMaxPrice(parsed);
    if (parsed !== "" && minPrice !== "" && parsed < minPrice) {
      setMinPrice(parsed);
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 md:px-6 pt-5 pb-28 md:pb-8">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-terracotta">
            Verified stays
          </p>
          <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <HotelIcon className="text-terracotta" size={25} />
            {t("hotels.title", "Stays in Nepal")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {t("hotels.subtitle", "Community-verified homestays, lodges and boutique hotels.")}
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-muted-foreground shadow-card">
          <span className="h-2 w-2 rounded-full bg-pine" />
          {filtered.length} {t("hotels.results", "stays")}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5 rounded-card bg-card border border-border shadow-card p-3 md:p-3.5">
        <div className="mb-3 flex items-center gap-2 border-b border-border pb-2 md:hidden">
          <SlidersHorizontal size={15} className="text-terracotta" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Filters</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.1fr_0.8fr_0.8fr_0.8fr_auto] lg:items-end">
          <div className="flex min-w-0 flex-col gap-1">
            <label htmlFor="district" className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              {t("hotels.district", "District")}
            </label>
            <select
              id="district"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="h-11 rounded-xl border border-border bg-card px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-terracotta/30"
            >
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d === "all" ? t("hotels.allDistricts", "All districts") : d}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:contents">
            <div className="flex min-w-0 flex-col gap-1">
              <label htmlFor="minPrice" className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                {t("hotels.minPrice", "Min NPR")}
              </label>
              <input
                id="minPrice"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="0"
                value={minPrice}
                onChange={(e) => handleMinPriceChange(e.target.value)}
                className={`h-11 w-full rounded-xl border bg-card px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 ${
                  priceError
                    ? "border-destructive focus:ring-destructive/40"
                    : "border-border focus:ring-terracotta/30"
                }`}
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <label htmlFor="maxPrice" className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                {t("hotels.maxPrice", "Max NPR")}
              </label>
              <input
                id="maxPrice"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="6000"
                value={maxPrice}
                onChange={(e) => handleMaxPriceChange(e.target.value)}
                className={`h-11 w-full rounded-xl border bg-card px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 ${
                  priceError
                    ? "border-destructive focus:ring-destructive/40"
                    : "border-border focus:ring-terracotta/30"
                }`}
              />
            </div>
          </div>

          {priceError && (
            <div className="flex items-center gap-1 text-xs text-destructive lg:col-span-full">
              <AlertCircle size={14} />
              {t("hotels.priceError", "Min price cannot exceed max price")}
            </div>
          )}

          <div className="flex min-w-0 flex-col gap-1">
            <label htmlFor="minRating" className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              {t("hotels.minRating", "Min rating")}
            </label>
            <select
              id="minRating"
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="h-11 rounded-xl border border-border bg-card px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-terracotta/30"
            >
              <option value={0}>{t("hotels.anyRating", "Any")}</option>
              <option value={4}>4.0+</option>
              <option value={4.5}>4.5+</option>
              <option value={4.8}>4.8+</option>
            </select>
          </div>

          <span className="hidden lg:block whitespace-nowrap rounded-xl bg-muted px-3 py-2 text-xs font-bold text-muted-foreground">
            {filtered.length} {t("hotels.results", "stays")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((h) => (
          <HotelCard key={h.id} hotel={h} />
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-center py-12 text-sm text-muted-foreground">
            {t("hotels.empty", "No stays match these filters.")}
          </p>
        )}
      </div>
    </div>
  );
}

function HotelCard({ hotel }: { hotel: Hotel }) {
  const { t } = useTranslation();
  return (
    <Link
      href={`/hotels/${hotel.slug}`}
      className="group block overflow-hidden rounded-card bg-card border border-border shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-md"
    >
      <div className="relative aspect-[16/11] overflow-hidden bg-muted">
        <img
          src={imageSrc(hotel.images[0])}
          alt={hotel.name}
          loading="lazy"
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute left-2 top-2 rounded-full bg-card/95 px-2 py-0.5 text-[10px] font-bold text-foreground shadow-card">
          {hotel.district}
        </div>
        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-stone-950/80 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
          <Star size={10} className="fill-amber-400 stroke-amber-400" />
          {hotel.rating}
        </div>
      </div>
      <div className="p-3">
        <div className="min-h-[42px]">
          <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2">
            {hotel.name}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground truncate">
            <MapPin size={10} className="shrink-0" /> {hotel.location}
          </p>
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {hotel.amenities.slice(0, 2).map((amenity) => (
            <span
              key={amenity}
              className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground"
            >
              {amenity}
            </span>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
            <Users size={11} /> {hotel.maxGuests}
          </span>
          <p className="text-right text-sm font-bold text-foreground">
            NPR {hotel.pricePerNight.toLocaleString()}
            <span className="block text-[10px] font-semibold text-muted-foreground">
              / {t("hotels.night", "night")}
            </span>
          </p>
        </div>
      </div>
    </Link>
  );
}
