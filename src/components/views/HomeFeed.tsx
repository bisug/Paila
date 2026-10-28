import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  MapPin,
  Star,
  Clock,
  Search,
  BadgeCheck,
  Navigation,
  Sun,
  Wind,
  Mountain,
  Sunset,
  ShieldAlert,
  Banknote,
  FileText,
  Loader2,
  CalendarDays,
  Ticket,
  Users,
  X,
  Undo2,
  AlertTriangle,
  Construction,
  HeartPulse,
  Info,
  ChevronDown,
  QrCode,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { type Experience, type ImageSource, experiences, milestones } from "@/lib/data";
import { useVisitTracker } from "@/hooks/use-visit-tracker";
import { buildRecommendations, visitChipLabel } from "@/lib/recommendations";

import { GuidesSection } from "./GuidesSection";
import gaiJatraImg from "@/assets/events/gai-jatra.jpg";
import tiharDeusiImg from "@/assets/events/tihar-deusi.jpg";

import { calculateDistance, getUserLocation } from "@/lib/location";
import { emergencyContacts, sanitizePhoneNumber } from "@/lib/sos";
import {
  LOCAL_ALERTS,
  type AlertSeverity,
  type AlertType,
  type LocalAlert,
} from "@/lib/local-alerts";
import { useUserInterests } from "@/hooks/use-interests";
import { sortByInterests, INTEREST_LABELS } from "@/lib/interests";
import {
  loadEventPrefs,
  recordEventInteraction,
  clearEventPrefs,
  rankEvents,
  topCategories,
  hasAnySignal,
  explainRecommendation,
  dismissEvent,
  undoDismissEvent,
  isDismissed,
  type EventPrefs,
} from "@/lib/event-preferences";

// ── Location labeling policy ───────────────────────────────────────────────
// Max distance (km) a user can be from a milestone for its label to be used
// as their "current location" name. Beyond this, we fall back to "Your Location".
const NEAREST_MILESTONE_MAX_KM = 25;
// Two milestone distances within this many km are considered tied; the
// tie-breaker (alphabetical label, then original index) decides the winner.
const MILESTONE_TIE_EPSILON_KM = 0.05;

// ── Filters ────────────────────────────────────────────────────────────────

// Badge chip colour mapping
const BADGE_COLORS: Record<string, string> = {
  "Women-Led": "bg-pink-50   text-pink-700  border-pink-200",
  "Indigenous Youth": "bg-amber-50  text-amber-700 border-amber-200",
  "Village Verified": "bg-green-50  text-green-700 border-green-200",
  "Eco Certified": "bg-teal-50   text-teal-700  border-teal-200",
  "Heritage Craft": "bg-violet-50 text-violet-700 border-violet-200",
};

const ALERT_ICONS: Record<AlertType, LucideIcon> = {
  weather: Sun,
  trail: AlertTriangle,
  closure: Construction,
  health: HeartPulse,
};

const SEVERITY_STYLES: Record<AlertSeverity, { stripe: string; icon: string; label: string }> = {
  info: { stripe: "border-l-emerald-500", icon: "text-emerald-600", label: "Info" },
  warning: { stripe: "border-l-amber-500", icon: "text-amber-600", label: "Warning" },
  critical: { stripe: "border-l-terracotta", icon: "text-terracotta", label: "Critical" },
};

function AlertChip({ alert, onOpen }: { alert: LocalAlert; onOpen: (a: LocalAlert) => void }) {
  const Icon = ALERT_ICONS[alert.type] ?? Info;
  const s = SEVERITY_STYLES[alert.severity];
  return (
    <button
      type="button"
      onClick={() => onOpen(alert)}
      aria-label={`${s.label} alert in ${alert.location}: ${alert.message}`}
      className={`inline-flex items-center gap-1.5 pl-2 pr-2.5 min-h-[44px] rounded-md border border-stone-200 border-l-2 ${s.stripe} bg-stone-50 text-[11px] font-semibold text-stone-700 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40 transition-colors`}
    >
      <Icon size={12} className={`shrink-0 ${s.icon}`} aria-hidden="true" />
      <span className="truncate max-w-[60vw]">{alert.message}</span>
    </button>
  );
}

export type EventCategory =
  | "Festival"
  | "Cultural"
  | "Religious"
  | "Market"
  | "Adventure"
  | "Music"
  | "Community"
  | "Workshop"
  | "Food"
  | "Sports"
  | "Art";

export type LocalEvent = {
  id: number;
  title: string;
  date: string; // ISO
  endDate?: string;
  category: EventCategory;
  place: string;
  lat: number;
  lng: number;
  description: string;
  price: string;
  organizer: string;
  image: ImageSource;
};

function imageSrc(image: ImageSource) {
  return typeof image === "string" ? image : image.src;
}

