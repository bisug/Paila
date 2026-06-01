import {
  BookOpenCheck,
  Home,
  Languages,
  MapPinned,
  Mountain,
  QrCode,
  Shield,
  Sparkles,
  Trophy,
  WalletCards,
  Bus,
} from "lucide-react";
import type { StaticImageData } from "next/image";
import begnasFishfarmImg from "@/assets/experiences/begnas-fishfarm.jpg";
import gurungCookingImg from "@/assets/experiences/gurung-cooking.jpg";
import ghandrukVillageImg from "@/assets/experiences/ghandruk-village.jpg";
import amaSitaKitchenImg from "@/assets/experiences/ama-sita-kitchen.jpg";

export type LedgerTab = "profile" | "ledger";
export type ExperienceCategory = "Food" | "Trekking" | "Culture" | "Wellness";

export const terracotta = "#D35D47";
export const pine = "#2A5C43";

export type SpotId = "pokhara" | "sarangkot" | "ghandruk";
export type ExperienceDepth = "signature" | "deeper" | "insider";
export type ImageSource = string | StaticImageData;

export const experiences = [
  // ── Pokhara ────────────────────────────────────────────────────────
  {
    id: "phewa-dawn-row",
    title: "Phewa Lake Dawn Row & Tal Barahi Blessing",
    subtitle: "Sunrise paddle across Phewa Tal to the island temple",
    place: "Lakeside, Pokhara",
    lat: 28.2096,
    lng: 83.9586,
    badge: "Village Verified",
    category: "Culture" as ExperienceCategory,
    spotId: "pokhara" as SpotId,
    depth: "signature" as ExperienceDepth,
    price: "900",
    priceUnit: "NPR",
    host: "Bishnu Boatmen's Co-op",
    rating: 4.7,
    reviews: 142,
    duration: "2 hrs",
    image:
      "https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=900&q=85",
    verified: true,
  },
  {
    id: "peace-pagoda-hike",
    title: "World Peace Pagoda Hike + Phewa Boat Return",
    subtitle: "Forest climb to the white stupa, boat back across the lake",
    place: "Pumdikot, Pokhara",
    lat: 28.1969,
    lng: 83.9542,
    badge: "Eco Certified",
    category: "Trekking" as ExperienceCategory,
    spotId: "pokhara" as SpotId,
    depth: "deeper" as ExperienceDepth,
    price: "1,400",
    priceUnit: "NPR",
    host: "Dipak Pariyar",
    rating: 4.8,
    reviews: 96,
    duration: "Half day",
    image:
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=900&q=85",
    verified: true,
  },
  {
    id: "begnas-fishfarm",
    title: "Begnas Lake Fish-Farm Lunch with Tamang Host",
    subtitle: "Quiet sister-lake of Phewa, fresh sahar fish from the pond",
    place: "Begnas, Pokhara",
    lat: 28.1716,
    lng: 84.093,
    badge: "Village Verified",
    category: "Food" as ExperienceCategory,
    spotId: "pokhara" as SpotId,
    depth: "insider" as ExperienceDepth,
    price: "1,600",
    priceUnit: "NPR",
    host: "Maya Tamang",
    rating: 4.9,
    reviews: 41,
    duration: "4 hrs",
    image: begnasFishfarmImg,
    verified: true,
  },

  // ── Sarangkot ──────────────────────────────────────────────────────
  {
    id: "sarangkot-yoga",
    title: "Sunrise Yoga at Sarangkot",
    subtitle: "Mountain yoga & meditation with panoramic Annapurna views",
    place: "Sarangkot, Pokhara",
    lat: 28.2439,
    lng: 83.9486,
    badge: "Eco Certified",
    category: "Wellness" as ExperienceCategory,
    spotId: "sarangkot" as SpotId,
    depth: "signature" as ExperienceDepth,
    price: "1,200",
    priceUnit: "NPR",
    host: "Priya Sharma",
    rating: 4.8,
    reviews: 64,
    duration: "2 hrs",
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=85",
    verified: true,
  },
  {
    id: "sarangkot-paragliding",
    title: "Tandem Paragliding from Sarangkot",
    subtitle: "25-min thermal flight over Phewa Lake with licensed pilots",
    place: "Sarangkot Launch, Pokhara",
    lat: 28.244,
    lng: 83.9488,
    badge: "Eco Certified",
    category: "Wellness" as ExperienceCategory,
    spotId: "sarangkot" as SpotId,
    depth: "deeper" as ExperienceDepth,
    price: "9,500",
    priceUnit: "NPR",
    host: "Pokhara Pilots Assoc.",
    rating: 4.9,
    reviews: 287,
    duration: "Half day",
    image:
      "https://images.unsplash.com/photo-1531386151447-fd76ad50012f?auto=format&fit=crop&w=900&q=85",
    verified: true,
  },
  {
    id: "sarangkot-cooking",
    title: "Gurung Cooking Class in Sarangkot Home",
    subtitle: "Dhido, gundruk and home-pressed apple rakshi with Ama's family",
    place: "Sarangkot Ridge, Pokhara",
    lat: 28.2452,
    lng: 83.9501,
    badge: "Women-Led",
    category: "Food" as ExperienceCategory,
    spotId: "sarangkot" as SpotId,
    depth: "insider" as ExperienceDepth,
    price: "1,800",
    priceUnit: "NPR",
    host: "Sunita Tamang",
    rating: 4.9,
    reviews: 38,
    duration: "3 hrs",
    image: gurungCookingImg,
    verified: true,
  },

  // ── Ghandruk ───────────────────────────────────────────────────────
  {
    id: "ghandruk-village-walk",
    title: "Ghandruk Heritage Village Walk",
    subtitle: "Stone-paved Gurung village, museum, Annapurna South panorama",
    place: "Ghandruk, Annapurna",
    lat: 28.3752,
    lng: 83.8055,
    badge: "Heritage Craft",
    category: "Culture" as ExperienceCategory,
    spotId: "ghandruk" as SpotId,
    depth: "signature" as ExperienceDepth,
    price: "1,200",
    priceUnit: "NPR",
    host: "Chhewang Gurung",
    rating: 4.8,
    reviews: 112,
    duration: "3 hrs",
    image: ghandrukVillageImg,
    verified: true,
  },
  {
    id: "ghandruk-kitchen",
    title: "Ama Sita's Kitchen, Ghandruk",
    subtitle: "Traditional Gurung cooking class & shared dal-bhat meal",
    place: "Ghandruk, Annapurna",
    lat: 28.376,
    lng: 83.8062,
    badge: "Women-Led",
    category: "Food" as ExperienceCategory,
    spotId: "ghandruk" as SpotId,
    depth: "deeper" as ExperienceDepth,
    price: "2,400",
    priceUnit: "NPR",
    host: "Ama Sita Gurung",
    rating: 4.9,
    reviews: 73,
    duration: "3 hrs",
    image: amaSitaKitchenImg,
    verified: true,
  },
  {
    id: "ghandruk-kimrong",
    title: "Ghandruk → Kimrong Viewpoint Day Hike",
    subtitle: "Quiet ridge trail with Machhapuchhre & Annapurna South views",
    place: "Kimrong, Annapurna",
    lat: 28.3621,
    lng: 83.7902,
    badge: "Indigenous Youth",
    category: "Trekking" as ExperienceCategory,
    spotId: "ghandruk" as SpotId,
    depth: "insider" as ExperienceDepth,
    price: "2,200",
    priceUnit: "NPR",
    host: "Chhewang Gurung",
    rating: 5.0,
    reviews: 27,
    duration: "Full day",
    image:
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=900&q=85",
    verified: true,
  },
];

