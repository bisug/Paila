import { useState, useRef, useCallback } from "react";
import { Search, Loader2, X, MapPin } from "lucide-react";
import { searchPlaces } from "@/lib/api/search-places.functions";

export type PlaceResult = {
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

interface MapSearchOverlayProps {
  location?: { lat: number; lng: number } | null;
  onPlaceSelected: (place: PlaceResult) => void;
}

const DEFAULT_CENTER = { lat: 28.3949, lng: 84.124 }; // Nepal centroid

export function MapSearchOverlay({ location, onPlaceSelected }: MapSearchOverlayProps) {
  const searchRequestRef = useRef(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

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
        const res = await searchPlaces({ data: { query, bias, rankByDistance: !!location } });
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
    [location],
  );

  const clearSearch = () => {
    searchRequestRef.current += 1;
    setSearchQuery("");
    setSearchResults([]);
    setSearchError(null);
    setShowResults(false);
  };

  const pickPlace = (p: PlaceResult) => {
    onPlaceSelected(p);
    setShowResults(false);
    setSearchQuery(p.name);
  };

  return (
    <div className="absolute top-3 left-3 right-3 z-20 max-w-md pointer-events-auto">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(searchQuery);
        }}
        className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-card-md pointer-events-auto"
      >
        <Search size={16} className="text-stone-400 shrink-0" />
        <input
          type="text"
          aria-label="Search places"
          value={searchQuery}
          onChange={(e) => {
            const val = e.target.value;
            setSearchQuery(val);
            if (!val.trim()) {
              setSearchResults([]);
              setSearchError(null);
              setShowResults(false);
            }
          }}
          onFocus={() => {
            if (searchResults.length > 0) setShowResults(true);
          }}
          placeholder="Search places, temples, hotels..."
          className="flex-1 bg-transparent text-sm text-stone-800 placeholder:text-stone-400 outline-none"
        />
        {searchLoading && <Loader2 size={14} className="animate-spin text-stone-400" />}
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
        <div className="mt-2 max-h-72 overflow-y-auto rounded-2xl bg-white shadow-card-md border border-stone-100 pointer-events-auto">
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
                <p className="text-sm font-semibold text-stone-800 truncate">{p.name}</p>
                {p.address && <p className="text-xs text-stone-500 truncate">{p.address}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
