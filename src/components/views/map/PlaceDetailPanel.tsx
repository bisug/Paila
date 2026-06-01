import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Mountain,
  Languages as LanguagesIcon,
  Utensils,
  Compass,
  Sparkles,
  CalendarDays,
  Shield,
  MapPin,
  Star,
  Loader2,
  Cloud,
  Plus,
  Trash2,
} from "lucide-react";
import { getPlaceContext } from "@/lib/api/place-context.functions";
import { getNearbyPlaces } from "@/lib/api/nearby-places.functions";
import { addCheckpoint, removeCheckpoint } from "@/lib/api/checkpoints.functions";
import { CULTURE_TIPS } from "@/lib/data";
import { calculateDistance } from "@/lib/location";
import { LOCAL_EVENTS } from "@/components/views/HomeFeed";
import { toast } from "sonner";

export type FocusedPlace = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  placeId?: string | null;
  savedCheckpointId?: string | null;
};

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
function fmtEventDate(iso: string) {
  const d = new Date(iso);
  return `${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function SectionHeader({ icon: Icon, label }: { icon: typeof Mountain; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <Icon size={14} className="text-terracotta" />
      <h3 className="text-[11px] font-bold uppercase tracking-widest text-stone-500">{label}</h3>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-stone-100 shadow-sm p-4">{children}</div>
  );
}

function PlacePill({
  p,
  originLat,
  originLng,
}: {
  p: {
    name: string;
    address: string;
    lat: number;
    lng: number;
    rating: number | null;
    userRatingCount: number | null;
  };
  originLat: number;
  originLng: number;
}) {
  const d = calculateDistance({ lat: originLat, lng: originLng }, { lat: p.lat, lng: p.lng });
  const dest = `${p.lat},${p.lng}`;
  return (
    <a
      href={`https://www.google.com/maps/dir/?api=1&destination=${dest}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 rounded-xl bg-stone-50 border border-stone-100 p-2.5 active:scale-[0.99] transition-transform"
    >
      <div className="h-8 w-8 shrink-0 rounded-lg bg-terracotta/10 text-terracotta grid place-items-center">
        <MapPin size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-stone-900 line-clamp-1">{p.name}</p>
          <span className="text-[10px] font-bold text-terracotta bg-terracotta/10 px-2 py-0.5 rounded-full shrink-0">
            {d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`}
          </span>
        </div>
        {p.address && <p className="text-[11px] text-stone-500 line-clamp-1">{p.address}</p>}
        {p.rating != null && (
          <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-stone-600">
            <Star size={10} className="fill-amber-400 stroke-amber-400" />
            <span className="font-semibold">{p.rating.toFixed(1)}</span>
            {p.userRatingCount != null && (
              <span className="text-stone-400">({p.userRatingCount})</span>
            )}
          </p>
        )}
      </div>
    </a>
  );
}

export function PlaceDetailPanel({ place }: { place: FocusedPlace }) {
  const getPlaceContextFn = getPlaceContext;
  const getNearbyPlacesFn = getNearbyPlaces;
  const addCheckpointFn = addCheckpoint;
  const removeCheckpointFn = removeCheckpoint;
  const queryClient = useQueryClient();

  // Quantize coords to ~1km to keep cache stable on minor pans
  const keyLat = place.lat.toFixed(2);
  const keyLng = place.lng.toFixed(2);

  const ctxQuery = useQuery({
    queryKey: ["place-context", keyLat, keyLng],
    queryFn: () =>
      getPlaceContextFn({ data: { lat: place.lat, lng: place.lng, name: place.name } }),
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
  });

  const nearbyQuery = useQuery({
    queryKey: ["nearby-places", keyLat, keyLng],
    queryFn: () =>
      getNearbyPlacesFn({ data: { lat: place.lat, lng: place.lng, radiusMeters: 8000 } }),
    staleTime: 30 * 60 * 1000,
  });

  const upcomingEvents = useMemo(() => {
    const now = Date.now();
    return LOCAL_EVENTS.map((e) => ({
      ...e,
      distance: calculateDistance({ lat: place.lat, lng: place.lng }, { lat: e.lat, lng: e.lng }),
    }))
      .filter((e) => new Date(e.date).getTime() >= now && e.distance <= 60)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }, [place.lat, place.lng]);

  const ctx = ctxQuery.data?.context;

  type CheckpointRow = {
    id: string;
    place_id: string | null;
    name: string;
    address: string | null;
    lat: number;
    lng: number;
    created_at: string;
  };

  const addMut = useMutation({
    mutationFn: () =>
      addCheckpointFn({
        data: {
          placeId: place.placeId ?? null,
          name: place.name,
          address: place.address ?? null,
          lat: place.lat,
          lng: place.lng,
        },
      }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["checkpoints"] });
      const prev = queryClient.getQueryData<{ checkpoints: CheckpointRow[] }>(["checkpoints"]);
      const optimistic: CheckpointRow = {
        id: `temp-${Date.now()}`,
        place_id: place.placeId ?? null,
        name: place.name,
        address: place.address ?? null,
        lat: place.lat,
        lng: place.lng,
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<{ checkpoints: CheckpointRow[] }>(["checkpoints"], (old) => ({
        checkpoints: [optimistic, ...(old?.checkpoints ?? [])],
      }));
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["checkpoints"], ctx.prev);
      toast.error(e.message ?? "Failed to add");
    },
    onSuccess: () => toast.success("Checkpoint added"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["checkpoints"] }),
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => removeCheckpointFn({ data: { id } }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["checkpoints"] });
      const prev = queryClient.getQueryData<{ checkpoints: CheckpointRow[] }>(["checkpoints"]);
      queryClient.setQueryData<{ checkpoints: CheckpointRow[] }>(["checkpoints"], (old) => ({
        checkpoints: (old?.checkpoints ?? []).filter((c) => c.id !== id),
      }));
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["checkpoints"], ctx.prev);
      toast.error(e.message ?? "Failed to remove");
    },
    onSuccess: () => toast.success("Checkpoint removed"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["checkpoints"] }),
  });

  const isSaved = !!place.savedCheckpointId;
  const busy = addMut.isPending || removeMut.isPending;

  return (
    <div className="mt-6 mx-4 md:mx-0 space-y-4">
      {/* Header */}
      <div className="rounded-2xl bg-linear-to-br from-pine to-pine/80 text-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1">
              Exploring
            </p>
            <h2 className="text-2xl font-bold leading-tight">{place.name}</h2>
            {place.address && (
              <p className="text-sm text-white/80 mt-1 line-clamp-2">{place.address}</p>
            )}
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (isSaved && place.savedCheckpointId) removeMut.mutate(place.savedCheckpointId);
              else addMut.mutate();
            }}
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
              isSaved
                ? "bg-white/15 text-white hover:bg-white/25"
                : "bg-white text-pine hover:bg-white/90"
            } disabled:opacity-60`}
          >
            {busy ? (
              <Loader2 size={12} className="animate-spin" />
            ) : isSaved ? (
              <Trash2 size={12} />
            ) : (
              <Plus size={12} />
            )}
            {isSaved ? "Remove" : "Add checkpoint"}
          </button>
        </div>
        <div className="flex flex-wrap gap-3 mt-3 text-xs">
          <span className="inline-flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-full">
            <Mountain size={12} />
            {ctx?.elevationMeters != null
              ? `${ctx.elevationMeters} m`
              : ctxQuery.isLoading
                ? "…"
                : "—"}{" "}
            altitude
          </span>
          <span className="inline-flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-full">
            <MapPin size={12} />
            {place.lat.toFixed(3)}, {place.lng.toFixed(3)}
          </span>
        </div>
      </div>

      {/* Topography & climate */}
      <Card>
        <SectionHeader icon={Mountain} label="Topography & Climate" />
        {ctxQuery.isLoading ? (
          <div className="flex items-center gap-2 text-stone-400 text-sm">
            <Loader2 size={14} className="animate-spin" /> Loading place context…
          </div>
        ) : ctxQuery.data?.error ? (
          <p className="text-xs text-red-600">{ctxQuery.data.error}</p>
        ) : ctx ? (
          <div className="space-y-2.5 text-sm text-stone-700">
            <p>{ctx.topography}</p>
            <p className="flex items-start gap-2">
              <Cloud size={14} className="text-sky-500 mt-0.5 shrink-0" />
              <span>{ctx.climate}</span>
            </p>
          </div>
        ) : null}
      </Card>

      {/* Culture & Languages */}
      {ctx && (
        <Card>
          <SectionHeader icon={LanguagesIcon} label="Culture & Languages" />
          <p className="text-sm text-stone-700 mb-3">{ctx.culture}</p>
          {ctx.languages.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {ctx.languages.map((l) => (
                <span
                  key={l}
                  className="text-[11px] font-semibold bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded-full"
                >
                  {l}
                </span>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Food */}
      {ctx && ctx.food.length > 0 && (
        <Card>
          <SectionHeader icon={Utensils} label="Food & Cuisine" />
          <div className="flex flex-wrap gap-1.5">
            {ctx.food.map((f) => (
              <span
                key={f}
                className="text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-100 px-2.5 py-1 rounded-full"
              >
                {f}
              </span>
            ))}
          </div>
          {ctx.funFact && (
            <p className="mt-3 text-[12px] text-stone-500 italic flex items-start gap-1.5">
              <Sparkles size={12} className="text-amber-500 mt-0.5 shrink-0" />
              {ctx.funFact}
            </p>
          )}
        </Card>
      )}

      {/* Places to Explore */}
      <Card>
        <SectionHeader icon={Compass} label="Places to Explore" />
        {nearbyQuery.isLoading ? (
          <div className="flex items-center gap-2 text-stone-400 text-sm">
            <Loader2 size={14} className="animate-spin" /> Finding nearby attractions…
          </div>
        ) : (nearbyQuery.data?.explore?.length ?? 0) === 0 ? (
          <p className="text-xs text-stone-400">No notable attractions found within 8 km.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {nearbyQuery.data!.explore.slice(0, 6).map((p) => (
              <PlacePill key={p.id} p={p} originLat={place.lat} originLng={place.lng} />
            ))}
          </div>
        )}
      </Card>

      {/* Hotspots */}
      <Card>
        <SectionHeader icon={MapPin} label="Hotspots & Activities" />
        {nearbyQuery.isLoading ? (
          <div className="flex items-center gap-2 text-stone-400 text-sm">
            <Loader2 size={14} className="animate-spin" /> Loading hotspots…
          </div>
        ) : (nearbyQuery.data?.hotspots?.length ?? 0) === 0 ? (
          <p className="text-xs text-stone-400">No hotspots found nearby.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {nearbyQuery.data!.hotspots.slice(0, 6).map((p) => (
              <PlacePill key={p.id} p={p} originLat={place.lat} originLng={place.lng} />
            ))}
          </div>
        )}
      </Card>

      {/* Upcoming Events */}
      <Card>
        <SectionHeader icon={CalendarDays} label="Upcoming Events" />
        {upcomingEvents.length === 0 ? (
          <p className="text-xs text-stone-400">No upcoming events within 60 km.</p>
        ) : (
          <div className="space-y-2">
            {upcomingEvents.map((e) => (
              <div
                key={e.id}
                className="flex items-start gap-3 rounded-xl bg-stone-50 border border-stone-100 p-2.5"
              >
                <div className="shrink-0 w-12 text-center rounded-lg bg-terracotta/10 text-terracotta py-1">
                  <p className="text-[9px] font-bold uppercase">
                    {fmtEventDate(e.date).split(" ")[0]}
                  </p>
                  <p className="text-sm font-bold leading-none">
                    {fmtEventDate(e.date).split(" ")[1]}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-stone-900 line-clamp-1">{e.title}</p>
                  <p className="text-[11px] text-stone-500 line-clamp-1">
                    {e.place} ·{" "}
                    {e.distance < 1
                      ? `${Math.round(e.distance * 1000)} m`
                      : `${e.distance.toFixed(1)} km`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Cultural Etiquette */}
      <Card>
        <SectionHeader icon={Shield} label="Cultural Etiquette" />
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1 snap-x">
          {CULTURE_TIPS.map((tip) => (
            <div
              key={tip.id}
              className="snap-start relative min-w-[200px] w-[200px] h-[120px] rounded-xl overflow-hidden shrink-0 border border-stone-100"
            >
              <img src={tip.image} alt={tip.title} className="object-cover w-full h-full" />
              <div className="absolute inset-0 bg-linear-to-t from-stone-900/90 via-stone-900/40 to-transparent" />
              <div className="absolute bottom-0 left-0 p-2.5">
                <h4 className="text-xs font-bold text-white">{tip.title}</h4>
                <p className="text-[10px] text-white/80 leading-tight mt-0.5">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