export type Experience = (typeof experiences)[number];

export const milestones = [
  {
    id: "pokhara-lakeside",
    label: "Pokhara Lakeside (Start)",
    altitude: "820 m",
    lat: 28.2096,
    lng: 83.9586,
    visited: true,
    activities: ["Phewa Tal dawn row", "Tal Barahi blessing", "Lakeside dinner"],
  },
  {
    id: "sarangkot",
    label: "Sarangkot",
    altitude: "1,592 m",
    lat: 28.2439,
    lng: 83.9486,
    visited: true,
    activities: [
      "Sunrise yoga & Annapurna view",
      "Tandem paragliding launch",
      "Gurung cooking class",
    ],
  },
  {
    id: "nayapul",
    label: "Nayapul (Trailhead)",
    altitude: "1,070 m",
    lat: 28.305,
    lng: 83.6914,
    visited: false,
    activities: ["Permit checkpoint", "Modi Khola valley walk", "Jeep transfer to Ghandruk"],
  },
  {
    id: "ghandruk",
    label: "Ghandruk",
    altitude: "2,012 m",
    lat: 28.3752,
    lng: 83.8055,
    visited: false,
    activities: ["Gurung heritage walk", "Ama Sita's kitchen", "Kimrong viewpoint hike"],
  },
  {
    id: "pokhara-return",
    label: "Pokhara Lakeside (Return)",
    altitude: "820 m",
    lat: 28.2096,
    lng: 83.9586,
    visited: false,
    activities: ["Begnas day-trip", "Farewell dinner at Lakeside", "Departure"],
  },
];