export const LOCAL_EVENTS: LocalEvent[] = [
  {
    id: 1,
    title: "Tamang Lhosar Festival",
    date: "2027-02-06T09:00:00",
    endDate: "2027-02-06T20:00:00",
    category: "Festival",
    place: "Syabrubesi Village Square",
    lat: 28.1633,
    lng: 85.3385,
    description:
      "Witness the Tamang New Year with traditional Selo dances, Damphu drum performances, and authentic Tamang cuisine prepared by local women's cooperatives.",
    price: "Free",
    organizer: "Tamang Cultural Society",
    image:
      "https://images.unsplash.com/photo-1543158266-0066955047b4?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    title: "Langtang Yak Cheese Tasting",
    date: "2027-06-08T11:00:00",
    category: "Market",
    place: "Kyanjin Gompa Dairy",
    lat: 28.2103,
    lng: 85.565,
    description:
      "Sample Switzerland-inspired yak cheese made at 3,870m. Meet the cheesemakers, tour the dairy, and pair tastings with local apple brandy.",
    price: "NPR 800",
    organizer: "Kyanjin Cheese Factory",
    image:
      "https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    title: "Full-Moon Mani Rimdu Prayer",
    date: "2026-11-24T17:30:00",
    category: "Religious",
    place: "Kyanjin Gompa Monastery",
    lat: 28.211,
    lng: 85.5655,
    description:
      "Join Buddhist monks for the sacred full-moon ceremony with butter lamps, masked Cham dances, and protective blessings for trekkers.",
    price: "Donation",
    organizer: "Kyanjin Monastery",
    image:
      "https://images.unsplash.com/photo-1605369572399-05d8d64a0f5a?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 4,
    title: "Sunrise Hike to Tserko Ri",
    date: "2026-11-15T04:00:00",
    category: "Adventure",
    place: "Kyanjin Gompa Trailhead",
    lat: 28.212,
    lng: 85.566,
    description:
      "Guided pre-dawn ascent (4,985m) with certified local guides. Watch sunrise paint Langtang Lirung gold. Tea & breakfast included on descent.",
    price: "NPR 2,500",
    organizer: "Langtang Guides Co-op",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 5,
    title: "Saturday Farmers' Market",
    date: "2026-11-07T08:00:00",
    endDate: "2026-11-07T13:00:00",
    category: "Market",
    place: "Dhunche Bazaar",
    lat: 28.11,
    lng: 85.298,
    description:
      "Weekly hill market with seasonal apples, hand-spun pashmina, foraged mushrooms, and Tibetan singing bowls direct from artisans.",
    price: "Free entry",
    organizer: "Rasuwa District Council",
    image:
      "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 6,
    title: "Himalayan Folk Music Night",
    date: "2026-11-14T19:00:00",
    category: "Music",
    place: "Lama Hotel Common House",
    lat: 28.188,
    lng: 85.442,
    description:
      "Acoustic evening with Madal drums, sarangi strings, and call-and-response folk songs around the central hearth. Chiya tea served all night.",
    price: "NPR 500",
    organizer: "Lama Hotel Homestay",
    image:
      "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 7,
    title: "Indra Jatra — Chariot of the Living Goddess",
    date: "2027-09-15T14:00:00",
    endDate: "2027-09-15T22:00:00",
    category: "Festival",
    place: "Kathmandu Durbar Square",
    lat: 27.7045,
    lng: 85.3076,
    description:
      "Eight-day Newar festival honoring Indra. Watch the Kumari's chariot procession, Lakhe masked dancers, and the raising of the wooden Yosin pole in front of Hanuman Dhoka.",
    price: "Free",
    organizer: "Kathmandu Metropolitan City",
    image:
      "https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 8,
    title: "Bisket Jatra — New Year Chariot Pull",
    date: "2027-04-14T11:00:00",
    endDate: "2027-04-18T20:00:00",
    category: "Festival",
    place: "Bhaktapur Durbar Square",
    lat: 27.6722,
    lng: 85.428,
    description:
      "Bhaktapur's wild Nepali New Year festival: rival neighborhoods pull massive wooden chariots of Bhairava and Bhadrakali through narrow brick lanes.",
    price: "Free",
    organizer: "Bhaktapur Municipality",
    image:
      "https://images.unsplash.com/photo-1605649487213-66be0c0f7e58?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 9,
    title: "Holi / Fagu Purnima Color Festival",
    date: "2027-03-22T11:00:00",
    endDate: "2027-03-22T18:00:00",
    category: "Festival",
    place: "Thamel & Basantapur Square",
    lat: 27.7151,
    lng: 85.3107,
    description:
      "Hill Holi: streets explode with abir powder, water balloons, and dhime drums. Join the open-air dance parties around Basantapur and Thamel.",
    price: "Free",
    organizer: "Thamel Tourism Board",
    image:
      "https://images.unsplash.com/photo-1583308148460-72d4f10de52d?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 10,
    title: "Gai Jatra — Cow Procession & Satire",
    date: "2027-08-25T10:00:00",
    category: "Festival",
    place: "Patan Durbar Square",
    lat: 27.6727,
    lng: 85.3253,
    description:
      "Newar festival of remembrance: families parade cow-costumed children for relatives lost in the past year. Evening street-theatre roasts politicians.",
    price: "Free",
    organizer: "Patan Heritage Trust",
    image: gaiJatraImg,
  },
  {
    id: 11,
    title: "Tihar Deusi-Bhailo Night",
    date: "2026-11-09T18:30:00",
    category: "Community",
    place: "Patan Old Town Lanes",
    lat: 27.6766,
    lng: 85.3188,
    description:
      "Festival of Lights neighborhood walk: kids and elders sing Deusi-Bhailo door to door under oil lamps and marigold garlands. Sel roti and sweets shared everywhere.",
    price: "Free",
    organizer: "Patan Neighborhood Tol",
    image: tiharDeusiImg,
  },
  {
    id: 12,
    title: "Full-Moon Puja at Boudhanath",
    date: "2026-11-24T17:00:00",
    category: "Religious",
    place: "Boudhanath Stupa",
    lat: 27.7215,
    lng: 85.362,
    description:
      "Walk the kora with thousands of pilgrims as butter lamps ring the great stupa. Tibetan monks chant from surrounding gompas at dusk.",
    price: "Free",
    organizer: "Boudhanath Area Development Committee",
    image:
      "https://images.unsplash.com/photo-1571536802807-30451e3955d8?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 13,
    title: "Pashupatinath Evening Bagmati Aarti",
    date: "2026-11-01T18:00:00",
    category: "Religious",
    place: "Pashupatinath Temple Ghats",
    lat: 27.7106,
    lng: 85.3488,
    description:
      "Riverside fire ritual: priests swing brass lamps to chanting and bells along the Bagmati. Open to all respectful visitors.",
    price: "Free",
    organizer: "Pashupati Area Development Trust",
    image:
      "https://images.unsplash.com/photo-1582547099260-3b1c8c0a5b6c?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 14,
    title: "Intro to Thangka Painting",
    date: "2026-11-08T10:00:00",
    endDate: "2026-11-08T14:00:00",
    category: "Workshop",
    place: "Patan Thangka Atelier",
    lat: 27.6794,
    lng: 85.3175,
    description:
      "Half-day class with a third-generation thangka master. Learn the geometry, mineral pigments, and meditative brushwork behind Tibetan sacred art.",
    price: "NPR 2,200",
    organizer: "Lokta Arts Collective",
    image:
      "https://images.unsplash.com/photo-1582719188393-bb71ca45dbb9?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 15,
    title: "Momo-Making Class with a Newar Family",
    date: "2026-11-12T16:00:00",
    endDate: "2026-11-12T19:00:00",
    category: "Workshop",
    place: "Thamel Home Kitchen",
    lat: 27.7155,
    lng: 85.312,
    description:
      "Hands-on dumpling night: fold buff and veg momos, mix achar, and share dinner with the host family. Recipes to take home.",
    price: "NPR 1,500",
    organizer: "Sita's Home Kitchen",
    image:
      "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 16,
    title: "Samay Baji — Newari Feast Evening",
    date: "2026-11-20T19:00:00",
    category: "Food",
    place: "Bhaktapur Pottery Square",
    lat: 27.6701,
    lng: 85.4276,
    description:
      "Traditional 12-element Newari platter served on brass with chhwela, bara, baji, and aila. Live madal music throughout.",
    price: "NPR 1,800",
    organizer: "Newa Lajya Cooperative",
    image:
      "https://images.unsplash.com/photo-1604908554007-1f1f3c5b3f3a?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 17,
    title: "Sarangkot Paragliding Meetup",
    date: "2026-11-05T09:00:00",
    category: "Sports",
    place: "Sarangkot Launch Site",
    lat: 28.2439,
    lng: 83.9486,
    description:
      "Tandem flights over Phewa Lake with licensed pilots. Briefing, gear, and 25-minute thermals. Spectator-friendly viewpoint at the launch.",
    price: "NPR 9,500",
    organizer: "Pokhara Paragliding Pilots Assoc.",
    image:
      "https://images.unsplash.com/photo-1531386151447-fd76ad50012f?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 18,
    title: "Patan Street-Art & Courtyard Walk",
    date: "2026-11-03T15:00:00",
    endDate: "2026-11-03T17:30:00",
    category: "Art",
    place: "Patan Bahals & Backstreets",
    lat: 27.675,
    lng: 85.3239,
    description:
      "Guided walk through hidden Newar courtyards and contemporary murals. Meet two local artists in their studios. Ends with chiya on a rooftop.",
    price: "NPR 900",
    organizer: "Yala Walks",
    image:
      "https://images.unsplash.com/photo-1582719478174-71b1f6f0c8e1?auto=format&fit=crop&w=800&q=80",
  },
];

