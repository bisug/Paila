import type { InterestId } from "@/lib/interests";
import { INTEREST_LABELS } from "@/lib/interests";

/**
 * EventCategory is duplicated as a string alias to avoid coupling this
 * module to the HomeFeed file. The actual union lives next to LOCAL_EVENTS.
 */
export type EventCategory = string;

export const INTEREST_TO_EVENT_CATEGORIES: Record<InterestId, EventCategory[]> = {
  trekking: ["Adventure", "Sports"],
  temples: ["Religious", "Cultural"],
  monasteries: ["Religious", "Cultural"],
  historical: ["Cultural", "Art", "Festival"],
  food: ["Food", "Market", "Workshop"],
  wellness: ["Workshop", "Religious"],
  wildlife: ["Adventure", "Sports"],
  villages: ["Community", "Market", "Food"],
  festivals: ["Festival", "Cultural", "Religious", "Music"],
  handicrafts: ["Workshop", "Art", "Market"],
};

export type EventPrefs = {
  counts: Record<string, number>;
  penalties?: Record<string, number>;
  dismissed?: string[];
  lastUpdated: number;
};

const STORAGE_KEY = "paila:event-prefs:v1";
const HALF_LIFE_DAYS = 30;
const DISMISS_PENALTY = 1.5;

export function loadEventPrefs(): EventPrefs {
  if (typeof window === "undefined") return { counts: {}, lastUpdated: Date.now() };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { counts: {}, lastUpdated: Date.now() };
    const parsed = JSON.parse(raw) as EventPrefs;
    if (!parsed || typeof parsed !== "object" || !parsed.counts) {
      return { counts: {}, lastUpdated: Date.now() };
    }
    return parsed;
  } catch {
    return { counts: {}, lastUpdated: Date.now() };
  }
}

export function saveEventPrefs(prefs: EventPrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore quota / private-mode errors
  }
}

