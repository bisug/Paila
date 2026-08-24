export type TransportMode = "road_shared" | "road_private" | "flight" | "trek";

type RoadStatus = "available" | "limited" | "full" | "on_demand";
type FlightStatus = "scheduled" | "boarding" | "delayed" | "cancelled" | "weather_hold";
type Difficulty = "easy" | "moderate" | "hard";

interface BaseTransport {
  id: string;
  mode: TransportMode;
  route: { from: string; to: string };
  operator: string;
  price: number;
  priceUnit: "NPR" | "USD";
  iconType: "jeep" | "bus" | "car" | "plane" | "boots";
}

export interface RoadOption extends BaseTransport {
  mode: "road_shared" | "road_private";
  departure: string;
  duration: string;
  status: RoadStatus;
  seatsLeft?: number;
  contact: string;
}

export interface FlightOption extends BaseTransport {
  mode: "flight";
  flightNumber: string;
  scheduledDeparture: string; // HH:MM local
  duration: string;
  airline: string;
  bookingUrl: string;
  officePhone?: string;
  status: FlightStatus;
  note?: string;
  cancellationReason?: string;
}

export interface TrekOption extends BaseTransport {
  mode: "trek";
  distanceKm: number;
  elevationGainM: number;
  estimatedDays: number;
  difficulty: Difficulty;
}

export type TransportOption = RoadOption | FlightOption | TrekOption;

export const transportOptions: TransportOption[] = [
  // ── Road · shared (jeeps & buses) ────────────────────────────────────
  {
    id: "bus-pokhara-tourist",
    mode: "road_shared",
    iconType: "bus",
    operator: "Greenline Tours",
    route: { from: "Kathmandu", to: "Pokhara" },
    departure: "07:00 AM",
    duration: "7 hrs",
    status: "available",
    contact: "+977-1-4253885",
    price: 1800,
    priceUnit: "NPR",
  },
  {
    id: "jeep-sarangkot-sunrise",
    mode: "road_shared",
    iconType: "jeep",
    operator: "Sarangkot Sunrise Jeep",
    route: { from: "Pokhara Lakeside", to: "Sarangkot Viewpoint" },
    departure: "05:00 AM",
    duration: "45 min",
    status: "limited",
    seatsLeft: 4,
    contact: "+977-9846099101",
    price: 400,
    priceUnit: "NPR",
  },
  {
    id: "jeep-pokhara-ghandruk",
    mode: "road_shared",
    iconType: "jeep",
    operator: "Annapurna Jeep Syndicate",
    route: { from: "Pokhara", to: "Ghandruk (via Nayapul)" },
    departure: "08:30 AM",
    duration: "5 hrs",
    status: "limited",
    seatsLeft: 2,
    contact: "+977-9846712255",
    price: 1200,
    priceUnit: "NPR",
  },
  {
    id: "bus-pokhara-nayapul",
    mode: "road_shared",
    iconType: "bus",
    operator: "Baglung Yatayat",
    route: { from: "Pokhara (Baglung Bus Park)", to: "Nayapul" },
    departure: "06:30 AM",
    duration: "2 hrs",
    status: "available",
    contact: "+977-9846099210",
    price: 250,
    priceUnit: "NPR",
  },

  // ── Road · private (taxis) ───────────────────────────────────────────
  {
    id: "taxi-sarangkot-sunrise",
    mode: "road_private",
    iconType: "car",
    operator: "Lakeside Sunrise Cabs",
    route: { from: "Pokhara Lakeside", to: "Sarangkot Viewpoint" },
    departure: "On Demand (pre-dawn)",
    duration: "45 min",
    status: "on_demand",
    contact: "+977-9846099887",
    price: 1500,
    priceUnit: "NPR",
  },
  {
    id: "taxi-airport-lakeside",
    mode: "road_private",
    iconType: "car",
    operator: "Pokhara Airport Cabs",
    route: { from: "Pokhara Airport (PKR)", to: "Lakeside" },
    departure: "On Demand",
    duration: "15 min",
    status: "on_demand",
    contact: "+977-9846099112",
    price: 600,
    priceUnit: "NPR",
  },
  {
    id: "taxi-pokhara-nayapul",
    mode: "road_private",
    iconType: "car",
    operator: "Annapurna Cabs",
    route: { from: "Pokhara", to: "Nayapul (trailhead)" },
    departure: "On Demand",
    duration: "1.5 hrs",
    status: "on_demand",
    contact: "+977-9846099888",
    price: 3500,
    priceUnit: "NPR",
  },

  // ── Flights ──────────────────────────────────────────────────────────
  {
    id: "flight-buddha-pkr",
    mode: "flight",
    iconType: "plane",
    operator: "Buddha Air",
    airline: "Buddha Air",
    flightNumber: "U4 603",
    route: { from: "KTM", to: "PKR" },
    scheduledDeparture: "07:30 AM",
    duration: "30 mins",
    status: "scheduled",
    bookingUrl: "https://www.buddhaair.com",
    officePhone: "+977-1-5970000",
    price: 8500,
    priceUnit: "NPR",
  },
  {
    id: "flight-sita-pkr-delayed",
    mode: "flight",
    iconType: "plane",
    operator: "Sita Air",
    airline: "Sita Air",
    flightNumber: "ST 801",
    route: { from: "KTM", to: "PKR" },
    scheduledDeparture: "08:00 AM",
    duration: "30 mins",
    status: "delayed",
    bookingUrl: "https://www.sitaair.com.np",
    officePhone: "+977-1-4466543",
    price: 7800,
    priceUnit: "NPR",
    cancellationReason: "Morning fog in Kathmandu Valley",
    note: "Delayed by 3 hours due to morning fog in the Kathmandu Valley. New ETD: 11:00 AM.",
  },
  {
    id: "flight-summit-jmo",
    mode: "flight",
    iconType: "plane",
    operator: "Summit Air",
    airline: "Summit Air",
    flightNumber: "S9 401",
    route: { from: "PKR", to: "JMO" },
    scheduledDeparture: "07:00 AM",
    duration: "20 mins",
    status: "weather_hold",
    bookingUrl: "https://www.summitnepal.com",
    officePhone: "+977-1-4464878",
    price: 14800,
    priceUnit: "NPR",
    cancellationReason: "Jomsom wind window closed",
    note: "Jomsom's wind window closes by 11 AM. Morning flights only — expect cascading delays.",
  },

  // ── Treks ────────────────────────────────────────────────────────────
  {
    id: "trek-nayapul-ghandruk",
    mode: "trek",
    iconType: "boots",
    operator: "Annapurna Guides",
    route: { from: "Nayapul", to: "Ghandruk" },
    distanceKm: 11,
    elevationGainM: 950,
    estimatedDays: 1,
    difficulty: "easy",
    price: 0,
    priceUnit: "NPR",
  },
  {
    id: "trek-ghandruk-poonhill",
    mode: "trek",
    iconType: "boots",
    operator: "Annapurna Guides",
    route: { from: "Ghandruk", to: "Poon Hill (Ghorepani Loop)" },
    distanceKm: 38,
    elevationGainM: 1800,
    estimatedDays: 4,
    difficulty: "moderate",
    price: 0,
    priceUnit: "NPR",
  },
  {
    id: "trek-peace-pagoda-loop",
    mode: "trek",
    iconType: "boots",
    operator: "Pokhara Trails Co.",
    route: { from: "Lakeside", to: "World Peace Pagoda Loop" },
    distanceKm: 9,
    elevationGainM: 380,
    estimatedDays: 1,
    difficulty: "easy",
    price: 0,
    priceUnit: "NPR",
  },
];
