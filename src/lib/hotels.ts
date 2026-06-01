// Static hotel catalog — Pokhara · Sarangkot · Ghandruk prototype scenario.
import type { StaticImageData } from "next/image";
import phewaShore from "@/assets/hotels/phewa-shore.jpg";
import lakesideBackpackers from "@/assets/hotels/lakeside-backpackers.jpg";
import annapurnaBoutique from "@/assets/hotels/annapurna-boutique.jpg";
import sarangkotSunrise from "@/assets/hotels/sarangkot-sunrise.jpg";
import ghandrukHeritage from "@/assets/hotels/ghandruk-heritage.jpg";
import ghandrukRidge from "@/assets/hotels/ghandruk-ridge.jpg";
export type Hotel = {
  id: string;
  slug: string;
  name: string;
  location: string;
  district: string;
  pricePerNight: number; // NPR
  rating: number;
  reviewCount: number;
  amenities: string[];
  images: Array<string | StaticImageData>;
  description: string;
  hostName: string;
  maxGuests: number;
  bedType: string;
  checkIn: string;
  checkOut: string;
  spotId?: "pokhara" | "sarangkot" | "ghandruk";
};

export const hotels: Hotel[] = [
  {
    id: "h-pokhara-lakeside",
    slug: "phewa-shore-retreat",
    name: "Phewa Shore Retreat",
    location: "Lakeside, Pokhara",
    district: "Kaski",
    spotId: "pokhara",
    pricePerNight: 4500,
    rating: 4.8,
    reviewCount: 312,
    amenities: ["Lake view", "Wi-Fi", "Bike rental", "Breakfast", "Garden"],
    images: [phewaShore, phewaShore],
    description:
      "Lakeside cottages with private balconies overlooking Phewa Tal. Sunrise yoga deck, kayaks on request, organic breakfast from the kitchen garden.",
    hostName: "Anil Gurung",
    maxGuests: 4,
    bedType: "King + bunk",
    checkIn: "13:00",
    checkOut: "11:00",
  },
  {
    id: "h-pokhara-backpackers",
    slug: "lakeside-backpackers-hub",
    name: "Lakeside Backpackers Hub",
    location: "Lakeside, Pokhara",
    district: "Kaski",
    spotId: "pokhara",
    pricePerNight: 1400,
    rating: 4.4,
    reviewCount: 198,
    amenities: ["Wi-Fi", "Shared kitchen", "Bike rental", "Common room"],
    images: [lakesideBackpackers, lakesideBackpackers],
    description:
      "Friendly budget hostel two blocks from Phewa Lake. Mixed dorms and private singles, daily group walks to Begnas and Sarangkot.",
    hostName: "Ramesh Bhandari",
    maxGuests: 2,
    bedType: "Twin / dorm bunk",
    checkIn: "12:00",
    checkOut: "10:00",
  },
  {
    id: "h-pokhara-boutique",
    slug: "annapurna-view-boutique",
    name: "Annapurna View Boutique",
    location: "Damside, Pokhara",
    district: "Kaski",
    spotId: "pokhara",
    pricePerNight: 6800,
    rating: 4.9,
    reviewCount: 154,
    amenities: ["Annapurna view", "Wi-Fi", "Spa", "Restaurant", "Bar"],
    images: [annapurnaBoutique, annapurnaBoutique],
    description:
      "Boutique twelve-room hideaway on the quieter Damside end of Phewa Lake. Floor-to-ceiling Annapurna views from the rooftop infinity pool.",
    hostName: "Rabina Shrestha",
    maxGuests: 2,
    bedType: "King",
    checkIn: "14:00",
    checkOut: "11:00",
  },
  {
    id: "h-sarangkot-sunrise",
    slug: "sarangkot-sunrise-lodge",
    name: "Sarangkot Sunrise Lodge",
    location: "Sarangkot Ridge",
    district: "Kaski",
    spotId: "sarangkot",
    pricePerNight: 5200,
    rating: 4.8,
    reviewCount: 176,
    amenities: ["Mountain view", "Sunrise deck", "Restaurant", "Heated rooms"],
    images: [sarangkotSunrise, sarangkotSunrise],
    description:
      "Ridge-top lodge two minutes from the Sarangkot viewpoint. Floor-to-ceiling glass facing Annapurna, Machhapuchhre, and Dhaulagiri at sunrise.",
    hostName: "Sunita Tamang",
    maxGuests: 3,
    bedType: "Queen + single",
    checkIn: "13:00",
    checkOut: "10:00",
  },
  {
    id: "h-ghandruk-heritage",
    slug: "ghandruk-heritage-homestay",
    name: "Ghandruk Heritage Homestay",
    location: "Ghandruk Village",
    district: "Kaski",
    spotId: "ghandruk",
    pricePerNight: 2400,
    rating: 4.7,
    reviewCount: 138,
    amenities: ["Mountain view", "Local meals", "Fireplace", "Cultural evenings"],
    images: [ghandrukHeritage, ghandrukHeritage],
    description:
      "Stone-and-slate Gurung family home in the heart of Ghandruk's heritage village. Daal-bhat, homemade rakshi welcome, and a panoramic Annapurna South balcony.",
    hostName: "Ama Sita Gurung",
    maxGuests: 4,
    bedType: "Two doubles",
    checkIn: "13:00",
    checkOut: "10:00",
  },
  {
    id: "h-ghandruk-ridge",
    slug: "annapurna-view-lodge-ghandruk",
    name: "Annapurna View Lodge, Ghandruk",
    location: "Upper Ghandruk Ridge",
    district: "Kaski",
    spotId: "ghandruk",
    pricePerNight: 4800,
    rating: 4.9,
    reviewCount: 92,
    amenities: ["Annapurna view", "Restaurant", "Hot shower", "Charging"],
    images: [ghandrukRidge, ghandrukRidge],
    description:
      "Ridge-top trekker lodge above Ghandruk village with the fullest Annapurna South panorama in the valley. Heated dining room and Gurung-led evening folk music.",
    hostName: "Chhewang Gurung",
    maxGuests: 2,
    bedType: "Twin",
    checkIn: "12:00",
    checkOut: "09:00",
  },
];

export function getHotel(slug: string): Hotel | undefined {
  return hotels.find((h) => h.slug === slug);
}

/** USD cents from NPR (rough fixed display rate 1 USD ≈ 133 NPR). Used for mock checkout amounts. */
export function nprToUsdCents(npr: number): number {
  return Math.max(50, Math.round((npr / 133) * 100));
}
