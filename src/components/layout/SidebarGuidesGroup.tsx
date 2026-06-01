import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, BadgeCheck, ClipboardCheck, ShieldCheck } from "lucide-react";
import { useGuideNav } from "@/hooks/use-guide-nav";

type Variant = "full" | "rail" | "drawer";

type Item = {
  href: string;
  label: string;
  icon: typeof Map;
  show: boolean;
  badge?: { text: string; tone: "amber" | "pine" | "red" | "terracotta" };
};

function toneClasses(tone: NonNullable<Item["badge"]>["tone"]) {
  switch (tone) {
    case "amber":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "pine":
      return "bg-pine-tint text-pine border-pine/20";
    case "red":
      return "bg-red-50 text-red-700 border-red-200";
    case "terracotta":
      return "bg-terracotta/10 text-terracotta border-terracotta/30";
  }
}

export function SidebarGuidesGroup({
  variant,
  minimized,
  onNavigate,
}: {
  variant: Variant;
  minimized?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { signedIn, isGuide, isAdmin, verificationStatus, pendingReviewCount } = useGuideNav();

  const verifBadge: Item["badge"] | undefined =
    verificationStatus === "pending"
      ? { text: "Pending", tone: "amber" as const }
      : verificationStatus === "approved"
        ? { text: "Approved", tone: "pine" as const }
        : verificationStatus === "rejected"
          ? { text: "Rejected", tone: "red" as const }
          : undefined;

  const items: Item[] = [
    { href: "/guides", label: "Browse Guides", icon: Map, show: true },
    {
      href: "/guide/verify",
      label: isGuide ? "Verification" : "Become a Guide",
      icon: BadgeCheck,
      show: signedIn,
      badge: isGuide ? verifBadge : undefined,
    },
    {
      href: "/admin/guides",
      label: "Review Submissions",
      icon: ShieldCheck,
      show: isAdmin,
      badge:
        pendingReviewCount > 0
          ? { text: String(pendingReviewCount), tone: "terracotta" as const }
          : undefined,
    },
  ].filter((i) => i.show);

  if (items.length === 0) return null;

  if (variant === "rail") {
    return (
      <>
        <div className="my-2 h-px w-8 bg-stone-200" />
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              onClick={onNavigate}
              className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
                active
                  ? "bg-terracotta/15 text-terracotta"
                  : "text-terracotta/70 hover:bg-terracotta/10"
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
              {item.badge && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-terracotta" />
              )}
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <>
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`relative flex items-center ${minimized ? "justify-center w-10 h-10 mx-auto" : "gap-3 px-3"} py-2.5 rounded-xl text-sm font-semibold transition-all group ${
              active
                ? "bg-terracotta/10 text-terracotta"
                : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"
            }`}
          >
            <Icon
              size={20}
              strokeWidth={active ? 2.5 : 1.8}
              className={active ? "text-terracotta" : "text-stone-400 group-hover:text-stone-600"}
            />
            {!minimized && (
              <>
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span
                    className={`ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${toneClasses(
                      item.badge.tone,
                    )}`}
                  >
                    {item.badge.text}
                  </span>
                )}
              </>
            )}
            {minimized && item.badge && (
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-terracotta" />
            )}
          </Link>
        );
      })}
    </>
  );
}