const EVENT_CATEGORY_COLOR: Record<EventCategory, string> = {
  Festival: "bg-rose-50 text-rose-700 border-rose-200",
  Cultural: "bg-violet-50 text-violet-700 border-violet-200",
  Religious: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Market: "bg-amber-50 text-amber-700 border-amber-200",
  Adventure: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Music: "bg-blue-50 text-blue-700 border-blue-200",
  Community: "bg-pink-50 text-pink-700 border-pink-200",
  Workshop: "bg-teal-50 text-teal-700 border-teal-200",
  Food: "bg-orange-50 text-orange-700 border-orange-200",
  Sports: "bg-sky-50 text-sky-700 border-sky-200",
  Art: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
};

// ── Shared primitives ───────────────────────────────────────────────────────
function Rating({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Star size={11} className="fill-amber-400 stroke-amber-400" />
      <span className="text-xs font-semibold text-stone-700">{rating.toFixed(1)}</span>
      <span className="text-xs text-stone-500">({reviews})</span>
    </span>
  );
}

function BadgeChip({ label }: { label: string }) {
  const cls = BADGE_COLORS[label] ?? "bg-stone-50 text-stone-600 border-stone-200";
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}

// ── Dashboard Widgets ───────────────────────────────────────────────────────

const ELEVATION_BY_LOCATION: Record<string, string> = {
  "Pokhara Lakeside": "822 m",
  Sarangkot: "1,592 m",
  Ghandruk: "1,940 m",
  "World Peace Pagoda": "1,113 m",
  "Begnas Lake": "650 m",
};

