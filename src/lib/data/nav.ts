import { Bus, Home, Languages, MapPinned, QrCode } from "lucide-react";

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
