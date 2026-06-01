"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Compass, MapPin, BadgeCheck, Loader2, Bookmark, BookmarkCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { guides as mockGuides } from "@/lib/data";
import { useGuideBookmarks } from "@/hooks/use-guide-bookmarks";

type GuideRow = {
  id: string;
  full_name: string;
  place: string;
};

function BookmarkButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  const [pulse, setPulse] = useState(false);
  const Icon = active ? BookmarkCheck : Bookmark;
  const handleClick = () => {
    setPulse(true);
    window.setTimeout(() => setPulse(false), 240);
    onClick();
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      aria-label={
        active
          ? `Saved. Remove ${label} from your saved guides`
          : `Not saved. Save ${label} to your saved guides`
      }
      title={active ? "Remove from saved" : "Save for later"}
      className={`h-9 w-9 rounded-full flex items-center justify-center transition-all shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 ${
        active
          ? "bg-terracotta/10 text-terracotta hover:bg-terracotta/20"
          : "bg-stone-100 text-stone-400 hover:bg-stone-200 hover:text-stone-600"
      } ${pulse ? "scale-125" : "scale-100"}`}
    >
      <Icon size={16} strokeWidth={active ? 2.5 : 2} />
    </button>
  );
}

export default function GuidesIndex() {
  const [guides, setGuides] = useState<GuideRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const { isBookmarked, toggleBookmark, count } = useGuideBookmarks();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("guide_verifications")
        .select("id,full_name,place,status")
        .eq("status", "approved")
        .order("updated_at", { ascending: false });
      if (cancelled) return;
      if (error) setError(error.message);
      else setGuides((data ?? []) as GuideRow[]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleMock = useMemo(() => {
    const base = mockGuides.slice(0, 6);
    return showSavedOnly ? base.filter((g) => isBookmarked(g.id)) : base;
  }, [showSavedOnly, isBookmarked]);

  const visibleVerified = useMemo(() => {
    if (!guides) return [];
    return showSavedOnly ? guides.filter((g) => isBookmarked(g.id)) : guides;
  }, [guides, showSavedOnly, isBookmarked]);

  const usingMock = guides && guides.length === 0;
  const emptyOnSavedFilter =
    showSavedOnly &&
    ((usingMock && visibleMock.length === 0) ||
      (!usingMock && guides !== null && visibleVerified.length === 0));

  return (
    <div className="px-4 md:px-6 py-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="h-9 w-9 rounded-xl bg-terracotta/10 flex items-center justify-center">
          <Compass size={18} className="text-terracotta" />
        </div>
        <h1 className="text-2xl font-bold text-stone-900">Verified Guides</h1>
        {count > 0 && (
          <span
            className="ml-auto inline-flex items-center gap-1 rounded-full bg-terracotta/10 text-terracotta px-2.5 py-1 text-xs font-bold"
            aria-label={`${count} saved guide${count === 1 ? "" : "s"}`}
          >
            <BookmarkCheck size={12} />
            {count} saved
          </span>
        )}
      </div>
      <p className="text-sm text-stone-500 mb-5">
        Licensed local guides ready to take you off the beaten path.
      </p>

      <div role="status" aria-live="polite" className="sr-only">
        {count === 0 ? "No guides saved" : `${count} guide${count === 1 ? "" : "s"} saved`}
      </div>

      <div className="mb-5 rounded-2xl border border-terracotta/20 bg-terracotta/5 p-4 flex items-start gap-3">
        <BadgeCheck size={18} className="text-terracotta shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-stone-900">Are you a licensed guide?</p>
          <p className="text-stone-600 mb-2">Submit your guide ID to appear here.</p>
          <Link
            href="/guide/verify"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-terracotta hover:underline"
          >
            Get verified →
          </Link>
        </div>
      </div>

      <div className="mb-4 inline-flex rounded-xl border border-stone-200 bg-white p-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setShowSavedOnly(false)}
          aria-pressed={!showSavedOnly}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            !showSavedOnly ? "bg-stone-900 text-white" : "text-stone-500 hover:text-stone-900"
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setShowSavedOnly(true)}
          aria-pressed={showSavedOnly}
          className={`px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 ${
            showSavedOnly ? "bg-stone-900 text-white" : "text-stone-500 hover:text-stone-900"
          }`}
        >
          <BookmarkCheck size={12} />
          Saved
          <span
            className={`px-1.5 py-0.5 rounded-md text-[10px] ${
              showSavedOnly ? "bg-white/20" : "bg-stone-100 text-stone-500"
            }`}
          >
            {count}
          </span>
        </button>
      </div>

      {guides === null && !error && (
        <div className="flex items-center justify-center py-12 text-stone-400">
          <Loader2 size={20} className="animate-spin" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Couldn't load guides: {error}
        </div>
      )}

      {emptyOnSavedFilter && (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-6 text-center">
          <Bookmark size={20} className="mx-auto text-stone-400 mb-2" />
          <p className="text-sm font-semibold text-stone-700">No saved guides yet</p>
          <p className="text-xs text-stone-500 mt-1">
            Tap the bookmark on any guide to save it for later.
          </p>
        </div>
      )}

      {usingMock && !emptyOnSavedFilter && (
        <ul className="space-y-3">
          {visibleMock.map((g) => {
            const saved = isBookmarked(g.id);
            return (
              <li
                key={g.id}
                className="rounded-2xl border border-stone-200 bg-white p-4 flex items-center gap-3 hover:border-terracotta/40 hover:shadow-sm transition-all"
              >
                <Link
                  href={`/guides/${g.id}`}
                  className="flex items-center gap-3 min-w-0 flex-1 group"
                  aria-label={`View ${g.name}'s profile`}
                >
                  <img src={g.image} alt={g.name} className="h-11 w-11 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-stone-900 truncate group-hover:text-terracotta transition-colors">
                      {g.name}
                    </p>
                    <p className="text-xs text-stone-500 flex items-center gap-1">
                      <MapPin size={11} aria-hidden="true" />
                      {g.place}
                    </p>
                    <p className="text-[11px] text-stone-500 truncate mt-0.5">{g.specialty}</p>
                  </div>
                </Link>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {g.verified && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-pine-tint text-pine border border-pine/20">
                      <BadgeCheck size={10} />
                      Verified
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${
                      g.available
                        ? "bg-pine-tint text-pine border-pine/20"
                        : "bg-stone-100 text-stone-500 border-stone-200"
                    }`}
                    title={g.available ? "Available now" : "Currently unavailable"}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        g.available ? "bg-pine animate-pulse" : "bg-stone-400"
                      }`}
                    />
                    {g.available ? "Available" : "Busy"}
                  </span>
                </div>
                <BookmarkButton
                  active={saved}
                  onClick={() => toggleBookmark(g.id)}
                  label={g.name}
                />
              </li>
            );
          })}
        </ul>
      )}

      {!usingMock && guides && guides.length > 0 && !emptyOnSavedFilter && (
        <ul className="space-y-3">
          {visibleVerified.map((g) => {
            const saved = isBookmarked(g.id);
            return (
              <li
                key={g.id}
                className="rounded-2xl border border-stone-200 bg-white p-4 flex items-center gap-3 hover:border-terracotta/40 hover:shadow-sm transition-all"
              >
                <Link
                  href={`/guides/${g.id}`}
                  className="flex items-center gap-3 min-w-0 flex-1 group"
                  aria-label={`View ${g.full_name}'s profile`}
                >
                  <div className="h-11 w-11 rounded-full bg-gradient-to-br from-terracotta to-amber-500 text-white font-bold flex items-center justify-center">
                    {g.full_name?.[0]?.toUpperCase() ?? "G"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-stone-900 truncate group-hover:text-terracotta transition-colors">
                      {g.full_name}
                    </p>
                    <p className="text-xs text-stone-500 flex items-center gap-1">
                      <MapPin size={11} aria-hidden="true" />
                      {g.place}
                    </p>
                  </div>
                </Link>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-pine-tint text-pine border border-pine/20">
                  <BadgeCheck size={10} />
                  Verified
                </span>
                <BookmarkButton
                  active={saved}
                  onClick={() => toggleBookmark(g.id)}
                  label={g.full_name}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
