import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, Polyline } from "@react-google-maps/api";
import {
  MapPin,
  Navigation,
  Loader2,
  Search,
  X,
  Trash2,
  Plus,
  Crosshair,
  Compass,
  Route as RouteIcon,
} from "lucide-react";
import { pine, terracotta } from "@/lib/data";
import { useGeolocationTracker } from "@/hooks/use-geolocation";
import { searchPlaces } from "@/lib/api/search-places.functions";
import { listCheckpoints, addCheckpoint, removeCheckpoint } from "@/lib/api/checkpoints.functions";
import { reverseGeocode } from "@/lib/api/geocode.functions";
// removed useServerFn
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlaceDetailPanel, type FocusedPlace } from "@/components/views/map/PlaceDetailPanel";
import { LocationPermissionBanner } from "@/components/views/map/LocationPermissionBanner";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { journeyStages, journeyTitle, journeySubtitle, type JourneyStage } from "@/lib/journey";
import { useVisitTracker } from "@/hooks/use-visit-tracker";
import { JourneyStageList } from "@/components/views/JourneyStageList";
import { GOOGLE_MAPS_LOADER_OPTIONS } from "@/lib/google-maps-loader";

type PlaceResult = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  types: string[];
  rating?: number | null;
  userRatingCount?: number | null;
  priceLevel?: string | null;
};

type Checkpoint = {
  id: string;
  place_id: string | null;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  created_at: string;
};

type PendingTap = {
  lat: number;
  lng: number;
  name: string;
  address: string | null;
  placeId: string | null;
  loading: boolean;
};

type PoiMapMouseEvent = google.maps.MapMouseEvent & {
  placeId?: string;
  stop?: () => void;
};

const mapContainerStyle = { width: "100%", height: "100%" };
const DEFAULT_CENTER = { lat: 28.3949, lng: 84.124 }; // Nepal centroid
const EMPTY_CHECKPOINTS: Checkpoint[] = [];

