import Link from "next/link";
import { Star, MapPin, Users, Hotel as HotelIcon, AlertCircle } from "lucide-react";
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
    <div className="min-h-screen bg-stone-50 px-4 pt-5 pb-28 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-stone-900 flex items-center gap-2">
          <HotelIcon className="text-terracotta" size={26} />
          {t("hotels.title", "Stays in Nepal")}
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          {t("hotels.subtitle", "Community-verified homestays, lodges and boutique hotels.")}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-5 rounded-2xl bg-white border border-stone-100 shadow-sm p-3">
        <div className="flex flex-col md:flex-row md:items-end gap-3 md:flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
              {t("hotels.district", "District")}
            </label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-terracotta/30"
            >
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d === "all" ? t("hotels.allDistricts", "All districts") : d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                {t("hotels.minPrice", "Min NPR")}
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="0"
                value={minPrice}
                onChange={(e) => handleMinPriceChange(e.target.value)}
                className={`w-28 rounded-xl border bg-white px-3 py-2 text-sm font-medium text-stone-700 focus:outline-none focus:ring-2 ${
                  priceError
                    ? "border-red-400 focus:ring-red-300"
                    : "border-stone-200 focus:ring-terracotta/30"
                }`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                {t("hotels.maxPrice", "Max NPR")}
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="6000"
                value={maxPrice}
                onChange={(e) => handleMaxPriceChange(e.target.value)}
                className={`w-28 rounded-xl border bg-white px-3 py-2 text-sm font-medium text-stone-700 focus:outline-none focus:ring-2 ${
                  priceError
                    ? "border-red-400 focus:ring-red-300"
                    : "border-stone-200 focus:ring-terracotta/30"
                }`}
              />
            </div>
          </div>

          {priceError && (
            <div className="flex items-center gap-1 text-xs text-red-600 -mt-1 md:mt-0 md:w-full">
              <AlertCircle size={14} />
              {t("hotels.priceError", "Min price cannot exceed max price")}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
              {t("hotels.minRating", "Min rating")}
            </label>
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-terracotta/30"
            >
              <option value={0}>{t("hotels.anyRating", "Any")}</option>
              <option value={4}>4.0+</option>
              <option value={4.5}>4.5+</option>
              <option value={4.8}>4.8+</option>
            </select>
          </div>

          <span className="md:ml-auto text-xs text-stone-500">
            {filtered.length} {t("hotels.results", "stays")}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((h) => (
          <HotelCard key={h.id} hotel={h} />
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-center py-12 text-sm text-stone-500">
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
      className="group block rounded-2xl bg-white border border-stone-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="aspect-[4/3] overflow-hidden bg-stone-200">
        <img
          src={imageSrc(hotel.images[0])}
          alt={hotel.name}
          loading="lazy"
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold text-stone-900 leading-snug">{hotel.name}</h3>
          <div className="flex shrink-0 items-center gap-1 text-xs font-bold text-amber-700">
            <Star size={12} className="fill-amber-500 stroke-amber-500" />
            {hotel.rating}
          </div>
        </div>
        <p className="mt-1 flex items-center gap-1 text-xs text-stone-500">
          <MapPin size={11} /> {hotel.location}
        </p>
        <div className="mt-3 flex items-end justify-between">
          <p className="text-xs text-stone-500 flex items-center gap-1">
            <Users size={12} /> {t("hotels.upTo", "Up to")} {hotel.maxGuests}
          </p>
          <p className="text-sm font-bold text-stone-900">
            NPR {hotel.pricePerNight.toLocaleString()}
            <span className="text-xs font-medium text-stone-500">
              {" "}
              / {t("hotels.night", "night")}
            </span>
          </p>
        </div>
      </div>
    </Link>
  );
}
