import type { SpotId } from "@/lib/data";
import { experiences, transportOptions } from "@/lib/data";

export type JourneyStage = {
  id: string;
  day: number;
  order: number; // 1..n
  name: string;
  shortName: string;
  altitude: string;
  lat: number;
  lng: number;
  blurb: string;
  /** Optional link to the visit tracker (Pokhara / Sarangkot / Ghandruk). */
  spotId?: SpotId;
  /** Experience ids from src/lib/data.ts to surface as activity chips. */
  activityIds: string[];
  /** Transport id (from transportOptions) used to travel TO this stage. */
  legFromPreviousId?: string;
};

export const journeyStages: JourneyStage[] = [
  {
    id: "tia-arrival",
    day: 1,
    order: 1,
    name: "Tribhuvan International Airport",
    shortName: "Kathmandu (TIA)",
    altitude: "1,338 m",
    lat: 27.6966,
    lng: 85.3591,
    blurb:
      "Land in Kathmandu, grab a local SIM at arrivals, transfer 7 km to Thamel and shake off jetlag with momos on Freak Street.",
    activityIds: [],
  },
  {
    id: "ktm-durbar-swayambhu",
    day: 2,
    order: 2,
    name: "Kathmandu Durbar Square & Swayambhunath",
    shortName: "Old Kathmandu",
    altitude: "1,400 m",
    lat: 27.7041,
    lng: 85.3076,
    blurb:
      "Heritage walk through Hanuman Dhoka, Kumari Ghar and the Taleju temples, then climb the 365 steps of the Monkey Temple for a valley-wide sunset.",
    activityIds: [],
  },
  {
    id: "bhaktapur-patan",
    day: 3,
    order: 3,
    name: "Bhaktapur & Patan Heritage Loop",
    shortName: "Bhaktapur · Patan",
    altitude: "1,401 m",
    lat: 27.6722,
    lng: 85.4298,
    blurb:
      "Morning in Bhaktapur's pottery and Pujari Math courtyards with juju dhau king curd; afternoon in Patan Durbar Square and the Krishna Mandir for Newari metal-craft and bara at Honacha.",
    activityIds: [],
  },
  {
    id: "boudha-pashupati",
    day: 4,
    order: 4,
    name: "Boudhanath & Pashupatinath",
    shortName: "Boudha · Pashupati",
    altitude: "1,400 m",
    lat: 27.7215,
    lng: 85.362,
    blurb:
      "Dawn kora around Boudhanath stupa with butter lamps and Tibetan breakfast, then Pashupatinath's riverside ghats and sadhu courtyards before an evening Thamel pack-up.",
    activityIds: [],
  },
  {
    id: "pokhara-lakeside",
    day: 5,
    order: 5,
    name: "Pokhara Lakeside",
    shortName: "Pokhara",
    altitude: "822 m",
    lat: 28.2096,
    lng: 83.9586,
    blurb:
      "Tourist bus down the Prithvi Highway along the Trishuli river. Settle by Phewa Tal, dawn row to Tal Barahi and dinner along Lakeside.",
    spotId: "pokhara",
    activityIds: ["phewa-dawn-row", "peace-pagoda-hike"],
    legFromPreviousId: "bus-pokhara-tourist",
  },
  {
    id: "sarangkot",
    day: 6,
    order: 6,
    name: "Sarangkot",
    shortName: "Sarangkot",
    altitude: "1,592 m",
    lat: 28.2439,
    lng: 83.9486,
    blurb:
      "Pre-dawn ride up the ridge for Annapurna sunrise, gentle yoga, then a tandem paragliding flight back over Phewa.",
    spotId: "sarangkot",
    activityIds: ["sarangkot-yoga", "sarangkot-paragliding"],
    legFromPreviousId: "jeep-sarangkot-sunrise",
  },
  {
    id: "nayapul",
    day: 7,
    order: 7,
    name: "Nayapul Trailhead",
    shortName: "Nayapul",
    altitude: "1,070 m",
    lat: 28.305,
    lng: 83.6914,
    blurb:
      "Bus from Pokhara to Nayapul. ACAP permit check, cross the Modi Khola suspension bridge and start the climb.",
    activityIds: [],
    legFromPreviousId: "bus-pokhara-nayapul",
  },
  {
    id: "ghandruk",
    day: 7,
    order: 8,
    name: "Ghandruk Village",
    shortName: "Ghandruk",
    altitude: "1,940 m",
    lat: 28.3752,
    lng: 83.8055,
    blurb:
      "Five-hour trek up stone steps to the Gurung heritage village. Visit Ama Sita's kitchen for dal-bhat with Annapurna South in view.",
    spotId: "ghandruk",
    activityIds: ["ghandruk-village-walk", "ghandruk-kitchen"],
    legFromPreviousId: "trek-nayapul-ghandruk",
  },
  {
    id: "kimrong",
    day: 8,
    order: 9,
    name: "Kimrong Viewpoint Loop",
    shortName: "Kimrong",
    altitude: "2,150 m",
    lat: 28.3621,
    lng: 83.7902,
    blurb:
      "Day hike along the quiet Kimrong ridge for unobstructed Machhapuchhre and Annapurna South panoramas before returning to Ghandruk.",
    spotId: "ghandruk",
    activityIds: ["ghandruk-kimrong"],
  },
];

export const journeyTitle = "Tribhuvan Airport → Ghandruk";
export const journeySubtitle = "8-day Kathmandu Valley & Annapurna foothills";
export const journeyTotals = {
  days: 8,
  stages: journeyStages.length,
  startLabel: "Kathmandu (TIA)",
  endLabel: "Ghandruk",
};

export function getActivitiesForStage(stage: JourneyStage) {
  return stage.activityIds
    .map((id) => experiences.find((e) => e.id === id))
    .filter((e): e is NonNullable<typeof e> => Boolean(e));
}

export function getLegForStage(stage: JourneyStage) {
  if (!stage.legFromPreviousId) return undefined;
  return transportOptions.find((t) => t.id === stage.legFromPreviousId);
}