// Bearing in degrees from point A to point B
function bearing(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function cardinal(deg: number) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

export function FootprintMap({ defaultView = "pins" }: { defaultView?: "pins" | "journey" } = {}) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const fittedRef = useRef(false);
  const journeyFittedRef = useRef(false);
  const searchRequestRef = useRef(0);
  const tapRequestRef = useRef(0);

  const [viewMode, setViewMode] = useState<"pins" | "journey">(defaultView);
  const [activeStageId, setActiveStageId] = useState<string | null>(null);
  const { hasVisited } = useVisitTracker();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [activeCheckpointId, setActiveCheckpointId] = useState<string | null>(null);
  const [tapMode, setTapMode] = useState(false);
  const [pendingTap, setPendingTap] = useState<PendingTap | null>(null);

  const searchPlacesFn = searchPlaces;
  const listCheckpointsFn = listCheckpoints;
  const addCheckpointFn = addCheckpoint;
  const removeCheckpointFn = removeCheckpoint;
  const reverseGeocodeFn = reverseGeocode;
  const queryClient = useQueryClient();

  const { isLoaded, loadError } = useJsApiLoader(GOOGLE_MAPS_LOADER_OPTIONS);
  const mapLoadError =
    loadError || !GOOGLE_MAPS_LOADER_OPTIONS.googleMapsApiKey
      ? "Google Maps is not configured or failed to load."
      : null;

  const { location, permissionDenied, retry: retryLocation } = useGeolocationTracker();
  const [permBannerDismissed, setPermBannerDismissed] = useState(false);

  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }: { data: { session: import("@supabase/supabase-js").Session | null } }) => setIsAuthed(!!data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsAuthed(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkpointsQuery = useQuery({
    queryKey: ["checkpoints"],
    queryFn: () => listCheckpointsFn(),
    enabled: isAuthed === true,
  });
  const checkpoints: Checkpoint[] = checkpointsQuery.data?.checkpoints ?? EMPTY_CHECKPOINTS;

  // Optimistic add
  const addMut = useMutation({
    mutationFn: (input: {
      placeId: string | null;
      name: string;
      address: string | null;
      lat: number;
      lng: number;
    }) => addCheckpointFn({ data: input }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["checkpoints"] });
      const prev = queryClient.getQueryData<{ checkpoints: Checkpoint[] }>(["checkpoints"]);
      const optimistic: Checkpoint = {
        id: `temp-${Date.now()}`,
        place_id: input.placeId,
        name: input.name,
        address: input.address,
        lat: input.lat,
        lng: input.lng,
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<{ checkpoints: Checkpoint[] }>(["checkpoints"], (old) => ({
        checkpoints: [optimistic, ...(old?.checkpoints ?? [])],
      }));
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["checkpoints"], ctx.prev);
      toast.error(e.message ?? "Failed to add");
    },
    onSuccess: () => {
      toast.success("Checkpoint added");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["checkpoints"] }),
  });

  // Optimistic remove
  const removeMut = useMutation({
    mutationFn: (id: string) => removeCheckpointFn({ data: { id } }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["checkpoints"] });
      const prev = queryClient.getQueryData<{ checkpoints: Checkpoint[] }>(["checkpoints"]);
      queryClient.setQueryData<{ checkpoints: Checkpoint[] }>(["checkpoints"], (old) => ({
        checkpoints: (old?.checkpoints ?? []).filter((c) => c.id !== id),
      }));
      setActiveCheckpointId(null);
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["checkpoints"], ctx.prev);
      toast.error(e.message ?? "Failed to remove");
    },
    onSuccess: () => toast.success("Checkpoint removed"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["checkpoints"] }),
  });

  // Fit bounds when checkpoints first load
  useEffect(() => {
    if (!isLoaded || !mapRef.current || fittedRef.current) return;
    if (checkpoints.length === 0) return;
    fittedRef.current = true;
    const bounds = new window.google.maps.LatLngBounds();
    checkpoints.forEach((c) => bounds.extend({ lat: c.lat, lng: c.lng }));
    if (location) bounds.extend({ lat: location.lat, lng: location.lng });
    mapRef.current.fitBounds(bounds, 80);
  }, [isLoaded, checkpoints, location]);

  // Fit bounds for the journey route when entering Journey mode
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    if (viewMode !== "journey") {
      journeyFittedRef.current = false;
      return;
    }
    if (journeyFittedRef.current) return;
    journeyFittedRef.current = true;
    const bounds = new window.google.maps.LatLngBounds();
    journeyStages.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }));
    mapRef.current.fitBounds(bounds, 60);
  }, [isLoaded, viewMode]);

  const pickStage = useCallback((stage: JourneyStage) => {
    setActiveStageId(stage.id);
    if (mapRef.current) {
      mapRef.current.panTo({ lat: stage.lat, lng: stage.lng });
      mapRef.current.setZoom(11);
    }
  }, []);

  // Split the journey polyline into "done" and "todo" segments based on visit tracker.
  const { donePath, todoPath } = useMemo(() => {
    const path = journeyStages.map((s) => ({ lat: s.lat, lng: s.lng }));
    let lastVisitedIdx = -1;
    journeyStages.forEach((s, i) => {
      if (s.spotId && hasVisited(s.spotId)) lastVisitedIdx = i;
    });
    if (lastVisitedIdx <= 0)
      return { donePath: [] as { lat: number; lng: number }[], todoPath: path };
    return {
      donePath: path.slice(0, lastVisitedIdx + 1),
      todoPath: path.slice(lastVisitedIdx),
    };
  }, [hasVisited]);

  const mapCenter = useMemo(() => {
    if (viewMode === "journey") {
      const active = journeyStages.find((s) => s.id === activeStageId);
      if (active) return { lat: active.lat, lng: active.lng };
      return { lat: journeyStages[2].lat, lng: journeyStages[2].lng };
    }
    if (selectedPlace) return { lat: selectedPlace.lat, lng: selectedPlace.lng };
    if (location) return { lat: location.lat, lng: location.lng };
    if (checkpoints[0]) return { lat: checkpoints[0].lat, lng: checkpoints[0].lng };
    return DEFAULT_CENTER;
  }, [viewMode, activeStageId, selectedPlace, location, checkpoints]);

  const recenterOnUser = () => {
    if (location && mapRef.current) {
      mapRef.current.panTo({ lat: location.lat, lng: location.lng });
      mapRef.current.setZoom(15);
    }
  };

  const handleMapClick = useCallback(
    async (e: google.maps.MapMouseEvent) => {
      if (!tapMode) return;
      if (!e.latLng) return;
      if (isAuthed !== true) {
        toast.error("Sign in to save checkpoints");
        return;
      }
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      // If user tapped a Google POI, prefer its placeId for nicer name
      const poiEvent = e as PoiMapMouseEvent;
      const placeId = poiEvent.placeId;
      if (placeId) poiEvent.stop?.();

      const requestId = ++tapRequestRef.current;

      setPendingTap({
        lat,
        lng,
        name: "Loading…",
        address: null,
        placeId: placeId ?? null,
        loading: true,
      });
      try {
        const res = await reverseGeocodeFn({ data: { lat, lng } });
        if (requestId !== tapRequestRef.current) return;
        setPendingTap({
          lat,
          lng,
          name: res.name,
          address: res.address,
          placeId: placeId ?? res.placeId,
          loading: false,
        });
      } catch {
        if (requestId !== tapRequestRef.current) return;
        setPendingTap({
          lat,
          lng,
          name: `Pin ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          address: null,
          placeId: placeId ?? null,
          loading: false,
        });
      }
    },
    [tapMode, isAuthed, reverseGeocodeFn],
  );

  const confirmPendingTap = () => {
    if (!pendingTap) return;
    addMut.mutate({
      placeId: pendingTap.placeId,
      name: pendingTap.name,
      address: pendingTap.address,
      lat: pendingTap.lat,
      lng: pendingTap.lng,
    });
    tapRequestRef.current += 1;
    setPendingTap(null);
    setTapMode(false);
  };

  const clearPendingTap = () => {
    tapRequestRef.current += 1;
    setPendingTap(null);
  };

  const addCurrentLocation = async () => {
    if (!location) {
      toast.error("Locating you… try again in a moment");
      return;
    }
    if (isAuthed !== true) {
      toast.error("Sign in to save checkpoints");
      return;
    }
    const lat = location.lat;
    const lng = location.lng;
    let name = `My location ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    let address: string | null = null;
    let placeId: string | null = null;
    try {
      const res = await reverseGeocodeFn({ data: { lat, lng } });
      name = res.name;
      address = res.address;
      placeId = res.placeId;
    } catch {
      /* fall back */
    }
    addMut.mutate({ placeId, name, address, lat, lng });
  };

  const runSearch = useCallback(
    async (q: string) => {
      const query = q.trim();
      if (!query) return;
      setSearchLoading(true);
      setSearchError(null);
      setShowResults(true);
      const requestId = ++searchRequestRef.current;
      try {
        const bias = location
          ? { lat: location.lat, lng: location.lng, radiusMeters: 50000 }
          : { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng, radiusMeters: 50000 };
        const res = await searchPlacesFn({ data: { query, bias, rankByDistance: !!location } });
        if (requestId !== searchRequestRef.current) return;
        if (res.error) {
          setSearchError(res.error);
          setSearchResults([]);
        } else {
          setSearchResults(res.places);
          if (res.places.length === 0) setSearchError("No places found");
        }
      } catch (e: unknown) {
        if (requestId !== searchRequestRef.current) return;
        setSearchError(e instanceof Error ? e.message : "Search failed");
        setSearchResults([]);
      } finally {
        if (requestId === searchRequestRef.current) setSearchLoading(false);
      }
    },
    [location, searchPlacesFn],
  );

  const pickPlace = (p: PlaceResult) => {
    setSelectedPlace(p);
    setActiveCheckpointId(null);
    setShowResults(false);
    setSearchQuery(p.name);
    if (mapRef.current) {
      mapRef.current.panTo({ lat: p.lat, lng: p.lng });
      mapRef.current.setZoom(14);
    }
  };

  const clearSearch = () => {
    searchRequestRef.current += 1;
    setSearchQuery("");
    setSearchResults([]);
    setSearchError(null);
    setShowResults(false);
    setSelectedPlace(null);
  };

  const pickCheckpoint = (c: Checkpoint) => {
    setSelectedPlace(null);
    setActiveCheckpointId(c.id);
    if (mapRef.current) {
      mapRef.current.panTo({ lat: c.lat, lng: c.lng });
      mapRef.current.setZoom(14);
    }
  };

  // Determine focused place for the explorer panel
  const activeCheckpoint = checkpoints.find((c) => c.id === activeCheckpointId);
  const savedMatch = selectedPlace
    ? checkpoints.find(
        (c) =>
          (selectedPlace.id && c.place_id === selectedPlace.id) ||
          (c.name === selectedPlace.name && Math.abs(c.lat - selectedPlace.lat) < 1e-5),
      )
    : null;

  const focused: FocusedPlace | null = selectedPlace
    ? {
        id: selectedPlace.id,
        name: selectedPlace.name,
        lat: selectedPlace.lat,
        lng: selectedPlace.lng,
        address: selectedPlace.address,
        placeId: selectedPlace.id,
        savedCheckpointId: savedMatch?.id ?? null,
      }
    : activeCheckpoint
      ? {
          id: activeCheckpoint.id,
          name: activeCheckpoint.name,
          lat: activeCheckpoint.lat,
          lng: activeCheckpoint.lng,
          address: activeCheckpoint.address ?? undefined,
          placeId: activeCheckpoint.place_id,
          savedCheckpointId: activeCheckpoint.id,
        }
      : null;

  // Compass: bearing from user's location to currently focused point (selected place / active checkpoint / map center)
  const compassTarget = useMemo(() => {
    if (selectedPlace)
      return { lat: selectedPlace.lat, lng: selectedPlace.lng, label: selectedPlace.name };
    if (activeCheckpoint) {
      return { lat: activeCheckpoint.lat, lng: activeCheckpoint.lng, label: activeCheckpoint.name };
    }
    return null;
  }, [selectedPlace, activeCheckpoint]);

  const compass = useMemo(() => {
    if (!location || !compassTarget) return null;
    const deg = bearing(
      { lat: location.lat, lng: location.lng },
      { lat: compassTarget.lat, lng: compassTarget.lng },
    );
    return { deg, dir: cardinal(deg), label: compassTarget.label };
  }, [location, compassTarget]);

  return (
    <div className="min-h-screen bg-parchment pt-4 pb-8 md:py-8">
      <div className="md:flex md:gap-6 md:px-8">
        <div className="md:w-2/3">
          <div className="mx-4 md:mx-0 overflow-hidden rounded-sheet bg-white shadow-card-md">
            <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-stone-100">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-pine mb-0.5 truncate">
                  {viewMode === "journey" ? "Mock Journey" : "My Checkpoints"}
                </p>
                <h2 className="text-lg font-bold text-stone-900 truncate">
                  {viewMode === "journey" ? journeyTitle : "Saved Places"}
                </h2>
                {viewMode === "journey" && (
                  <p className="text-[11px] text-stone-500 mt-0.5 truncate">{journeySubtitle}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0 rounded-full bg-stone-100 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("journey")}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
                    viewMode === "journey"
                      ? "bg-white text-terracotta shadow-sm"
                      : "text-stone-500 hover:text-stone-800"
                  }`}
                  aria-pressed={viewMode === "journey"}
                >
                  <RouteIcon size={12} />
                  Journey
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("pins")}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
                    viewMode === "pins"
                      ? "bg-white text-terracotta shadow-sm"
                      : "text-stone-500 hover:text-stone-800"
                  }`}
                  aria-pressed={viewMode === "pins"}
                >
                  <MapPin size={12} />
                  Pins
                </button>
              </div>
            </div>

            <div className="relative h-[300px] xs:h-[350px] sm:h-[400px] md:h-[500px] bg-stone-100 overflow-hidden">
              {permissionDenied && !permBannerDismissed && (
                <LocationPermissionBanner
                  onRetry={() => {
                    retryLocation();
                    toast.message("Requesting location…");
                  }}
                  onDismiss={() => setPermBannerDismissed(true)}
                />
              )}
              {mapLoadError ? (
                <div className="absolute inset-0 flex items-center justify-center bg-stone-50 p-6 text-center">
                  <div>
                    <p className="text-sm font-bold text-stone-800">Map unavailable</p>
                    <p className="mt-1 text-xs text-stone-500">{mapLoadError}</p>
                  </div>
                </div>
              ) : !isLoaded ? (
                <div className="absolute inset-0 flex items-center justify-center bg-stone-50">
                  <p className="text-xs font-semibold text-stone-400 animate-pulse">
                    Loading Google Maps...
                  </p>
                </div>
              ) : (
                <>
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapCenter}
                    zoom={location || checkpoints.length ? 10 : 5}
                    onLoad={(m) => {
                      mapRef.current = m;
                    }}
                    onClick={handleMapClick}
                    options={{
                      disableDefaultUI: true,
                      zoomControl: true,
                      clickableIcons: true,
                      draggableCursor: tapMode ? "crosshair" : undefined,
                      styles: [
                        {
                          featureType: "poi",
                          elementType: "labels",
                          stylers: [{ visibility: "off" }],
                        },
                      ],
                    }}
                  >
                    {viewMode === "journey" && todoPath.length > 1 && (
                      <Polyline
                        path={todoPath}
                        options={{
                          strokeColor: pine,
                          strokeOpacity: 0.85,
                          strokeWeight: 4,
                          icons: [
                            {
                              icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 3 },
                              offset: "0",
                              repeat: "14px",
                            },
                          ],
                        }}
                      />
                    )}
                    {viewMode === "journey" && donePath.length > 1 && (
                      <Polyline
                        path={donePath}
                        options={{
                          strokeColor: terracotta,
                          strokeOpacity: 0.95,
                          strokeWeight: 5,
                        }}
                      />
                    )}
                    {viewMode === "journey" &&
                      journeyStages.map((s) => {
                        const visited = s.spotId ? hasVisited(s.spotId) : false;
                        const active = activeStageId === s.id;
                        return (
                          <Marker
                            key={s.id}
                            position={{ lat: s.lat, lng: s.lng }}
                            onClick={() => pickStage(s)}
                            label={{
                              text: String(s.order),
                              color: "#ffffff",
                              fontSize: "11px",
                              fontWeight: "700",
                            }}
                            icon={{
                              path: window.google.maps.SymbolPath.CIRCLE,
                              scale: active ? 15 : 12,
                              fillColor: visited ? terracotta : pine,
                              fillOpacity: 1,
                              strokeColor: "#ffffff",
                              strokeWeight: active ? 3 : 2,
                            }}
                            zIndex={active ? 997 : 500}
                          />
                        );
                      })}

                    {viewMode === "pins" &&
                      checkpoints.map((c) => (
                        <Marker
                          key={c.id}
                          position={{ lat: c.lat, lng: c.lng }}
                          onClick={() => pickCheckpoint(c)}
                          icon={{
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: activeCheckpointId === c.id ? 13 : 10,
                            fillColor: activeCheckpointId === c.id ? terracotta : pine,
                            fillOpacity: 1,
                            strokeColor: "#ffffff",
                            strokeWeight: 2,
                          }}
                        />
                      ))}

                    {location && (
                      <Marker
                        position={{ lat: location.lat, lng: location.lng }}
                        icon={{
                          path: window.google.maps.SymbolPath.CIRCLE,
                          scale: 8,
                          fillColor: "#3b82f6",
                          fillOpacity: 1,
                          strokeColor: "#ffffff",
                          strokeWeight: 2,
                        }}
                        zIndex={999}
                      />
                    )}

                    {selectedPlace && (
                      <Marker
                        position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
                        icon={{
                          path: window.google.maps.SymbolPath.CIRCLE,
                          scale: 11,
                          fillColor: "#7c3aed",
                          fillOpacity: 1,
                          strokeColor: "#ffffff",
                          strokeWeight: 2,
                        }}
                        zIndex={998}
                      />
                    )}

                    {pendingTap && (
                      <Marker
                        position={{ lat: pendingTap.lat, lng: pendingTap.lng }}
                        icon={{
                          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                          scale: 6,
                          fillColor: terracotta,
                          fillOpacity: 1,
                          strokeColor: "#ffffff",
                          strokeWeight: 2,
                        }}
                        zIndex={1000}
                      />
                    )}
                  </GoogleMap>

                  {/* Search overlay */}
                  <div className="absolute top-3 left-3 right-3 z-20 max-w-md">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        runSearch(searchQuery);
                      }}
                      className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-card-md"
                    >
                      <Search size={16} className="text-stone-400 shrink-0" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => {
                          if (searchResults.length > 0) setShowResults(true);
                        }}
                        placeholder="Search places, temples, hotels..."
                        className="flex-1 bg-transparent text-sm text-stone-800 placeholder:text-stone-400 outline-none"
                      />
                      {searchLoading && (
                        <Loader2 size={14} className="animate-spin text-stone-400" />
                      )}
                      {searchQuery && !searchLoading && (
                        <button
                          type="button"
                          onClick={clearSearch}
                          className="text-stone-400 hover:text-stone-600"
                          aria-label="Clear search"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </form>

                    {showResults && (searchResults.length > 0 || searchError) && (
                      <div className="mt-2 max-h-72 overflow-y-auto rounded-2xl bg-white shadow-card-md border border-stone-100">
                        {searchError && searchResults.length === 0 && (
                          <p className="px-3 py-3 text-xs text-stone-500">{searchError}</p>
                        )}
                        {searchResults.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => pickPlace(p)}
                            className="w-full text-left px-3 py-2.5 hover:bg-stone-50 border-b border-stone-100 last:border-b-0 flex items-start gap-2"
                          >
                            <MapPin size={14} className="text-terracotta shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-stone-800 truncate">
                                {p.name}
                              </p>
                              {p.address && (
                                <p className="text-xs text-stone-500 truncate">{p.address}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {tapMode && !pendingTap && (
                      <p className="mt-2 rounded-full bg-terracotta/95 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 inline-flex items-center gap-1.5 shadow-card-md">
                        <Crosshair size={12} /> Tap map to drop pin
                      </p>
                    )}
                  </div>

                  {/* Compass badge */}
                  {compass && (
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 shadow-card-md">
                      <Compass
                        size={14}
                        className="text-pine"
                        style={{ transform: `rotate(${compass.deg}deg)` }}
                      />
                      <span className="text-[11px] font-bold text-stone-800">{compass.dir}</span>
                    </div>
                  )}

                  {/* Pending tap confirm popover */}
                  {pendingTap && (
                    <div className="absolute bottom-4 left-3 right-3 z-30 mx-auto max-w-sm rounded-2xl bg-white shadow-card-md border border-stone-100 p-3">
                      <div className="flex items-start gap-2">
                        <MapPin size={16} className="text-terracotta shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-stone-900 truncate">
                            {pendingTap.loading ? "Locating…" : pendingTap.name}
                          </p>
                          {pendingTap.address && (
                            <p className="text-xs text-stone-500 truncate">{pendingTap.address}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={clearPendingTap}
                          className="shrink-0 p-1 text-stone-400 hover:text-stone-600"
                          aria-label="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={confirmPendingTap}
                          disabled={pendingTap.loading}
                          className="flex-1 rounded-full bg-pine text-white text-xs font-bold py-2 hover:bg-pine/90 disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
                        >
                          <Plus size={12} /> Add checkpoint
                        </button>
                        <button
                          type="button"
                          onClick={clearPendingTap}
                          className="rounded-full bg-stone-100 text-stone-700 text-xs font-bold py-2 px-3 hover:bg-stone-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Floating action buttons */}
                  <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2 items-end">
                    <button
                      type="button"
                      onClick={() => {
                        setTapMode((v) => !v);
                        clearPendingTap();
                      }}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold shadow-card-md transition-colors ${
                        tapMode
                          ? "bg-terracotta text-white hover:bg-terracotta/90"
                          : "bg-white text-stone-800 hover:bg-stone-50"
                      }`}
                      aria-pressed={tapMode}
                    >
                      <Crosshair size={14} />
                      {tapMode ? "Tap on map" : "Pin a spot"}
                    </button>
                    {location && (
                      <button
                        type="button"
                        onClick={addCurrentLocation}
                        disabled={addMut.isPending}
                        className="flex items-center gap-1.5 rounded-full bg-pine text-white px-3 py-2 text-xs font-bold shadow-card-md hover:bg-pine/90 disabled:opacity-60"
                      >
                        <Plus size={14} /> Pin my location
                      </button>
                    )}
                    {location && (
                      <button
                        type="button"
                        onClick={recenterOnUser}
                        className="flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-bold text-stone-800 shadow-card-md hover:bg-stone-50"
                      >
                        <Navigation size={14} className="text-blue-500" />
                        Recenter
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="md:w-1/3">
          <div className="mx-4 mt-6 md:mx-0 md:mt-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
              {viewMode === "journey" ? "Journey Stages" : "Your Checkpoints"}
            </h3>
            {viewMode === "journey" ? (
              <JourneyStageList activeStageId={activeStageId} onPickStage={pickStage} />
            ) : checkpointsQuery.isLoading ? (
              <div className="flex items-center gap-2 text-stone-400 text-sm">
                <Loader2 size={14} className="animate-spin" /> Loading…
              </div>
            ) : checkpoints.length === 0 ? (
              <div className="rounded-card border border-dashed border-stone-200 bg-white p-5 text-center">
                <MapPin size={20} className="mx-auto text-stone-300 mb-2" />
                <p className="text-sm font-semibold text-stone-700">No checkpoints yet</p>
                <p className="text-xs text-stone-500 mt-1">
                  Tap <span className="font-semibold">Pin a spot</span> then tap the map, or use{" "}
                  <span className="font-semibold">Pin my location</span>.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {checkpoints.map((c, i) => (
                  <div
                    key={c.id}
                    className={`flex items-center gap-3 rounded-card px-4 py-3 border transition-colors ${
                      activeCheckpointId === c.id
                        ? "bg-terracotta-tint border-terracotta/20"
                        : "bg-white border-stone-100"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => pickCheckpoint(c)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                          activeCheckpointId === c.id
                            ? "bg-terracotta text-white"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-semibold leading-none truncate ${
                            activeCheckpointId === c.id ? "text-terracotta" : "text-stone-800"
                          }`}
                        >
                          {c.name}
                        </p>
                        {c.address && (
                          <p className="text-xs text-stone-400 mt-0.5 truncate">{c.address}</p>
                        )}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeMut.mutate(c.id)}
                      disabled={removeMut.isPending}
                      className="shrink-0 p-1.5 rounded-full text-stone-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                      aria-label={`Remove ${c.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Place explorer panel — driven by selected search result or active checkpoint */}
      {focused ? (
        <div className="md:px-8">
          <PlaceDetailPanel place={focused} />
        </div>
      ) : (
        <div className="md:px-8">
          <div className="mt-6 mx-4 md:mx-0 rounded-2xl bg-white border border-stone-100 p-6 text-center">
            <Plus size={20} className="mx-auto text-stone-300 mb-2" />
            <p className="text-sm font-semibold text-stone-700">Start exploring</p>
            <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
              Search for a place, tap anywhere on the map, or pin your current location — then
              explore topography, culture, food, and nearby spots.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
