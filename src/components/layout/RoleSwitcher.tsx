"use client";

import { useUserRoles, type RoleType } from "@/hooks/use-user-roles";
import { SlidersHorizontal } from "lucide-react";

type RoleOption = {
  id: RoleType | "all";
  label: string;
};

const OPTIONS: RoleOption[] = [
  { id: "all", label: "All Access" },
  { id: "host", label: "Host" },
  { id: "guide", label: "Guide" },
  { id: "verifier", label: "Verifier" },
  { id: "admin", label: "Admin" },
  { id: "traveller", label: "Traveller" },
];

export function RoleSwitcher({ className = "" }: { className?: string }) {
  const { activeRole, setActiveRole, pendingHostBookingsCount, pendingGuideReviewsCount, roles } =
    useUserRoles();

  return (
    <div className={`rounded-2xl border border-border bg-card p-3 shadow-card ${className}`}>
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <SlidersHorizontal size={13} className="text-terracotta" />
          Perspective / Role Preview
        </span>
        <span className="text-[10px] font-medium text-muted-foreground">
          {roles.length} system role{roles.length === 1 ? "" : "s"}
        </span>
      </div>

      <div
        role="radiogroup"
        aria-label="Select active role view"
        className="grid grid-cols-3 sm:grid-cols-6 gap-1 rounded-xl bg-muted p-1"
      >
        {OPTIONS.map((opt) => {
          const isSelected = activeRole === opt.id;
          let badgeCount = 0;
          if (opt.id === "host") badgeCount = pendingHostBookingsCount;
          if (opt.id === "admin" || opt.id === "verifier") badgeCount = pendingGuideReviewsCount;

          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setActiveRole(opt.id)}
              className={`relative flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                isSelected
                  ? "bg-card text-foreground shadow-xs ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/50"
              }`}
            >
              <span>{opt.label}</span>
              {badgeCount > 0 && (
                <span className="h-4 min-w-[16px] px-1 rounded-full bg-terracotta text-white text-[9px] font-extrabold grid place-items-center">
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
