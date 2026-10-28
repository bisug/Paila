"use client";

import { ShieldAlert, Hotel, Compass, ShieldCheck, Footprints } from "lucide-react";
import type { RoleType } from "@/hooks/use-user-roles";

type RoleBadgeProps = {
  role: RoleType | string;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
};

export function RoleBadge({ role, size = "sm", showIcon = true, className = "" }: RoleBadgeProps) {
  switch (role) {
    case "admin":
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 ${
            size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1"
          } ${className}`}
        >
          {showIcon && (
            <ShieldAlert
              size={size === "sm" ? 11 : 13}
              className="shrink-0 text-amber-700 dark:text-amber-400"
            />
          )}
          <span>Platform Admin</span>
        </span>
      );

    case "host":
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border bg-pine/10 text-pine border-pine/30 dark:bg-pine/20 dark:text-emerald-400 dark:border-pine/50 ${
            size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1"
          } ${className}`}
        >
          {showIcon && <Hotel size={size === "sm" ? 11 : 13} className="shrink-0" />}
          <span>Lodge Host</span>
        </span>
      );

    case "guide":
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800 ${
            size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1"
          } ${className}`}
        >
          {showIcon && (
            <Compass
              size={size === "sm" ? 11 : 13}
              className="shrink-0 text-sky-600 dark:text-sky-400"
            />
          )}
          <span>Certified Guide</span>
        </span>
      );

    case "verifier":
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 ${
            size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1"
          } ${className}`}
        >
          {showIcon && (
            <ShieldCheck
              size={size === "sm" ? 11 : 13}
              className="shrink-0 text-purple-600 dark:text-purple-400"
            />
          )}
          <span>District Verifier</span>
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700 ${
            size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1"
          } ${className}`}
        >
          {showIcon && (
            <Footprints size={size === "sm" ? 11 : 13} className="shrink-0 text-stone-500" />
          )}
          <span>Traveller</span>
        </span>
      );
  }
}