export function clearEventPrefs(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function recordEventInteraction(category: EventCategory, weight = 1): EventPrefs {
  const prefs = loadEventPrefs();
  const next: EventPrefs = {
    ...prefs,
    counts: { ...prefs.counts, [category]: (prefs.counts[category] ?? 0) + weight },
    lastUpdated: Date.now(),
  };
  saveEventPrefs(next);
  return next;
}

export function dismissEvent(eventId: string | number, category: EventCategory): EventPrefs {
  const prefs = loadEventPrefs();
  const id = String(eventId);
  const dismissed = Array.from(new Set([...(prefs.dismissed ?? []), id]));
  const penalties = { ...(prefs.penalties ?? {}) };
  penalties[category] = (penalties[category] ?? 0) + DISMISS_PENALTY;
  const next: EventPrefs = {
    ...prefs,
    dismissed,
    penalties,
    lastUpdated: Date.now(),
  };
  saveEventPrefs(next);
  return next;
}

export function undoDismissEvent(eventId: string | number, category: EventCategory): EventPrefs {
  const prefs = loadEventPrefs();
  const id = String(eventId);
  const dismissed = (prefs.dismissed ?? []).filter((x) => x !== id);
  const penalties = { ...(prefs.penalties ?? {}) };
  if (penalties[category] != null) {
    penalties[category] = Math.max(0, penalties[category] - DISMISS_PENALTY);
    if (penalties[category] === 0) delete penalties[category];
  }
  const next: EventPrefs = { ...prefs, dismissed, penalties, lastUpdated: Date.now() };
  saveEventPrefs(next);
  return next;
}

export function isDismissed(prefs: EventPrefs, eventId: string | number): boolean {
  return (prefs.dismissed ?? []).includes(String(eventId));
}

export function clearDismissedByIds(ids: Array<string | number>): EventPrefs {
  const prefs = loadEventPrefs();
  const drop = new Set(ids.map(String));
  const dismissed = (prefs.dismissed ?? []).filter((x) => !drop.has(x));
  const next: EventPrefs = { ...prefs, dismissed, lastUpdated: Date.now() };
  saveEventPrefs(next);
  return next;
}

export function clearPenaltyForCategory(category: EventCategory): EventPrefs {
  const prefs = loadEventPrefs();
  const penalties = { ...(prefs.penalties ?? {}) };
  delete penalties[category];
  const next: EventPrefs = { ...prefs, penalties, lastUpdated: Date.now() };
  saveEventPrefs(next);
  return next;
}

export function clearAllDismissed(): EventPrefs {
  const prefs = loadEventPrefs();
  const next: EventPrefs = { ...prefs, dismissed: [], penalties: {}, lastUpdated: Date.now() };
  saveEventPrefs(next);
  return next;
}

export function hasAnySignal(prefs: EventPrefs, interests: InterestId[]): boolean {
  return interests.length > 0 || Object.values(prefs.counts).some((n) => n > 0);
}

function interestBoostFor(category: EventCategory, interests: InterestId[]): number {
  if (!interests.length) return 0;
  let boost = 0;
  for (const id of interests) {
    const mapped = INTEREST_TO_EVENT_CATEGORIES[id] ?? [];
    if (mapped.includes(category)) boost += 1;
  }
  return Math.min(boost, 2); // cap so onboarding can't fully overpower behavior
}

function recencyBoost(startsAt: number, now: number): number {
  const days = Math.max(0, (startsAt - now) / (24 * 3600 * 1000));
  return Math.max(0, 1 - days / 30); // soft boost for events within ~30 days
}

export type ScorableEvent = {
  category: EventCategory;
  startsAt: number;
};

export function scoreEvent(
  event: ScorableEvent,
  prefs: EventPrefs,
  interests: InterestId[],
  nowMs: number = Date.now(),
): number {
  // Light recency decay on stored counts so old taps fade.
  const daysSince = Math.max(0, (nowMs - prefs.lastUpdated) / (24 * 3600 * 1000));
  const decay = Math.pow(0.5, daysSince / HALF_LIFE_DAYS);
  const rawCount = prefs.counts[event.category] ?? 0;
  const behavior = Math.log1p(rawCount) * 2 * decay;
  const interest = interestBoostFor(event.category, interests);
  const soon = recencyBoost(event.startsAt, nowMs) * 0.5;
  const penalty = (prefs.penalties?.[event.category] ?? 0) * decay;
  return behavior + interest + soon - penalty;
}

export function rankEvents<T extends ScorableEvent>(
  events: T[],
  prefs: EventPrefs,
  interests: InterestId[],
  nowMs: number = Date.now(),
): T[] {
  return [...events]
    .map((e) => ({ e, s: scoreEvent(e, prefs, interests, nowMs) }))
    .sort((a, b) => b.s - a.s || a.e.startsAt - b.e.startsAt)
    .map((x) => x.e);
}

/** Returns the top N categories the user is most likely to care about. */
export function topCategories(
  prefs: EventPrefs,
  interests: InterestId[],
  available: EventCategory[],
  n = 3,
): EventCategory[] {
  const scores = new Map<EventCategory, number>();
  for (const cat of available) {
    const behavior = Math.log1p(prefs.counts[cat] ?? 0) * 2;
    const interest = interestBoostFor(cat, interests);
    const total = behavior + interest;
    if (total > 0) scores.set(cat, total);
  }
  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([cat]) => cat);
}

/** Returns a short "Why you're seeing this" label for a recommended event. */
export function explainRecommendation(
  event: ScorableEvent,
  prefs: EventPrefs,
  interests: InterestId[],
): string {
  const hasSignal = interests.length > 0 || Object.values(prefs.counts).some((n) => n > 0);
  if (!hasSignal) return "Trending nearby for you";

  const behaviorCount = prefs.counts[event.category] ?? 0;
  if (behaviorCount > 0) {
    return `Because you explored ${event.category} events`;
  }

  for (const id of interests) {
    const mapped = INTEREST_TO_EVENT_CATEGORIES[id] ?? [];
    if (mapped.includes(event.category)) {
      return `Matches your interest in ${INTEREST_LABELS[id]}`;
    }
  }

  return "Trending nearby for you";
}
