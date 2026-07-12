import { useState, useCallback, useMemo, useEffect } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  DirectionsService,
  DirectionsRenderer,
} from "@react-google-maps/api";
import {
  Bus,
  Car,
  CarFront,
  Plane,
  Phone,
  Clock,
  ArrowRightLeft,
  Search,
  MapPin,
  Info,
  Footprints,
  AlertTriangle,
  CalendarClock,
  Ticket,
  CheckCircle2,
  X,
  Minus,
  Plus,
} from "lucide-react";
import {
  transportOptions,
  type TransportOption,
  type RoadOption,
  type FlightOption,
  type TrekOption,
  type TransportMode,
} from "@/lib/data";
import { PageHeader, SectionHeader } from "@/components/ui/page";
import { GOOGLE_MAPS_LOADER_OPTIONS } from "@/lib/google-maps-loader";

type Bookable = RoadOption | FlightOption;

const iconMap = {
  jeep: CarFront,
  bus: Bus,
  car: Car,
  plane: Plane,
  boots: Footprints,
};

const mapContainerStyle = { width: "100%", height: "100%" };
const defaultCenter = { lat: 27.7172, lng: 85.324 };

type FilterTab = "all" | "road" | "flight" | "trek";

const TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "road", label: "Road" },
  { id: "flight", label: "Flights" },
  { id: "trek", label: "Trek" },
];

function modeGroup(mode: TransportMode): FilterTab {
  if (mode === "flight") return "flight";
  if (mode === "trek") return "trek";
  return "road";
}

function formatPrice(o: TransportOption) {
  return `${o.price.toLocaleString()} ${o.priceUnit}`;
}

// ── Road card ─────────────────────────────────────────────────────────
function RoadCard({
  o,
  purchased,
  onBuy,
  onFindLocal,
}: {
  o: RoadOption;
  purchased: boolean;
  onBuy: (o: RoadOption) => void;
  onFindLocal: () => void;
}) {
  const Icon = iconMap[o.iconType] || Car;
  const isShared = o.mode === "road_shared";
  const statusMeta = {
    available: { dot: "bg-green-500", text: "text-green-700", label: "Available" },
    limited: {
      dot: "bg-amber-500",
      text: "text-amber-700",
      label: `${o.seatsLeft ?? ""} seats left`.trim(),
    },
    full: { dot: "bg-stone-400", text: "text-stone-500", label: "Full" },
    on_demand: { dot: "bg-blue-500", text: "text-blue-700", label: "On demand" },
  }[o.status];
  const isFull = o.status === "full";
  const canBuyTicket = isShared && !isFull;

  return (
    <div className="rounded-card bg-white shadow-card border border-stone-100 overflow-hidden hover:shadow-card-md transition-shadow">
      <div className="p-4 border-b border-stone-50 flex gap-4 items-start">
        <div className="h-12 w-12 rounded-xl bg-stone-50 flex items-center justify-center shrink-0 text-pine">
          <Icon size={24} strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="font-bold text-stone-900 leading-tight">
              {isShared ? (o.iconType === "bus" ? "Local Bus" : "Shared Jeep") : "Private Taxi"}
            </h3>
            <span className="text-sm font-bold text-terracotta whitespace-nowrap">
              {formatPrice(o)}
            </span>
          </div>
          <p className="text-xs font-medium text-stone-500">{o.operator}</p>
        </div>
      </div>

      <div className="px-4 py-3 bg-stone-50/50 grid grid-cols-2 gap-y-3 text-xs">
        <div>
          <p className="text-stone-400 font-medium mb-0.5">Route</p>
          <p className="font-semibold text-stone-800">
            {o.route.from} → {o.route.to}
          </p>
        </div>
        <div>
          <p className="text-stone-400 font-medium mb-0.5 flex items-center gap-1">
            <Clock size={10} /> Departure
          </p>
          <p className="font-semibold text-stone-800">
            {o.departure} <span className="text-stone-500 font-normal">({o.duration})</span>
          </p>
        </div>
      </div>

      {purchased && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg bg-green-50 border border-green-100 px-2.5 py-2">
          <CheckCircle2 size={14} className="text-green-600 shrink-0" />
          <p className="text-[11px] font-semibold text-green-800">
            Ticket confirmed — show QR at boarding
          </p>
        </div>
      )}

      <div className="p-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`h-2 w-2 rounded-full ${statusMeta.dot}`} />
          <span className={`text-[11px] font-bold uppercase tracking-wider ${statusMeta.text}`}>
            {statusMeta.label}
          </span>
        </div>
        {isFull ? (
          <button
            onClick={onFindLocal}
            className="flex items-center gap-2 bg-stone-100 text-stone-700 px-3 py-2 rounded-lg text-xs font-bold hover:bg-stone-200 transition-colors"
          >
            <Car size={14} /> Find Local Ride
          </button>
        ) : canBuyTicket ? (
          <button
            onClick={() => onBuy(o)}
            className="flex items-center gap-2 bg-terracotta text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-terracotta/90 transition-colors"
          >
            <Ticket size={14} /> {purchased ? "Buy Again" : "Buy Ticket"}
          </button>
        ) : (
          <a
            href={`tel:${o.contact}`}
            className="flex items-center gap-2 bg-terracotta text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-terracotta/90 transition-colors"
          >
            <Phone size={14} /> Request Ride
          </a>
        )}
      </div>
    </div>
  );
}