function WeatherWidget({ location }: { location: { name: string; lat: number; lng: number } }) {
  const [weather, setWeather] = useState<{
    temp: number;
    feelsLike: number;
    condition: string;
    sunset: string;
    uv: number;
    wind: number;
    humidity: number;
  } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    const controller = new AbortController();
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lng}` +
        `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m` +
        `&daily=sunset,uv_index_max&timezone=Asia%2FKathmandu`,
      { signal: controller.signal },
    )
      .then((res) => res.json())
      .then((data) => {
        const sunsetTime = data.daily?.sunset?.[0]?.split("T")?.[1]?.slice(0, 5) || "18:00";
        const code = data.current?.weather_code ?? 0;
        let condition = "Clear";
        if (code === 0) condition = "Clear";
        else if (code >= 1 && code <= 3) condition = "Partly Cloudy";
        else if (code >= 45 && code <= 48) condition = "Fog";
        else if (code >= 51 && code <= 67) condition = "Rain";
        else if (code >= 71 && code <= 86) condition = "Snow";
        else if (code >= 95) condition = "Thunderstorm";

        setWeather({
          temp: Math.round(data.current?.temperature_2m ?? 18),
          feelsLike: Math.round(data.current?.apparent_temperature ?? 18),
          condition,
          sunset: sunsetTime,
          uv: Math.round(data.daily?.uv_index_max?.[0] ?? 6),
          wind: Math.round(data.current?.wind_speed_10m ?? 0),
          humidity: Math.round(data.current?.relative_humidity_2m ?? 0),
        });
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(true);
      });
    return () => controller.abort();
  }, [location.lat, location.lng]);

  const cleanLocationName = location.name.replace(/\s*\(Return\)$/i, "").trim();
  const elevation =
    ELEVATION_BY_LOCATION[cleanLocationName] ?? ELEVATION_BY_LOCATION[location.name] ?? "—";
  const isWet = weather?.condition.includes("Rain") || weather?.condition.includes("Thunder");

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-card border border-stone-200/90 bg-white min-h-[140px]">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1544634076-a90160ddf44e?auto=format&fit=crop&w=800&q=80"
          alt=""
          className="h-full w-full object-cover opacity-15"
        />
        <div className="absolute inset-0 bg-linear-to-r from-stone-50/95 via-stone-50/90 to-amber-50/70" />
      </div>

      <div className="relative p-4 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-1.5 text-terracotta mb-1">
            <MapPin size={12} aria-hidden="true" />
            <span className="text-[11px] font-bold uppercase tracking-wider">{location.name}</span>
          </div>
          <div className="flex items-baseline gap-2.5">
            <h3 className="text-4xl font-extrabold text-stone-900 tracking-tight">
              {weather ? `${weather.temp}°` : error ? "—" : "..."}
            </h3>
            <span className="text-sm font-bold text-stone-700">
              {weather ? weather.condition : error ? "Unavailable" : "Loading..."}
            </span>
          </div>
          {weather && (
            <div className="text-[11px] font-medium text-stone-500 mt-0.5">
              Feels like {weather.feelsLike}° · Humidity {weather.humidity}%
            </div>
          )}
        </div>
        <div className="p-2">
          {isWet ? (
            <Wind size={40} className="text-stone-600 drop-shadow-xs" strokeWidth={1.8} />
          ) : (
            <Sun
              size={40}
              className="text-amber-500 fill-amber-400 drop-shadow-xs"
              strokeWidth={1.8}
            />
          )}
        </div>
      </div>

      <div className="relative grid grid-cols-4 divide-x divide-stone-200/70 border-t border-stone-200/70 bg-white/60 p-2 backdrop-blur-xs">
        <div className="flex flex-col items-center justify-center p-1 text-center">
          <Mountain size={13} className="text-stone-500 mb-0.5" />
          <span className="text-[10px] text-stone-500 font-bold uppercase">Elev</span>
          <span className="text-xs font-bold text-stone-900">{elevation}</span>
        </div>
        <div className="flex flex-col items-center justify-center p-1 text-center">
          <Wind size={13} className="text-stone-500 mb-0.5" />
          <span className="text-[10px] text-stone-500 font-bold uppercase">Wind</span>
          <span className="text-xs font-bold text-stone-900">
            {weather ? `${weather.wind} km/h` : "..."}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center p-1 text-center">
          <Sun size={13} className="text-stone-500 mb-0.5" />
          <span className="text-[10px] text-stone-500 font-bold uppercase">UV</span>
          <span
            className={`text-xs font-bold ${weather && weather.uv > 7 ? "text-red-600" : "text-stone-900"}`}
          >
            {weather ? `${weather.uv}${weather.uv > 7 ? " High" : ""}` : "..."}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center p-1 text-center">
          <Sunset size={13} className="text-stone-500 mb-0.5" />
          <span className="text-[10px] text-stone-500 font-bold uppercase">Sunset</span>
          <span className="text-xs font-bold text-stone-900">
            {weather ? weather.sunset : "..."}
          </span>
        </div>
      </div>
    </div>
  );
}

function EssentialsSection({ rates }: { rates: Record<string, number> | null }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const toggle = (id: string) => setOpenId((prev) => (prev === id ? null : id));

  const liveRate = rates?.["NPR"] || null;

  return (
    <div className="space-y-2.5">
      {/* Currency */}
      <div className="rounded-2xl bg-white border border-stone-200/90 shadow-card overflow-hidden transition-all">
        <button
          onClick={() => toggle("currency")}
          className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-stone-50/80 active:bg-stone-100 transition-colors"
        >
          <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
            <Banknote size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-stone-900">Currency Exchange</p>
            <p className="text-[11px] font-semibold text-stone-500">
              {liveRate ? `1 USD = ${liveRate.toFixed(2)} NPR` : "Loading live rates..."}
            </p>
          </div>
          <ChevronDown
            size={16}
            className={`text-stone-400 transition-transform duration-200 ${openId === "currency" ? "rotate-180 text-stone-700" : ""}`}
          />
        </button>
        {openId === "currency" && <CurrencyConverter rates={rates} />}
      </div>

      {/* SOS */}
      <div className="rounded-2xl bg-white border border-red-200/80 shadow-card overflow-hidden transition-all">
        <button
          onClick={() => toggle("sos")}
          className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-red-50/40 active:bg-red-50 transition-colors"
        >
          <div className="h-9 w-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
            <ShieldAlert size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-stone-900">Emergency Contacts</p>
            <p className="text-[11px] font-semibold text-red-600">Police, Tourist Aid & Medical</p>
          </div>
          <ChevronDown
            size={16}
            className={`text-stone-400 transition-transform duration-200 ${openId === "sos" ? "rotate-180 text-stone-700" : ""}`}
          />
        </button>
        {openId === "sos" && (
          <div className="px-3 pb-3 space-y-2">
            {emergencyContacts.map((item) => (
              <a
                key={item.id}
                href={`tel:${sanitizePhoneNumber(item.number)}`}
                className="flex items-center justify-between p-3 rounded-xl bg-red-50/60 border border-red-100 hover:bg-red-100/70 active:scale-[0.99] transition-all"
              >
                <div>
                  <p className="text-xs font-bold text-stone-900">{item.label}</p>
                  <p className="text-[11px] text-stone-600">{item.description}</p>
                </div>
                <span className="bg-red-600 text-white px-3 py-1 rounded-full font-bold text-xs tracking-wide shadow-xs">
                  {item.number}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Permits */}
      <div className="rounded-2xl bg-white border border-stone-200/90 shadow-card overflow-hidden transition-all">
        <button
          onClick={() => toggle("permit")}
          className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-stone-50/80 active:bg-stone-100 transition-colors"
        >
          <div className="h-9 w-9 rounded-xl bg-pine-tint text-pine flex items-center justify-center shrink-0 border border-pine/20">
            <FileText size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-stone-900">Digital Permits</p>
            <p className="text-[11px] font-semibold text-pine">TIMS & ACAP — Verified Active</p>
          </div>
          <ChevronDown
            size={16}
            className={`text-stone-400 transition-transform duration-200 ${openId === "permit" ? "rotate-180 text-stone-700" : ""}`}
          />
        </button>
        {openId === "permit" && (
          <div className="px-3 pb-3 space-y-2.5">
            {/* TIMS Card */}
            <div className="rounded-xl bg-linear-to-br from-stone-900 to-stone-800 text-white p-4 shadow-sm relative overflow-hidden border border-stone-700">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <MapPin size={70} aria-hidden="true" />
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-2.5">
                  <div>
                    <h4 className="font-bold text-sm tracking-tight">TIMS Card</h4>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-stone-300">
                      Trekkers' Information Management
                    </p>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    VALID
                  </span>
                </div>
                <div className="space-y-0.5 mb-2.5">
                  <p className="text-[10px] text-stone-400 uppercase font-semibold">Trekker</p>
                  <p className="font-semibold text-sm">Alex Traveler</p>
                </div>
                <div className="flex justify-between items-end pt-1 border-t border-stone-700/60">
                  <div>
                    <p className="text-[10px] text-stone-400 uppercase font-semibold">Permit ID</p>
                    <p className="font-mono font-bold tracking-wider text-xs text-stone-200">
                      NPT-2026-8890
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-lg border border-white/15">
                    <QrCode size={16} className="text-white" />
                    <span className="text-[10px] font-mono font-bold">QR VERIFIED</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ACAP Card */}
            <div className="rounded-xl bg-linear-to-br from-pine to-emerald-950 text-white p-4 shadow-sm relative overflow-hidden border border-emerald-800/60">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Mountain size={70} />
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-2.5">
                  <div>
                    <h4 className="font-bold text-sm tracking-tight">ACAP Entry Permit</h4>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-200">
                      Annapurna Conservation Area
                    </p>
                  </div>
                  <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    VALID
                  </span>
                </div>
                <div className="flex justify-between items-end pt-3">
                  <div>
                    <p className="text-[10px] text-emerald-200/80 uppercase font-semibold">
                      Expiry Date
                    </p>
                    <p className="font-mono font-bold tracking-wider text-xs">30 JUN 2026</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-900/60 px-2 py-1 rounded-lg border border-emerald-600/40">
                    <BadgeCheck size={16} className="text-emerald-300" />
                    <span className="text-[10px] font-bold text-emerald-100">SEALED</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CurrencyConverter({ rates }: { rates: Record<string, number> | null }) {
  const [sourceCode, setSourceCode] = useState("USD");
  const [amount, setAmount] = useState("1");
  const currentRate =
    rates && rates[sourceCode] && rates["NPR"] ? rates["NPR"] / rates[sourceCode] : null;
  const npr = currentRate ? (parseFloat(amount || "0") * currentRate).toFixed(2) : "...";

  return (
    <div className="px-3.5 pb-3.5 space-y-3">
      <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-100 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            Live Rate (Nepal Rastra Bank)
          </p>
          <p className="text-lg font-bold text-emerald-950 mt-0.5">
            1 {sourceCode} = {currentRate ? currentRate.toFixed(2) : "..."} NPR
          </p>
        </div>
      </div>
      <div className="space-y-2.5">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[11px] font-bold uppercase tracking-wide text-stone-500">
              You Pay
            </label>
            {rates && (
              <select
                value={sourceCode}
                onChange={(e) => setSourceCode(e.target.value)}
                className="bg-stone-100 border border-stone-200 text-xs font-bold text-stone-800 rounded-lg px-2 py-0.5 outline-none focus:border-terracotta"
              >
                {Object.keys(rates).map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            )}
          </div>
          <input
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full text-lg font-bold bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 outline-none focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-terracotta/20 transition-all"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wide text-stone-500 mb-1 block">
            You Receive in Nepal
          </label>
          <div className="w-full text-lg font-bold bg-stone-100/80 text-stone-900 border border-stone-200 rounded-xl px-3 py-2">
            Rs. {npr}
          </div>
        </div>
      </div>
    </div>
  );
}

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
function formatEventDate(iso: string) {
  // Use UTC-based formatting so SSR and client output match (avoids hydration mismatch from locale).
  const d = new Date(iso);
  const date = `${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCDate()}`;
  const h24 = d.getUTCHours();
  const minutes = d.getUTCMinutes().toString().padStart(2, "0");
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const time = `${h12}:${minutes} ${ampm}`;
  return { date, time, full: d };
}

function LocalEventsSection({
  currentLocation,
}: {
  currentLocation: { lat: number; lng: number };
}) {
  const [mounted, setMounted] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<EventCategory | "All">("All");
  const { interests } = useUserInterests();
  const [prefs, setPrefs] = useState<EventPrefs>({ counts: {}, lastUpdated: 0 });
  const [lastDismissed, setLastDismissed] = useState<{
    id: number;
    category: EventCategory;
    title: string;
  } | null>(null);

  // Initialize preferences after mount to keep SSR and CSR initial render identical (prevents hydration mismatch)
  useEffect(() => {
    setMounted(true);
    setPrefs(loadEventPrefs());
  }, []);

  // Re-sync prefs when tab regains focus (so cross-tab interactions reflect)
  useEffect(() => {
    if (!mounted) return;
    const sync = () => setPrefs(loadEventPrefs());
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [mounted]);

  const now = Date.now();
  const upcoming = useMemo(() => {
    if (!mounted) return [];
    const list = LOCAL_EVENTS.map((e) => ({
      ...e,
      distanceKm: calculateDistance(currentLocation, { lat: e.lat, lng: e.lng }),
      startsAt: new Date(e.date).getTime(),
    }))
      .filter(
        (e) => (e.endDate ? new Date(e.endDate).getTime() : e.startsAt + 6 * 3600 * 1000) >= now,
      )
      .filter((e) => !isDismissed(prefs, e.id));

    // Resilience: if all static events are in the past, fallback to all non-dismissed events so showcase remains active
    if (list.length === 0) {
      return LOCAL_EVENTS.map((e) => ({
        ...e,
        distanceKm: calculateDistance(currentLocation, { lat: e.lat, lng: e.lng }),
        startsAt: new Date(e.date).getTime(),
      })).filter((e) => !isDismissed(prefs, e.id));
    }

    return list;
  }, [currentLocation.lat, currentLocation.lng, now, prefs, mounted]);

  const availableCategories = useMemo(() => {
    const set = new Set<EventCategory>();
    upcoming.forEach((e) => set.add(e.category));
    return Array.from(set);
  }, [upcoming]);

  // Reorder chips: surface the user's top categories first.
  const orderedChips = useMemo(() => {
    const top = topCategories(prefs, interests, availableCategories, 3);
    const rest = availableCategories.filter((c) => !top.includes(c));
    return [...top, ...rest];
  }, [prefs, interests, availableCategories]);

  const personalized = useMemo(
    () => rankEvents(upcoming, prefs, interests, now),
    [upcoming, prefs, interests, now],
  );

  // Top-3 recommended for the strip (uses the same ranking).
  const recommended = useMemo(() => personalized.slice(0, 3), [personalized]);

  const enriched = useMemo(() => {
    if (activeCategory === "All") return personalized;
    return upcoming
      .filter((e) => e.category === activeCategory)
      .sort((a, b) => a.startsAt - b.startsAt);
  }, [activeCategory, personalized, upcoming]);

  const showRecommended =
    activeCategory === "All" && recommended.length > 0 && hasAnySignal(prefs, interests);
  const hasBehaviorSignal = Object.values(prefs.counts).some((n) => n > 0);

  const trackInteraction = (category: EventCategory, weight: number) => {
    const next = recordEventInteraction(category, weight);
    setPrefs(next);
  };

  const handleDismiss = (ev: { id: number; category: EventCategory; title: string }) => {
    const next = dismissEvent(ev.id, ev.category);
    setPrefs(next);
    setLastDismissed({ id: ev.id, category: ev.category, title: ev.title });
    setExpandedId((cur) => (cur === ev.id ? null : cur));
  };

  const handleUndoDismiss = () => {
    if (!lastDismissed) return;
    const next = undoDismissEvent(lastDismissed.id, lastDismissed.category);
    setPrefs(next);
    setLastDismissed(null);
  };

  if (!mounted || upcoming.length === 0) return null;

  return (
    <div className="mt-6 mb-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <CalendarDays size={14} className="text-terracotta" />
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
            Local Festivals & Events Near You
          </h2>
        </div>
        <span className="text-[11px] font-semibold text-stone-500">{enriched.length} upcoming</span>
      </div>
      <p className="text-[11px] text-stone-500 mb-3">
        Jatras, pujas, markets, workshops and community nights happening around you.
      </p>

      {showRecommended && (
        <div className="mb-3 rounded-2xl border border-terracotta/20 bg-terracotta/5 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-terracotta">
              ✨ Recommended for you
            </p>
            <p className="text-[11px] text-stone-500">
              {hasBehaviorSignal ? "Based on what you've tapped" : "Based on your interests"}
            </p>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
            {recommended.map((ev) => {
              const f = formatEventDate(ev.date);
              const why = explainRecommendation(
                { category: ev.category, startsAt: ev.startsAt },
                prefs,
                interests,
              );
              const openCard = () => {
                setActiveCategory("All");
                setExpandedId(ev.id);
                trackInteraction(ev.category, 1);
                requestAnimationFrame(() => {
                  const el = document.getElementById(`event-${ev.id}`);
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                });
              };
              return (
                <div
                  key={`rec-${ev.id}`}
                  className="relative shrink-0 w-[180px] text-left bg-white rounded-xl border border-stone-100 shadow-card overflow-hidden"
                >
                  <button
                    type="button"
                    aria-label={`Not interested in ${ev.title}`}
                    title="Not interested"
                    onClick={() => {
                      handleDismiss({ id: ev.id, category: ev.category, title: ev.title });
                    }}
                    className="absolute top-1 right-1 z-10 grid place-items-center w-9 h-9 rounded-full bg-white/90 text-stone-600 border border-stone-200 shadow-sm hover:bg-white hover:text-stone-900 after:absolute after:-inset-1 after:content-['']"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    onClick={openCard}
                    aria-label={`View ${ev.title}`}
                    className="block w-full text-left active:scale-[0.98] transition-transform cursor-pointer"
                  >
                    <div className="relative h-16">
                      <img src={imageSrc(ev.image)} alt="" className="w-full h-full object-cover" />
                      <span
                        className={`absolute top-1 left-1 inline-block rounded-full border px-1.5 py-0 text-[11px] font-bold ${EVENT_CATEGORY_COLOR[ev.category]}`}
                      >
                        {ev.category}
                      </span>
                    </div>
                    <div className="p-2 pb-1">
                      <p className="text-[11px] font-bold text-stone-900 leading-tight line-clamp-2">
                        {ev.title}
                      </p>
                      <p className="mt-1 text-[11px] text-stone-500">
                        {f.date} ·{" "}
                        {ev.distanceKm < 1
                          ? `${Math.round(ev.distanceKm * 1000)} m`
                          : `${ev.distanceKm.toFixed(1)} km`}
                      </p>
                      {why && (
                        <p className="mt-1 text-[11px] font-semibold text-terracotta">{why}</p>
                      )}
                    </div>
                  </button>
                  <div className="px-2 pb-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleDismiss({ id: ev.id, category: ev.category, title: ev.title });
                      }}
                      className="inline-flex min-h-11 items-center text-[11px] font-semibold text-stone-500 hover:text-terracotta hover:underline"
                    >
                      Not interested
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {lastDismissed && (
            <div
              role="status"
              className="mt-2 flex items-center justify-between rounded-lg border border-stone-200 bg-white px-2.5 py-1.5"
            >
              <p className="text-[11px] text-stone-600 truncate pr-2">
                Hidden “{lastDismissed.title}”. We’ll show fewer {lastDismissed.category} events.
              </p>
              <button
                type="button"
                onClick={handleUndoDismiss}
                className="shrink-0 inline-flex min-h-9 items-center gap-1 text-[11px] font-bold text-terracotta hover:underline"
              >
                <Undo2 size={11} strokeWidth={2.5} /> Undo
              </button>
            </div>
          )}

          <div className="mt-2 flex items-center justify-between gap-3">
            {hasBehaviorSignal ? (
              <button
                type="button"
                onClick={() => {
                  clearEventPrefs();
                  setPrefs({ counts: {}, lastUpdated: Date.now() });
                }}
                className="text-[11px] font-semibold text-stone-500 hover:text-stone-600 hover:underline"
              >
                Reset preferences
              </button>
            ) : (
              <span />
            )}
            <Link
              href="/preferences"
              className="text-[11px] font-bold text-terracotta hover:underline"
            >
              Manage hidden events →
            </Link>
          </div>
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 pb-3">
        {(["All", ...orderedChips] as const).map((cat) => {
          const active = activeCategory === cat;
          const isTopPick =
            cat !== "All" &&
            orderedChips.slice(0, 3).includes(cat) &&
            hasAnySignal(prefs, interests);
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat as EventCategory | "All")}
              className={`shrink-0 rounded-full border px-3 py-2 min-h-[44px] text-[11px] font-bold transition-colors ${
                active
                  ? "bg-stone-900 text-white border-stone-900"
                  : isTopPick
                    ? "bg-terracotta/10 text-terracotta border-terracotta/30 hover:border-terracotta/50"
                    : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {enriched.length === 0 && (
        <p className="text-xs text-stone-500 italic py-4 text-center">
          No upcoming {activeCategory.toLowerCase()} events nearby right now.
        </p>
      )}

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-3 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 md:overflow-visible snap-x">
        {enriched.map((ev) => {
          const f = formatEventDate(ev.date);
          const open = expandedId === ev.id;
          const why =
            activeCategory === "All"
              ? explainRecommendation(
                  { category: ev.category, startsAt: ev.startsAt },
                  prefs,
                  interests,
                )
              : null;
          return (
            <article
              key={ev.id}
              id={`event-${ev.id}`}
              className="snap-start min-w-[280px] md:min-w-0 w-[280px] md:w-full bg-white rounded-2xl border border-stone-100 shadow-card overflow-hidden shrink-0"
            >
              <div className="relative h-32">
                <img
                  src={imageSrc(ev.image)}
                  alt={ev.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-stone-900/70 via-transparent to-transparent" />
                <span
                  className={`absolute top-2 left-2 inline-block rounded-full border px-2 py-0.5 text-[11px] font-bold ${EVENT_CATEGORY_COLOR[ev.category]}`}
                >
                  {ev.category}
                </span>
                <div className="absolute top-2 right-2 bg-white/95 backdrop-blur rounded-lg px-2 py-1 text-center shadow-sm">
                  <p className="text-[9px] font-bold uppercase text-terracotta leading-none">
                    {f.full.toLocaleString(undefined, { month: "short" })}
                  </p>
                  <p className="text-sm font-bold text-stone-900 leading-tight">
                    {f.full.getDate()}
                  </p>
                </div>
                <div className="absolute bottom-2 right-2 bg-stone-900/70 text-white text-[11px] font-bold px-2 py-0.5 rounded-full backdrop-blur">
                  {ev.distanceKm < 1
                    ? `${Math.round(ev.distanceKm * 1000)} m`
                    : `${ev.distanceKm.toFixed(1)} km`}
                </div>
              </div>

              <div className="p-3">
                <h3 className="text-sm font-bold text-stone-900 leading-snug line-clamp-2">
                  {ev.title}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock size={10} />
                    {f.date} · {f.time}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={10} aria-hidden="true" />
                    {ev.place}
                  </span>
                </div>
                {why && <p className="mt-1 text-[11px] font-semibold text-terracotta">{why}</p>}

                {open && (
                  <div className="mt-3 space-y-2 border-t border-stone-100 pt-3">
                    <p className="text-xs text-stone-600 leading-relaxed">{ev.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5 text-stone-600">
                        <Ticket size={12} className="text-terracotta" />
                        <span className="font-semibold">{ev.price}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-stone-600 truncate">
                        <Users size={12} className="text-pine" />
                        <span className="font-semibold truncate">{ev.organizer}</span>
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${ev.lat},${ev.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackInteraction(ev.category, 3)}
                      className="mt-1 flex items-center justify-center gap-1.5 rounded-xl bg-terracotta text-white py-2 text-xs font-bold hover:bg-terracotta/90 active:scale-[0.98] transition-transform"
                    >
                      <Navigation size={12} /> Get Directions
                    </a>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const nextOpen = !open;
                    setExpandedId(nextOpen ? ev.id : null);
                    if (nextOpen) trackInteraction(ev.category, 1);
                  }}
                  className="mt-2 w-full py-2.5 min-h-[44px] text-[11px] font-bold text-terracotta hover:underline text-center"
                >
                  {open ? "Show less" : "View details"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

// ── Feed Cards ──────────────────────────────────────────────────────────────

function FeaturedCard({
  experience,
  onBook,
}: {
  experience: Experience;
  onBook: (e: Experience) => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-card border border-stone-100 md:flex md:flex-row transition-shadow hover:shadow-card-md">
      <div className="relative h-44 xs:h-48 sm:h-52 md:h-auto md:w-5/12 w-full md:min-h-[220px]">
        <img
          src={imageSrc(experience.image)}
          alt={experience.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute top-3 left-3">
          <BadgeChip label={experience.badge} />
        </div>
      </div>
      <div className="p-4 md:p-6 md:w-7/12 md:flex md:flex-col md:justify-center">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-base md:text-lg font-bold text-stone-900 leading-snug">
              {experience.title}
              {experience.verified && (
                <BadgeCheck size={14} className="inline ml-1.5 text-pine align-text-top" />
              )}
            </h2>
            <p className="mt-0.5 md:mt-1 text-sm md:text-base text-stone-500 line-clamp-1">
              {experience.subtitle}
            </p>
          </div>
        </div>
        <div className="mt-3 md:mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs md:text-sm text-stone-500">
          <span className="inline-flex items-center gap-1">
            <MapPin size={11} className="shrink-0 md:w-3 md:h-3" aria-hidden="true" />
            {experience.place}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={11} className="shrink-0 md:w-3 md:h-3" />
            {experience.duration}
          </span>
          <Rating rating={experience.rating} reviews={experience.reviews} />
        </div>
        <div className="mt-4 md:mt-6 flex items-center justify-between">
          <div className="leading-none">
            <span className="text-xl md:text-2xl font-bold text-stone-900">{experience.price}</span>
            <span className="ml-1 text-xs md:text-sm text-stone-500">NPR / person</span>
          </div>
          <button
            type="button"
            onClick={() => onBook(experience)}
            className="rounded-xl bg-terracotta px-5 py-2.5 md:px-6 md:py-3 text-sm md:text-base font-semibold text-white shadow-sm transition-all hover:bg-terracotta/90 active:scale-[0.97]"
          >
            Book now
          </button>
        </div>
      </div>
    </article>
  );
}

function ExperienceCard({
  experience,
  onBook,
  visitCount,
}: {
  experience: Experience;
  onBook: (e: Experience) => void;
  visitCount?: number;
}) {
  const visited = (visitCount ?? 0) > 0;
  return (
    <button
      type="button"
      onClick={() => onBook(experience)}
      className="overflow-hidden rounded-2xl bg-white shadow-card border border-stone-100 text-left w-full transition-all hover:-translate-y-0.5 hover:shadow-card-md active:scale-[0.97]"
    >
      <div className="relative aspect-4/3 w-full">
        <img
          src={imageSrc(experience.image)}
          alt={experience.title}
          className="h-full w-full object-cover"
        />
        {visitCount !== undefined && (
          <span
            className={`absolute top-2 left-2 rounded-full border px-2 py-0.5 text-[11px] font-bold ${
              visited
                ? "bg-pine/95 text-white border-pine"
                : "bg-white/95 text-stone-700 border-stone-200"
            }`}
          >
            {visitChipLabel(visitCount)}
          </span>
        )}
      </div>
      <div className="p-3.5">
        <div className="flex items-start gap-1">
          <p className="flex-1 text-[13px] font-semibold text-stone-900 leading-snug line-clamp-2">
            {experience.title}
          </p>
          {experience.verified && <BadgeCheck size={13} className="shrink-0 mt-0.5 text-pine" />}
        </div>
        <p className="mt-1 flex items-center gap-1 text-[11px] text-stone-500">
          <MapPin size={10} aria-hidden="true" />
          {experience.place.split(",")[0]}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <Rating rating={experience.rating} reviews={experience.reviews} />
          <span className="text-[12px] font-bold text-terracotta">
            {experience.price} <span className="font-normal text-stone-500">NPR</span>
          </span>
        </div>
      </div>
    </button>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-8">
      <span className="text-4xl mb-4" role="img" aria-label="Search">
        🔍
      </span>
      <p className="text-base font-semibold text-stone-700">No experiences found</p>
      {query ? (
        <p className="mt-1 text-sm text-stone-500">
          No results for "<span className="font-medium">{query}</span>". Try a different search.
        </p>
      ) : (
        <p className="mt-1 text-sm text-stone-500">Try a different category.</p>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function HomeFeed({ onBook }: { onBook: (experience: Experience) => void }) {
  const [search, setSearch] = useState("");

  const [rates, setRates] = useState<Record<string, number> | null>(null);

  const [currentLocation, setCurrentLocation] = useState({
    name: "Pokhara Lakeside",
    lat: 28.2096,
    lng: 83.9586,
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [didAutoLocate, setDidAutoLocate] = useState(false);
  const [openAlert, setOpenAlert] = useState<LocalAlert | null>(null);

  const applyCoords = (coords: { lat: number; lng: number }) => {
    const ranked = milestones.map((m, index) => ({
      milestone: m,
      index,
      distance: calculateDistance(coords, { lat: m.lat, lng: m.lng }),
    }));
    const minDistance = ranked.reduce((min, r) => (r.distance < min ? r.distance : min), Infinity);
    const tied = ranked.filter((r) => r.distance - minDistance <= MILESTONE_TIE_EPSILON_KM);
    tied.sort((a, b) => {
      const byLabel = a.milestone.label.localeCompare(b.milestone.label, undefined, {
        sensitivity: "base",
      });
      if (byLabel !== 0) return byLabel;
      return a.index - b.index;
    });
    const closest = tied[0].milestone;
    const cleanLabel = closest.label.replace(/\s*\(Return\)$/i, "").trim();
    setCurrentLocation({
      name: minDistance < NEAREST_MILESTONE_MAX_KM ? cleanLabel : "Your Location",
      lat: coords.lat,
      lng: coords.lng,
    });
  };

  const handleUseMyLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const coords = await getUserLocation();
      applyCoords(coords);
      toast.success("Location updated");
    } catch {
      toast.error("Could not get your location. Please check browser permissions.");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Auto-detect live location on first mount (silent)
  useEffect(() => {
    if (didAutoLocate) return;
    setDidAutoLocate(true);
    getUserLocation()
      .then(applyCoords)
      .catch(() => {
        /* fall back to default */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRates() {
      // 1. Primary: open.er-api
      try {
        const res = await fetch("https://open.er-api.com/v6/latest/USD", {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.rates) {
            setRates(data.rates);
            return;
          }
        }
      } catch {
        // Continue to fallback
      }

      // 2. Fallback: FOSS Frankfurter API (ECB rates)
      try {
        const res = await fetch("https://api.frankfurter.dev/v1/latest?base=USD", {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          const r: Record<string, number> = { ...data.rates, USD: 1 };
          if (!r.NPR && r.INR) {
            r.NPR = +(r.INR * 1.6).toFixed(2);
          }
          setRates(r);
          return;
        }
      } catch {
        // Continue to offline defaults
      }

      // 3. Offline / network failure baseline
      setRates({
        USD: 1,
        NPR: 134.5,
        EUR: 0.92,
        GBP: 0.78,
        INR: 84.0,
        AUD: 1.52,
        CAD: 1.38,
        JPY: 153.0,
      });
    }

    void loadRates();
    return () => controller.abort();
  }, []);

  const { interests } = useUserInterests();
  const { visits, markVisited, getVisitCount } = useVisitTracker();
  const visitCounts = useMemo(
    () => ({
      pokhara: visits.pokhara.count,
      sarangkot: visits.sarangkot.count,
      ghandruk: visits.ghandruk.count,
    }),
    [visits],
  );
  const recommendations = useMemo(() => buildRecommendations(visitCounts), [visitCounts]);

  const filtered = experiences.filter((exp) => {
    const q = search.toLowerCase().trim();
    return (
      !q ||
      exp.title.toLowerCase().includes(q) ||
      exp.place.toLowerCase().includes(q) ||
      exp.host.toLowerCase().includes(q) ||
      exp.subtitle.toLowerCase().includes(q)
    );
  });

  const prioritized = sortByInterests(filtered, interests);
  const [featured, ...rest] = prioritized;

  return (
    <div className="min-h-screen bg-stone-50">
      <section className="border-b border-stone-100 bg-white">
        <div className="px-4 md:px-8 py-5 md:py-7">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-widest text-terracotta">
              Local travel network
            </p>
            <h1 className="mt-2 text-2xl md:text-4xl font-bold tracking-tight text-stone-950">
              Plan the next step around {currentLocation.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm md:text-base leading-6 text-stone-600">
              Find verified guides, nearby stays, local events, route help, and community-run
              experiences in one place.
            </p>
          </div>
        </div>
      </section>

      {/* ── Sticky search + filter bar ─────────────────────────────────── */}
      <div className="sticky top-14 md:top-16 z-20 bg-white/95 backdrop-blur-sm border-b border-stone-100 px-4 md:px-8 py-3 shadow-sm">
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-500"
            />
            <input
              type="search"
              placeholder="Search hotels, places near you…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-xl border border-stone-200 bg-white pl-9 pr-4 text-sm text-stone-800 placeholder-stone-500 focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/15 transition-colors"
            />
          </div>
          <button
            onClick={handleUseMyLocation}
            disabled={isLoadingLocation}
            className="h-11 w-11 shrink-0 grid place-items-center rounded-xl border border-stone-200 bg-white text-stone-500 hover:text-terracotta active:scale-95 transition-all"
            aria-label="Use My Location"
            title="Use My Location"
          >
            {isLoadingLocation ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <MapPin size={18} />
            )}
          </button>
        </div>
      </div>

      {/* ── Local Location Alerts Marquee ─────────────────────────────── */}
      <div className="bg-white border-b border-stone-100 py-2.5 px-4 md:px-8 overflow-hidden relative">
        <div className="flex items-center gap-2">
          <MapPin size={12} className="text-terracotta shrink-0" aria-hidden="true" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-stone-500 shrink-0 border-r border-stone-200 pr-2">
            Local Alerts
          </span>

          <div
            className="min-w-0 flex-1 overflow-x-auto no-scrollbar"
            role="region"
            aria-label="Local alerts"
          >
            <div className="flex items-center whitespace-nowrap gap-2 pl-2 pr-6">
              {LOCAL_ALERTS.map((alert) => (
                <AlertChip key={alert.id} alert={alert} onOpen={setOpenAlert} />
              ))}
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-linear-to-l from-white to-transparent" />
      </div>

      <Sheet open={!!openAlert} onOpenChange={(o) => !o && setOpenAlert(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          {openAlert &&
            (() => {
              const Icon = ALERT_ICONS[openAlert.type] ?? Info;
              const s = SEVERITY_STYLES[openAlert.severity];
              return (
                <>
                  <SheetHeader className="text-left">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center justify-center h-8 w-8 rounded-full bg-stone-100 ${s.icon}`}
                      >
                        <Icon size={16} aria-hidden="true" />
                      </span>
                      <div>
                        <SheetTitle className="text-base">{s.label} alert</SheetTitle>
                        <SheetDescription className="text-xs">
                          {openAlert.location}
                        </SheetDescription>
                      </div>
                    </div>
                  </SheetHeader>
                  <p className="mt-4 text-sm text-stone-700 leading-relaxed">{openAlert.message}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                      <MapPin size={11} aria-hidden="true" />
                      {openAlert.location}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-stone-50 border-l-2 ${s.stripe} ${s.icon}`}
                    >
                      {s.label}
                    </span>
                  </div>
                </>
              );
            })()}
        </SheetContent>
      </Sheet>

      {/* ── Dashboard Widgets (Only show when not searching) ──────────── */}
      {!search && (
        <div className="px-4 md:px-8 py-6 md:py-8 border-b border-stone-100 bg-stone-50">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
            <div className="min-w-0">
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-sm md:text-base font-bold text-stone-900">Today near you</h2>
                  <p className="mt-0.5 text-xs text-stone-500">
                    Weather, elevation, and quick safety context.
                  </p>
                </div>
              </div>
              <WeatherWidget location={currentLocation} />
            </div>

            <div className="min-w-0">
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-sm md:text-base font-bold text-stone-900">Essential tools</h2>
                  <p className="mt-0.5 text-xs text-stone-500">
                    Currency, permits, and emergency help.
                  </p>
                </div>
              </div>
              <EssentialsSection rates={rates} />
            </div>

            <div className="min-w-0 xl:col-span-2 empty:hidden">
              <LocalEventsSection currentLocation={currentLocation} />
            </div>
          </div>
        </div>
      )}

      {/* ── Feed content ───────────────────────────────────────────────── */}
      <div className="px-4 md:px-8 py-7 md:py-9 space-y-8">
        {!search && recommendations.length > 0 && (
          <section>
            <div className="flex items-end justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-stone-900">Picked for your next visit</h2>
                <p className="mt-0.5 text-sm text-stone-500">
                  Suggestions adapt as you mark places visited.
                </p>
              </div>
              <span className="hidden sm:inline text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                Based on where you've been
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recommendations.map((rec) => (
                <article
                  key={rec.spotId}
                  className="overflow-hidden rounded-2xl bg-white shadow-card border border-stone-100 flex transition-all hover:-translate-y-0.5 hover:shadow-card-md"
                >
                  <button
                    type="button"
                    onClick={() => onBook(rec.experience)}
                    className="flex flex-1 text-left active:scale-[0.98] transition-transform"
                  >
                    <div className="w-24 h-24 shrink-0 relative">
                      <img
                        src={imageSrc(rec.experience.image)}
                        alt={rec.experience.title}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="p-2.5 flex-1 min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-pine">
                        {rec.reason}
                      </p>
                      <p className="mt-0.5 text-[13px] font-semibold text-stone-900 leading-snug line-clamp-2">
                        {rec.experience.title}
                      </p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[11px] text-stone-500">
                          {rec.depth === "signature"
                            ? "Signature"
                            : rec.depth === "deeper"
                              ? "Deeper cut"
                              : "Insider"}
                        </span>
                        <span className="text-[11px] font-bold text-terracotta">
                          {rec.experience.price}
                          <span className="font-normal text-stone-500"> NPR</span>
                        </span>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => markVisited(rec.spotId)}
                    className="shrink-0 border-l border-stone-100 px-3 min-w-[44px] text-[11px] font-bold uppercase tracking-wider text-stone-500 hover:bg-stone-50"
                    aria-label={`Mark ${rec.spotLabel} as visited`}
                    title={`Mark ${rec.spotLabel} as visited`}
                  >
                    +1
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        <GuidesSection currentLocation={currentLocation} />

        {filtered.length === 0 ? (
          <EmptyState query={search} />
        ) : (
          <>
            <div>
              <div className="flex items-end justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-stone-900">
                    {interests.length ? "Recommended for you" : "Recommended nearby"}
                  </h2>
                  <p className="mt-0.5 text-sm text-stone-500">
                    Verified experiences from local hosts and guides.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="hidden md:inline text-xs font-semibold text-stone-500">
                    {filtered.length} matches
                  </span>
                  {interests.length > 0 && (
                    <Link
                      href="/onboarding/interests"
                      className="text-[11px] font-bold uppercase tracking-wider text-terracotta hover:underline"
                    >
                      Edit interests
                    </Link>
                  )}
                </div>
              </div>
              {interests.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {interests.slice(0, 5).map((id) => (
                    <span
                      key={id}
                      className="rounded-full bg-terracotta/10 text-terracotta px-2 py-0.5 text-[11px] font-bold"
                    >
                      {INTEREST_LABELS[id] ?? id}
                    </span>
                  ))}
                </div>
              )}
              {featured && <FeaturedCard experience={featured} onBook={onBook} />}
            </div>

            {rest.length > 0 && (
              <section>
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-stone-900">More experiences</h2>
                    <p className="mt-0.5 text-sm text-stone-500">
                      Compare nearby options by place, rating, and price.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {rest.map((exp) => (
                    <ExperienceCard
                      key={exp.id}
                      experience={exp}
                      onBook={onBook}
                      visitCount={exp.spotId ? getVisitCount(exp.spotId) : undefined}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
