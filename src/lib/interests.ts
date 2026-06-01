import {
  Mountain,
  Landmark,
  Church,
  BookOpenCheck,
  UtensilsCrossed,
  Flower2,
  TreePine,
  Home,
  PartyPopper,
  Palette,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Experience } from "./data";

export type InterestId =
  | "trekking"
  | "temples"
  | "monasteries"
  | "historical"
  | "food"
  | "wellness"
  | "wildlife"
  | "villages"
  | "festivals"
  | "handicrafts";

export const INTERESTS: {
  id: InterestId;
  label: string;
  tKey: string;
  icon: LucideIcon;
  keywords: string[];
}[] = [
  {
    id: "trekking",
    label: "Trekking",
    tKey: "interests.trekking",
    icon: Mountain,
    keywords: ["trek", "trekking", "circuit", "trail", "annapurna", "manaslu", "langtang", "hike"],
  },
  {
    id: "temples",
    label: "Temples",
    tKey: "interests.temples",
    icon: Landmark,
    keywords: ["temple", "pashupatinath", "shrine", "stupa", "hindu"],
  },
  {
    id: "monasteries",
    label: "Monasteries",
    tKey: "interests.monasteries",
    icon: Church,
    keywords: ["monastery", "gompa", "buddhist", "meditation", "chorten"],
  },
  {
    id: "historical",
    label: "Historical Sites",
    tKey: "interests.historical",
    icon: BookOpenCheck,
    keywords: ["heritage", "historic", "bhaktapur", "patan", "durbar", "kathmandu valley"],
  },
  {
    id: "food",
    label: "Food & Cuisine",
    tKey: "interests.food",
    icon: UtensilsCrossed,
    keywords: ["food", "kitchen", "cooking", "dal bhat", "cuisine", "meal", "dinner"],
  },
  {
    id: "wellness",
    label: "Wellness & Yoga",
    tKey: "interests.wellness",
    icon: Flower2,
    keywords: ["yoga", "wellness", "meditation", "sunrise", "spa"],
  },
  {
    id: "wildlife",
    label: "Wildlife & Nature",
    tKey: "interests.wildlife",
    icon: TreePine,
    keywords: ["wildlife", "jungle", "safari", "bardia", "chitwan", "river", "nature"],
  },
  {
    id: "villages",
    label: "Villages & Homestays",
    tKey: "interests.villages",
    icon: Home,
    keywords: ["village", "homestay", "gurung", "tharu", "community", "rural"],
  },
  {
    id: "festivals",
    label: "Festivals & Culture",
    tKey: "interests.festivals",
    icon: PartyPopper,
    keywords: ["festival", "ritual", "culture", "dance", "heritage"],
  },
  {
    id: "handicrafts",
    label: "Handicrafts",
    tKey: "interests.handicrafts",
    icon: Palette,
    keywords: ["pottery", "craft", "weaving", "artisan", "wheel", "handmade"],
  },
];

export const INTEREST_LABELS: Record<InterestId, string> = Object.fromEntries(
  INTERESTS.map((i) => [i.id, i.label]),
) as Record<InterestId, string>;

export function scoreExperience(exp: Experience, interests: InterestId[]): number {
  if (!interests.length) return 0;
  const hay =
    `${exp.title} ${exp.subtitle} ${exp.place} ${exp.category} ${exp.badge}`.toLowerCase();
  let score = 0;
  for (const id of interests) {
    const def = INTERESTS.find((i) => i.id === id);
    if (!def) continue;
    if (def.keywords.some((kw) => hay.includes(kw))) score += 1;
  }
  return score;
}

export function sortByInterests<T extends Experience>(items: T[], interests: InterestId[]): T[] {
  if (!interests.length) return items;
  return [...items]
    .map((e) => ({ e, s: scoreExperience(e, interests) }))
    .sort((a, b) => b.s - a.s || b.e.rating - a.e.rating)
    .map((x) => x.e);
}
