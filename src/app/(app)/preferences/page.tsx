"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, MapPin, Tag, Trash2, RotateCcw, CalendarDays, Search, X } from "lucide-react";
import {
  loadEventPrefs,
  clearDismissedByIds,
  clearPenaltyForCategory,
  clearAllDismissed,
  type EventPrefs,
} from "@/lib/event-preferences";
import { LOCAL_EVENTS, type LocalEvent } from "@/components/views/HomeFeed";

type FilterMode = "all" | "category" | "location";

function imageSrc(image: LocalEvent["image"]) {
  return typeof image === "string" ? image : image.src;
}

export default function PreferencesPage() {
  const [prefs, setPrefs] = useState<EventPrefs>(() => loadEventPrefs());
  const [query, setQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  useEffect(() => {
    const sync = () => setPrefs(loadEventPrefs());
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  const dismissedEvents: LocalEvent[] = useMemo(() => {
    const ids = new Set((prefs.dismissed ?? []).map(String));
    return LOCAL_EVENTS.filter((e) => ids.has(String(e.id)));
  }, [prefs.dismissed]);

  const byCategory = useMemo(() => {
    const map = new Map<string, LocalEvent[]>();
    for (const ev of dismissedEvents) {
      const list = map.get(ev.category) ?? [];
      list.push(ev);
      map.set(ev.category, list);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [dismissedEvents]);

  const byLocation = useMemo(() => {
    const map = new Map<string, LocalEvent[]>();
    for (const ev of dismissedEvents) {
      const loc = ev.place.split(",")[0].trim();
      const list = map.get(loc) ?? [];
      list.push(ev);
      map.set(loc, list);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [dismissedEvents]);

  const categoryPenalties = Object.entries(prefs.penalties ?? {}).filter(([, v]) => (v ?? 0) > 0);
  const totalHidden = dismissedEvents.length;

  const q = query.trim().toLowerCase();

  const filteredByCategory = useMemo(() => {
    let entries = byCategory;
    if (q) {
      entries = entries.filter(
        ([cat, events]) =>
          cat.toLowerCase().includes(q) ||
          events.some(
            (e) => e.title.toLowerCase().includes(q) || e.place.toLowerCase().includes(q),
          ),
      );
    }
    if (filterMode === "location") return [];
    return entries;
  }, [byCategory, q, filterMode]);

  const filteredByLocation = useMemo(() => {
    let entries = byLocation;
    if (q) {
      entries = entries.filter(
        ([loc, events]) =>
          loc.toLowerCase().includes(q) ||
          events.some(
            (e) => e.title.toLowerCase().includes(q) || e.category.toLowerCase().includes(q),
          ),
      );
    }
    if (filterMode === "category") return [];
    return entries;
  }, [byLocation, q, filterMode]);

  const filteredPenalties = useMemo(() => {
    const list = categoryPenalties.filter(([cat]) => !byCategory.some(([c]) => c === cat));
    if (!q && filterMode !== "location") return list;
    if (filterMode === "location") return [];
    return list.filter(([cat]) => cat.toLowerCase().includes(q));
  }, [categoryPenalties, byCategory, q, filterMode]);

  const restoreIds = (ids: Array<string | number>) => {
    const next = clearDismissedByIds(ids);
    setPrefs(next);
  };

  const restoreAll = () => {
    const next = clearAllDismissed();
    setPrefs(next);
  };

  const restoreCategory = (cat: string) => {
    setPrefs(clearPenaltyForCategory(cat as never));
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="grid place-items-center w-9 h-9 rounded-full bg-muted text-foreground hover:bg-accent"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-foreground truncate">Event preferences</h1>
            <p className="text-[11px] text-muted-foreground truncate">
              Manage what you’ve marked as “Not interested”.
            </p>
          </div>
          {totalHidden > 0 && (
            <button
              type="button"
              onClick={restoreAll}
              className="shrink-0 inline-flex items-center gap-1 rounded-full bg-terracotta text-white text-[11px] font-bold px-3 py-1.5 hover:bg-terracotta/90"
            >
              <RotateCcw size={12} strokeWidth={2.5} /> Reset all
            </button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-5">
        {totalHidden > 0 && (
          <div className="space-y-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search hidden events…"
                aria-label="Search hidden events"
                className="input pl-8 pr-8 text-xs"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { key: "all", label: "All" },
                  { key: "category", label: "By category" },
                  { key: "location", label: "By location" },
                ] as { key: FilterMode; label: string }[]
              ).map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilterMode(f.key)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                    filterMode === f.key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {q && (
              <p className="text-[11px] text-muted-foreground">
                {filteredByCategory.length + filteredByLocation.length + filteredPenalties.length}{" "}
                result
                {filteredByCategory.length +
                  filteredByLocation.length +
                  filteredPenalties.length ===
                1
                  ? ""
                  : "s"}
              </p>
            )}
          </div>
        )}
        {totalHidden === 0 && categoryPenalties.length === 0 ? (
          <div className="mt-10 text-center">
            <div className="mx-auto w-12 h-12 grid place-items-center rounded-full bg-muted text-muted-foreground mb-3">
              <CalendarDays size={20} />
            </div>
            <p className="text-sm font-bold text-foreground">No hidden events yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              When you mark a recommended festival or activity as “Not interested”, it will show up
              here.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1 mt-4 text-xs font-bold text-terracotta hover:underline"
            >
              <ArrowLeft size={12} /> Back to feed
            </Link>
          </div>
        ) : (
          <>
            {q &&
              filteredByCategory.length === 0 &&
              filteredByLocation.length === 0 &&
              filteredPenalties.length === 0 && (
                <div className="text-center py-10">
                  <Search size={20} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs font-bold text-muted-foreground">No matches found</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Try a different search term.</p>
                </div>
              )}

            {(filterMode === "all" || filterMode === "category") && (
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <Tag size={13} className="text-terracotta" />
                  <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    By category
                  </h2>
                </div>
                {filteredByCategory.length === 0 && filteredPenalties.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No category-level adjustments.</p>
                ) : (
                  <div className="space-y-2">
                    {filteredByCategory.map(([cat, events]) => (
                      <PrefGroup
                        key={`cat-${cat}`}
                        label={cat}
                        events={events}
                        onClear={() => {
                          restoreIds(events.map((e) => e.id));
                          restoreCategory(cat);
                        }}
                        onRestoreOne={(id) => restoreIds([id])}
                      />
                    ))}
                    {filteredPenalties.map(([cat]) => (
                      <div
                        key={`pen-${cat}`}
                        className="flex items-center justify-between bg-card border border-border rounded-card px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground">{cat}</p>
                          <p className="text-[10px] text-muted-foreground">Showing fewer of these.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => restoreCategory(cat)}
                          className="text-[11px] font-bold text-terracotta hover:underline"
                        >
                          Reset
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {(filterMode === "all" || filterMode === "location") && (
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={13} className="text-terracotta" />
                  <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    By location
                  </h2>
                </div>
                {filteredByLocation.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No hidden events.</p>
                ) : (
                  <div className="space-y-2">
                    {filteredByLocation.map(([loc, events]) => (
                      <PrefGroup
                        key={`loc-${loc}`}
                        label={loc}
                        events={events}
                        onClear={() => restoreIds(events.map((e) => e.id))}
                        onRestoreOne={(id) => restoreIds([id])}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function PrefGroup({
  label,
  events,
  onClear,
  onRestoreOne,
}: {
  label: string;
  events: LocalEvent[];
  onClear: () => void;
  onRestoreOne: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card border border-border rounded-card overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex-1 min-w-0 text-left"
        >
          <p className="text-xs font-bold text-foreground truncate">{label}</p>
          <p className="text-[10px] text-muted-foreground">
            {events.length} hidden {events.length === 1 ? "event" : "events"} · tap to{" "}
            {open ? "hide" : "view"}
          </p>
        </button>
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-terracotta hover:underline"
        >
          <Trash2 size={11} strokeWidth={2.5} /> Clear
        </button>
      </div>
      {open && (
        <ul className="border-t border-border divide-y divide-border">
          {events.map((ev) => (
            <li key={`${label}-${ev.id}`} className="flex items-center gap-2 px-3 py-2">
              <img
                src={imageSrc(ev.image)}
                alt=""
                className="w-9 h-9 rounded-md object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-foreground truncate">{ev.title}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {ev.category} · {ev.place}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRestoreOne(ev.id)}
                className="shrink-0 text-[10px] font-bold text-muted-foreground hover:text-terracotta hover:underline"
              >
                Restore
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
