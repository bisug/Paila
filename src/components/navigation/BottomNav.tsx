import { navItems, navKeyFor } from "@/lib/data";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

export function BottomNav() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path || pathname?.startsWith(`${path}/`);

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-30 bg-white border-t border-stone-100"
      style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}
    >
      <div className="grid grid-cols-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const label = t(`nav.${navKeyFor(item.href)}`, item.label);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 py-2.5 transition-colors"
              aria-current={active ? "page" : undefined}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 1.8}
                className={active ? "text-terracotta" : "text-stone-400"}
              />
              <span
                className={`text-[10px] font-semibold leading-none ${active ? "text-terracotta" : "text-stone-400"}`}
              >
                {label}
              </span>
              {active && <span className="h-1 w-1 rounded-full bg-terracotta" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