// ── Flight card ───────────────────────────────────────────────────────
function FlightCard({
  o,
  purchased,
  onBuy,
  onFindLocal,
}: {
  o: FlightOption;
  purchased: boolean;
  onBuy: (o: FlightOption) => void;
  onFindLocal: () => void;
}) {
  const statusMeta = {
    scheduled: {
      dot: "bg-green-500",
      text: "text-green-700",
      label: `Scheduled · ${o.scheduledDeparture}`,
    },
    boarding: { dot: "bg-blue-500", text: "text-blue-700", label: "Boarding" },
    delayed: {
      dot: "bg-amber-500",
      text: "text-amber-700",
      label: `Delayed · ${o.cancellationReason || ""}`.replace(/ · $/, "").trim() || "Delayed",
    },
    cancelled: {
      dot: "bg-red-500",
      text: "text-red-700",
      label: `Cancelled · ${o.cancellationReason || ""}`.replace(/ · $/, "").trim() || "Cancelled",
    },
    weather_hold: { dot: "bg-amber-500", text: "text-amber-700", label: "Weather hold" },
  }[o.status];
  const canBuy = o.status === "scheduled" || o.status === "boarding";

  return (
    <div className="rounded-card bg-white shadow-card border border-stone-100 overflow-hidden hover:shadow-card-md transition-shadow">
      <div className="p-4 border-b border-stone-50 flex gap-4 items-start">
        <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 text-blue-600">
          <Plane size={24} strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="font-bold text-stone-900 leading-tight">
              {o.airline}{" "}
              <span className="text-stone-400 font-medium text-xs">· {o.flightNumber}</span>
            </h3>
            <span className="text-sm font-bold text-terracotta whitespace-nowrap">
              {formatPrice(o)}
            </span>
          </div>
          <p className="text-xs font-medium text-stone-500">Domestic flight</p>
        </div>
      </div>

      <div className="px-4 py-3 bg-stone-50/50 grid grid-cols-3 gap-y-3 gap-x-3 text-xs">
        <div>
          <p className="text-stone-400 font-medium mb-0.5">From</p>
          <p className="font-semibold text-stone-800">{o.route.from}</p>
        </div>
        <div>
          <p className="text-stone-400 font-medium mb-0.5">To</p>
          <p className="font-semibold text-stone-800">{o.route.to}</p>
        </div>
        <div>
          <p className="text-stone-400 font-medium mb-0.5 flex items-center gap-1">
            <CalendarClock size={10} /> Dep
          </p>
          <p className="font-semibold text-stone-800">{o.scheduledDeparture}</p>
        </div>
      </div>

      {o.note && (
        <div className="mx-4 mt-3 flex gap-2 rounded-lg bg-amber-50 border border-amber-100 p-2.5">
          <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-snug text-amber-900">{o.note}</p>
        </div>
      )}

      {purchased && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg bg-green-50 border border-green-100 px-2.5 py-2">
          <CheckCircle2 size={14} className="text-green-600 shrink-0" />
          <p className="text-[11px] font-semibold text-green-800">
            E-ticket issued — check-in 60 min before departure
          </p>
        </div>
      )}

      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`h-2 w-2 rounded-full ${statusMeta.dot} shrink-0`} />
          <span
            className={`text-[11px] font-bold uppercase tracking-wider truncate ${statusMeta.text}`}
          >
            {statusMeta.label}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {o.officePhone && (
            <a
              href={`tel:${o.officePhone}`}
              title="Call airline office"
              className="flex items-center gap-1.5 bg-stone-100 text-stone-700 px-3 py-2 rounded-lg text-xs font-bold hover:bg-stone-200 transition-colors"
            >
              <Phone size={13} />
            </a>
          )}
          {canBuy ? (
            <button
              onClick={() => onBuy(o)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-colors bg-terracotta text-white hover:bg-terracotta/90"
            >
              <Ticket size={13} /> {purchased ? "Buy Again" : "Buy Ticket"}
            </button>
          ) : (
            <button
              onClick={onFindLocal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-colors bg-stone-100 text-stone-700 hover:bg-stone-200"
            >
              <Car size={13} /> Try Local Vehicles
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Trek card ─────────────────────────────────────────────────────────
function TrekCard({ o }: { o: TrekOption }) {
  const diffMeta = {
    easy: { bg: "bg-green-50", text: "text-green-700", label: "Easy" },
    moderate: { bg: "bg-amber-50", text: "text-amber-700", label: "Moderate" },
    hard: { bg: "bg-red-50", text: "text-red-700", label: "Hard" },
  }[o.difficulty];

  return (
    <div className="rounded-card bg-white shadow-card border border-stone-100 overflow-hidden hover:shadow-card-md transition-shadow">
      <div className="p-4 border-b border-stone-50 flex gap-4 items-start">
        <div className="h-12 w-12 rounded-xl bg-stone-50 flex items-center justify-center shrink-0 text-pine">
          <Footprints size={24} strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="font-bold text-stone-900 leading-tight">
              {o.route.from} → {o.route.to}
            </h3>
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${diffMeta.bg} ${diffMeta.text}`}
            >
              {diffMeta.label}
            </span>
          </div>
          <p className="text-xs font-medium text-stone-500">{o.operator}</p>
        </div>
      </div>
      <div className="px-4 py-3 bg-stone-50/50 grid grid-cols-3 gap-x-3 text-xs">
        <div>
          <p className="text-stone-400 mb-0.5">Distance</p>
          <p className="font-semibold text-stone-800">{o.distanceKm} km</p>
        </div>
        <div>
          <p className="text-stone-400 mb-0.5">Elevation</p>
          <p className="font-semibold text-stone-800">+{o.elevationGainM} m</p>
        </div>
        <div>
          <p className="text-stone-400 mb-0.5">Days</p>
          <p className="font-semibold text-stone-800">{o.estimatedDays}</p>
        </div>
      </div>
    </div>
  );
}

export function TransportView() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [tab, setTab] = useState<FilterTab>("all");
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(
    null,
  );
  const [isSearchingRoute, setIsSearchingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [buying, setBuying] = useState<Bookable | null>(null);
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [localNotice, setLocalNotice] = useState<string | null>(null);

  const findLocalAlternatives = useCallback(() => {
    setTab("road");
    setLocalNotice("Showing local road alternatives below.");
    if (typeof window !== "undefined")
      window.scrollTo({ top: window.innerHeight * 0.4, behavior: "smooth" });
  }, []);

  const { isLoaded, loadError } = useJsApiLoader(GOOGLE_MAPS_LOADER_OPTIONS);
  const mapLoadError =
    loadError || !GOOGLE_MAPS_LOADER_OPTIONS.googleMapsApiKey
      ? "Google Maps is not configured or failed to load."
      : null;

  const filtered = useMemo(() => {
    const f = from.trim().toLowerCase();
    const t = to.trim().toLowerCase();
    return transportOptions.filter((o) => {
      if (tab !== "all" && modeGroup(o.mode) !== tab) return false;
      const routeStr = `${o.route.from} ${o.route.to}`.toLowerCase();
      if (f && !routeStr.includes(f)) return false;
      if (t && !routeStr.includes(t)) return false;
      return true;
    });
  }, [from, to, tab]);

  const counts = useMemo(() => {
    const c: Record<FilterTab, number> = {
      all: transportOptions.length,
      road: 0,
      flight: 0,
      trek: 0,
    };
    transportOptions.forEach((o) => {
      c[modeGroup(o.mode)]++;
    });
    return c;
  }, []);

  const directionsCallback = useCallback(
    (res: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
      if (status === google.maps.DirectionsStatus.OK && res?.routes?.length) {
        setDirectionsResponse(res);
        setRouteError(null);
      } else {
        setDirectionsResponse(null);
        setRouteError(`Could not calculate this route (${status}).`);
      }
      setIsSearchingRoute(false);
    },
    [],
  );

  function searchRoute() {
    if (!from || !to) return;
    setDirectionsResponse(null);
    setRouteError(null);
    setIsSearchingRoute(true);
  }

  function swapLocations() {
    setFrom(to);
    setTo(from);
    setDirectionsResponse(null);
    setRouteError(null);
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-28 pt-4">
      <div className="px-4 md:px-8">
        <PageHeader
          title="Transit & Route"
          description="Road, air, and trekking options."
          icon={<Bus size={18} />}
          className="mb-6"
        />
      </div>

      <a
        href="/map?view=journey"
        className="mx-4 md:mx-8 mb-4 flex items-center justify-between gap-3 rounded-2xl border border-terracotta/30 bg-terracotta/5 px-4 py-3 hover:bg-terracotta/10 transition-colors"
      >
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-terracotta">
            Mock journey
          </p>
          <p className="text-sm font-bold text-stone-900 truncate">Tribhuvan Airport → Ghandruk</p>
          <p className="text-[11px] text-stone-500 truncate">
            See all 5 transport legs in order on the map
          </p>
        </div>
        <span className="shrink-0 text-[11px] font-bold text-terracotta">Open map →</span>
      </a>

      {/* Search */}
      <div className="mx-4 md:mx-8 bg-white rounded-2xl shadow-sm border border-stone-100 p-4 mb-4 relative">
        <div className="absolute left-7 top-9 bottom-16 w-0.5 bg-stone-100 rounded-full" />
        <div className="flex gap-3 mb-3 relative z-10">
          <div className="mt-2 text-stone-400 shrink-0">
            <div className="h-3 w-3 rounded-full border-2 border-current bg-white" />
          </div>
          <div className="flex-1">
            <input
              type="text"
              placeholder="From (e.g. Kathmandu)"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full text-sm font-semibold text-stone-900 placeholder-stone-400 outline-none pb-2 border-b border-stone-100 focus:border-terracotta transition-colors bg-transparent"
            />
          </div>
        </div>
        <div className="flex gap-3 relative z-10 mb-4">
          <div className="mt-2 text-terracotta shrink-0">
            <MapPin size={14} className="fill-current" />
          </div>
          <div className="flex-1">
            <input
              type="text"
              placeholder="To (e.g. Pokhara)"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchRoute()}
              className="w-full text-sm font-semibold text-stone-900 placeholder-stone-400 outline-none pb-2 border-b border-stone-100 focus:border-terracotta transition-colors bg-transparent"
            />
          </div>
        </div>
        <div className="flex justify-between items-center z-10 relative">
          <button
            onClick={swapLocations}
            className="h-10 w-10 bg-stone-50 rounded-full grid place-items-center text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors shadow-sm border border-stone-100"
          >
            <ArrowRightLeft size={16} className="rotate-90" />
          </button>
          <button
            onClick={searchRoute}
            disabled={!from || !to}
            className="flex items-center gap-2 bg-terracotta text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-terracotta/90 transition-colors disabled:opacity-50"
          >
            <Search size={16} /> Get Directions
          </button>
        </div>
      </div>

      {/* Map */}
      {(isSearchingRoute || directionsResponse || routeError) && (
        <div className="mx-4 md:mx-8 mb-6 rounded-2xl overflow-hidden shadow-card-md border border-stone-100 bg-stone-100 h-[300px] md:h-[400px] relative">
          {mapLoadError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-stone-50 p-6 text-center">
              <div>
                <p className="text-sm font-bold text-stone-800">Map unavailable</p>
                <p className="mt-1 text-xs text-stone-500">{mapLoadError}</p>
              </div>
            </div>
          ) : !isLoaded ? (
            <div className="absolute inset-0 flex items-center justify-center bg-stone-50">
              <p className="text-xs font-semibold text-stone-400 animate-pulse">Loading Map...</p>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={defaultCenter}
              zoom={7}
              options={{ disableDefaultUI: true, zoomControl: true }}
            >
              {isSearchingRoute && from && to && !directionsResponse && (
                <DirectionsService
                  options={{
                    destination: to,
                    origin: from,
                    travelMode: google.maps.TravelMode.DRIVING,
                  }}
                  callback={directionsCallback}
                />
              )}
              {directionsResponse && (
                <DirectionsRenderer
                  options={{
                    directions: directionsResponse,
                    polylineOptions: { strokeColor: "#3b82f6", strokeWeight: 4 },
                  }}
                />
              )}
            </GoogleMap>
          )}
          {routeError && (
            <div className="absolute bottom-4 left-4 right-4 z-10 rounded-xl border border-red-100 bg-white/95 p-3 text-xs font-semibold text-red-700 shadow-md">
              {routeError}
            </div>
          )}
          {directionsResponse && directionsResponse.routes[0] && (
            <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-md border border-stone-100 flex items-center justify-between z-10">
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase">Estimated Drive</p>
                <p className="text-sm font-bold text-stone-900">
                  {directionsResponse.routes[0].legs[0].distance?.text} •{" "}
                  {directionsResponse.routes[0].legs[0].duration?.text}
                </p>
              </div>
              <div className="text-pine">
                <CarFront size={20} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode tabs */}
      <div className="px-4 md:px-8 mb-4">
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors border ${
                tab === t.id
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
              }`}
            >
              {t.label}{" "}
              <span
                className={`ml-1 font-normal ${tab === t.id ? "text-stone-300" : "text-stone-400"}`}
              >
                {counts[t.id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 md:px-8">
        <SectionHeader
          title="Available options"
          description="Compare community transport, flights, and trail segments."
        />
        <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 px-6 border-2 border-dashed border-stone-200 rounded-2xl md:col-span-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400 mb-4">
                <CarFront size={20} />
              </div>
              <p className="text-base font-semibold text-stone-800">
                No {tab === "all" ? "options" : tab} matching this route
              </p>
              <p className="text-sm text-stone-500 mt-1">
                {tab === "flight"
                  ? "Try airport codes like KTM ↔ PKR, BHR, LUA, or JMO."
                  : "Try a different city pair, or clear the search."}
              </p>
            </div>
          ) : (
            filtered.map((o) => {
              if (o.mode === "flight")
                return (
                  <FlightCard
                    key={o.id}
                    o={o}
                    purchased={purchasedIds.has(o.id)}
                    onBuy={setBuying}
                    onFindLocal={findLocalAlternatives}
                  />
                );
              if (o.mode === "trek") return <TrekCard key={o.id} o={o} />;
              return (
                <RoadCard
                  key={o.id}
                  o={o}
                  purchased={purchasedIds.has(o.id)}
                  onBuy={setBuying}
                  onFindLocal={findLocalAlternatives}
                />
              );
            })
          )}
        </div>
      </div>

      {localNotice && tab === "road" && (
        <div className="mx-4 md:mx-8 mt-4 flex items-start gap-3 rounded-xl bg-amber-50 p-3 border border-amber-100">
          <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-amber-900 leading-snug flex-1">
            {localNotice} Private taxis and on-demand cabs are typically available on short notice.
          </p>
          <button
            onClick={() => setLocalNotice(null)}
            className="text-amber-700 hover:text-amber-900"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="mx-4 md:mx-8 mt-8 flex items-start gap-3 rounded-xl bg-blue-50 p-4 border border-blue-100">
        <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs font-medium text-blue-800 leading-snug">
          Tickets are issued instantly for available departures. If a route is full or weather-held,
          switch to local vehicles — community-verified taxis and on-demand cabs cover most
          corridors.
        </p>
      </div>

      <BuyTicketModal
        option={buying}
        onClose={() => setBuying(null)}
        onConfirm={(id: string) => {
          setPurchasedIds((prev) => new Set(prev).add(id));
          setBuying(null);
        }}
      />
    </div>
  );
}

// ── Buy ticket modal ──────────────────────────────────────────────────
function BuyTicketModal({
  option,
  onClose,
  onConfirm,
}: {
  option: Bookable | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}) {
  const [seats, setSeats] = useState(1);
  const [name, setName] = useState("");
  const [step, setStep] = useState<"form" | "confirmed">("form");
  const [pnr, setPnr] = useState("");

  useEffect(() => {
    if (option) {
      setSeats(1);
      setName("");
      setStep("form");
      setPnr("");
    }
  }, [option]);

  if (!option) return null;

  const isFlight = option.mode === "flight";
  const maxSeats =
    !isFlight && option.mode === "road_shared" && option.status === "limited"
      ? Math.max(1, option.seatsLeft ?? 4)
      : 6;
  const total = option.price * seats;
  const title = isFlight
    ? `${option.airline} · ${option.flightNumber}`
    : option.mode === "road_shared"
      ? option.iconType === "bus"
        ? "Local Bus"
        : "Shared Jeep"
      : "Private Taxi";

  function confirm() {
    const code = (isFlight ? "FL" : "RD") + Math.random().toString(36).slice(2, 7).toUpperCase();
    setPnr(code);
    setStep("confirmed");
    setTimeout(() => onConfirm(option!.id), 2200);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-stone-900/50 backdrop-blur-sm p-0 md:p-4"
      onClick={onClose}
    >
      <div
        className="w-full md:max-w-md bg-white rounded-t-3xl md:rounded-2xl shadow-2xl border border-stone-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-stone-100">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              {isFlight ? "Flight ticket" : "Ride ticket"}
            </p>
            <h3 className="text-base font-bold text-stone-900 mt-0.5">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 grid place-items-center rounded-full hover:bg-stone-100 text-stone-500"
          >
            <X size={18} />
          </button>
        </div>

        {step === "form" ? (
          <>
            <div className="p-4 space-y-4">
              <div className="rounded-xl bg-stone-50 border border-stone-100 p-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-stone-400 font-medium mb-0.5">Route</p>
                  <p className="font-semibold text-stone-800">
                    {option.route.from} → {option.route.to}
                  </p>
                </div>
                <div>
                  <p className="text-stone-400 font-medium mb-0.5">Departure</p>
                  <p className="font-semibold text-stone-800">
                    {isFlight ? option.scheduledDeparture : option.departure}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 mb-1.5 block">
                  Lead passenger
                </label>
                <input
                  type="text"
                  placeholder="Full name as on ID"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm font-medium text-stone-900 placeholder-stone-400 outline-none px-3 py-2.5 rounded-lg border border-stone-200 focus:border-terracotta transition-colors bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 mb-1.5 block">Seats</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSeats((s) => Math.max(1, s - 1))}
                    className="h-9 w-9 grid place-items-center rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-base font-bold text-stone-900 w-6 text-center">
                    {seats}
                  </span>
                  <button
                    onClick={() => setSeats((s) => Math.min(maxSeats, s + 1))}
                    disabled={seats >= maxSeats}
                    className="h-9 w-9 grid place-items-center rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 disabled:opacity-40"
                  >
                    <Plus size={14} />
                  </button>
                  <span className="text-[11px] font-medium text-stone-500 ml-1">
                    {maxSeats} max available
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-stone-900 text-white p-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Total
                  </p>
                  <p className="text-lg font-bold">
                    {total.toLocaleString()} {option.priceUnit}
                  </p>
                </div>
                <p className="text-[11px] text-stone-300">
                  {seats} × {option.price.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-stone-100 flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-stone-100 text-stone-700 hover:bg-stone-200"
              >
                Cancel
              </button>
              <button
                disabled={!name.trim()}
                onClick={confirm}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-terracotta text-white hover:opacity-90 disabled:opacity-50"
              >
                Pay & Confirm
              </button>
            </div>
          </>
        ) : (
          <div className="p-6 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 mb-3">
              <CheckCircle2 size={28} />
            </div>
            <h4 className="text-base font-bold text-stone-900">Ticket confirmed</h4>
            <p className="text-xs text-stone-500 mt-1">A copy was sent to your wallet.</p>
            <div className="mt-4 rounded-xl border border-dashed border-stone-300 p-4 text-left bg-stone-50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Booking reference
              </p>
              <p className="text-lg font-bold text-stone-900 tracking-widest mt-0.5">{pnr}</p>
              <p className="text-[11px] text-stone-600 mt-2">
                {seats} seat{seats > 1 ? "s" : ""} · {name}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