export const guides = [
  {
    id: "guide-pokhara-anil",
    name: "Anil Gurung",
    milestoneId: "pokhara-lakeside",
    place: "Pokhara Lakeside",
    specialty: "Annapurna foothills trekking & Phewa Lake tours",
    languages: ["English", "Nepali", "German"],
    rating: 4.9,
    reviews: 211,
    experienceYears: 12,
    pricePerDay: "4,500",
    priceUnit: "NPR",
    phone: "+9779812345678",
    verified: true,
    available: true,
    nextAvailable: "Today",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "guide-pokhara-dipak",
    name: "Dipak Pariyar",
    milestoneId: "pokhara-lakeside",
    place: "Pokhara Lakeside",
    specialty: "World Peace Pagoda hike & Phewa boat tours",
    languages: ["English", "Nepali"],
    rating: 4.7,
    reviews: 86,
    experienceYears: 6,
    pricePerDay: "2,800",
    priceUnit: "NPR",
    phone: "+9779812345680",
    verified: true,
    available: false,
    nextAvailable: "Tue, Jun 2",
    image:
      "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "guide-sarangkot-sunita",
    name: "Sunita Tamang",
    milestoneId: "sarangkot",
    place: "Sarangkot Ridge",
    specialty: "Sarangkot sunrise, paragliding briefings & Gurung cooking",
    languages: ["English", "Nepali"],
    rating: 4.8,
    reviews: 124,
    experienceYears: 7,
    pricePerDay: "3,200",
    priceUnit: "NPR",
    phone: "+9779812345679",
    verified: true,
    available: true,
    nextAvailable: "Today",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "guide-ghandruk-chhewang",
    name: "Chhewang Gurung",
    milestoneId: "ghandruk",
    place: "Ghandruk Village",
    specialty: "Gurung village & Annapurna foothills day hikes",
    languages: ["English", "Nepali", "Gurung"],
    rating: 5.0,
    reviews: 89,
    experienceYears: 9,
    pricePerDay: "3,800",
    priceUnit: "NPR",
    phone: "+9779861122335",
    verified: true,
    available: true,
    nextAvailable: "Tomorrow",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "guide-ghandruk-maya",
    name: "Maya Gurung",
    milestoneId: "ghandruk",
    place: "Ghandruk Village",
    specialty: "Women-led homestay host & traditional dhido cooking",
    languages: ["English", "Nepali", "Gurung"],
    rating: 4.9,
    reviews: 64,
    experienceYears: 5,
    pricePerDay: "2,500",
    priceUnit: "NPR",
    phone: "+9779861122336",
    verified: false,
    available: false,
    nextAvailable: "Thu, Jun 4",
    image:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80",
  },
];

export type Guide = (typeof guides)[number];

export const impactBadges = [
  { title: "Annapurna Guardian", unlocked: true, icon: Mountain },
  { title: "Heritage Patron", unlocked: true, icon: BookOpenCheck },
  { title: "Zero Plastic", unlocked: false, icon: Sparkles },
  { title: "Village Wallet", unlocked: true, icon: WalletCards },
  { title: "Trail Steward", unlocked: false, icon: Shield },
  { title: "Direct Booking", unlocked: true, icon: Trophy },
];

export const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/map", label: "Map", icon: MapPinned },
  { href: "/scan", label: "Scan", icon: QrCode },
  { href: "/talk", label: "Talk", icon: Languages },
  { href: "/transport", label: "Transit", icon: Bus },
];

export function navKeyFor(href: string): string {
  if (href === "/") return "home";
  return href.replace(/^\//, "");
}

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

export const CULTURE_TIPS = [
  {
    id: 1,
    title: "Mani Walls & Chortens",
    desc: "Always pass to the left of Buddhist shrines to show respect.",
    image:
      "https://images.unsplash.com/photo-1542261543-7fc81c9c4883?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 2,
    title: "The Namaste",
    desc: "Press palms together and say 'Namaste' as a respectful greeting.",
    image:
      "https://images.unsplash.com/photo-1622378875569-8f4df021b0dc?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 3,
    title: "Right Hand Rule",
    desc: "Always use your right hand when giving or receiving items.",
    image:
      "https://images.unsplash.com/photo-1601614065609-b68e0cb20539?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 4,
    title: "Remove Your Shoes",
    desc: "Always remove shoes before entering temples, monasteries, and most homes.",
    image:
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 5,
    title: "Ask Before Photos",
    desc: "Always ask permission before photographing people, especially monks and elders.",
    image:
      "https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=400&q=80",
  },
];
