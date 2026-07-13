"use client";

import Link from "next/link";
import type { TFunction } from "i18next";
import { ChevronRight, Footprints, Hotel as HotelIcon, Menu, Shield, User, X } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SidebarGuidesGroup } from "@/components/layout/SidebarGuidesGroup";
import { navItems, navKeyFor } from "@/lib/data";

type SyncState = {
  isOffline: boolean;
  onOpenSync: () => void;
};

type ShellNavProps = {
  pathname: string;
  t: TFunction;
};

type DesktopSidebarProps = ShellNavProps &
  SyncState & {
    minimized: boolean;
    onToggleMinimized: () => void;
    onOpenSos: () => void;
  };

type MobileHeaderProps = SyncState & {
  title: string;
  t: TFunction;
  onOpenSos: () => void;
  onToggleDrawer: () => void;
};

type MobileDrawerProps = ShellNavProps & {
  onClose: () => void;
  onOpenSos: () => void;
};

function routeActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function hotelActive(pathname: string) {
  return pathname.startsWith("/hotels") || pathname.startsWith("/booking");
}

function navLabel(t: TFunction, href: string, fallback: string) {
  return t(`nav.${navKeyFor(href)}`, fallback);
}

function SyncStatusBadge({
  isOffline,
  label,
  onOpenSync,
  compact = false,
}: SyncState & { compact?: boolean; label: string }) {
  return (
    <button
      onClick={onOpenSync}
      className={`flex items-center border font-bold uppercase tracking-wider transition-all select-none ${
        compact
          ? "gap-0.5 rounded-full px-1 py-[1px] text-[7px]"
          : "gap-1 rounded-full px-2.5 py-1 text-[10px] hover:bg-pine-tint/80"
      } ${
        isOffline
          ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
          : "bg-pine-tint border-pine/20 text-pine"
      }`}
    >
      <span
        className={`rounded-full ${
          compact ? "h-[3px] w-[3px]" : "h-1.5 w-1.5"
        } ${isOffline ? "bg-amber-500 animate-pulse" : "bg-pine"}`}
      />
      {label}
    </button>
  );
}

function DesktopNavItems({ pathname, t, minimized }: ShellNavProps & { minimized: boolean }) {
  return (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = routeActive(pathname, item.href);
        const label = navLabel(t, item.href, item.label);
        return (
          <Link
            key={item.href}
            href={item.href}
            title={minimized ? label : undefined}
            className={`flex items-center ${
              minimized ? "justify-center w-10 h-10 mx-auto" : "gap-3 px-3"
            } py-2.5 rounded-xl text-sm font-semibold transition-all group ${
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
                <span>{label}</span>
                {active && <ChevronRight size={14} className="ml-auto text-terracotta/60" />}
              </>
            )}
          </Link>
        );
      })}
      <Link
        href="/hotels"
        title={minimized ? t("nav.hotels", "Hotels") : undefined}
        className={`flex items-center ${
          minimized ? "justify-center w-10 h-10 mx-auto" : "gap-3 px-3"
        } py-2.5 rounded-xl text-sm font-semibold transition-all group ${
          hotelActive(pathname)
            ? "bg-terracotta/10 text-terracotta"
            : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"
        }`}
      >
        <HotelIcon
          size={20}
          strokeWidth={hotelActive(pathname) ? 2.5 : 1.8}
          className={
            hotelActive(pathname) ? "text-terracotta" : "text-stone-400 group-hover:text-stone-600"
          }
        />
        {!minimized && <span>{t("nav.hotels", "Hotels")}</span>}
      </Link>
    </>
  );
}

export function DesktopSidebar({
  pathname,
  t,
  minimized,
  isOffline,
  onToggleMinimized,
  onOpenSync,
  onOpenSos,
}: DesktopSidebarProps) {
  return (
    <aside
      className={`
        hidden md:flex
        flex-col
        ${minimized ? "md:w-20" : "md:w-64 lg:w-72"}
        md:min-h-screen
        bg-white border-r border-stone-200
        md:sticky md:top-0 md:h-screen md:overflow-y-auto
        z-40 shrink-0
        transition-all duration-300
      `}
    >
      <div
        className={`flex items-center ${minimized ? "justify-center px-0" : "gap-3 px-5"} h-16 border-b border-stone-100 shrink-0`}
      >
        <button
          onClick={onToggleMinimized}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-terracotta hover:bg-terracotta/90 transition-colors shadow-sm"
          aria-label={minimized ? "Expand navigation" : "Collapse navigation"}
        >
          <Footprints size={16} className="text-white" />
        </button>
        {!minimized && (
          <>
            <span className="text-lg font-bold text-stone-900 tracking-tight">Paila</span>
            <div className="ml-auto">
              <SyncStatusBadge
                isOffline={isOffline}
                label={isOffline ? t("status.offline") : t("status.online")}
                onOpenSync={onOpenSync}
              />
            </div>
          </>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <DesktopNavItems pathname={pathname} t={t} minimized={minimized} />
        <SidebarGuidesGroup variant="full" minimized={minimized} />
      </nav>

      <div
        className={`px-3 py-4 border-t border-stone-100 shrink-0 ${
          minimized ? "space-y-4 flex flex-col items-center" : "space-y-2"
        }`}
      >
        <button
          onClick={onOpenSos}
          title={minimized ? "Emergency SOS" : undefined}
          className={`flex items-center justify-center rounded-xl font-semibold text-red-600 hover:bg-red-50 transition-colors ${
            minimized ? "h-10 w-10 p-0" : "w-full px-3 py-2.5 gap-3"
          }`}
        >
          <Shield size={20} strokeWidth={2} />
          {!minimized && "Emergency SOS"}
        </button>
        <Link
          href="/profile"
          title={minimized ? "Profile" : undefined}
          className={`flex items-center justify-center rounded-xl font-semibold text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors ${
            minimized ? "h-10 w-10 p-0" : "w-full px-3 py-2.5 gap-3"
          }`}
        >
          <User size={20} strokeWidth={1.8} />
          {!minimized && "Profile"}
        </Link>
        {!minimized && (
          <div className="px-3 py-2">
            <LanguageSwitcher />
          </div>
        )}
      </div>
    </aside>
  );
}

export function LandscapeRail({
  pathname,
  t,
  onOpenSos,
}: ShellNavProps & { onOpenSos: () => void }) {
  return (
    <aside className="landscape-rail hidden flex-col w-14 bg-white border-r border-stone-200 z-40 fixed top-0 left-0 h-full shrink-0">
      <div className="flex items-center justify-center h-11 border-b border-stone-100 shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-terracotta">
          <Footprints size={13} className="text-white" />
        </div>
      </div>
      <nav className="flex-1 flex flex-col items-center py-2 gap-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = routeActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={navLabel(t, item.href, item.label)}
              className={`flex flex-col items-center justify-center w-10 h-10 rounded-xl transition-colors ${
                active ? "bg-terracotta/10 text-terracotta" : "text-stone-400 hover:bg-stone-100"
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
            </Link>
          );
        })}
        <SidebarGuidesGroup variant="rail" />
      </nav>
      <div className="flex flex-col items-center pb-2 gap-1 shrink-0">
        <button
          onClick={onOpenSos}
          title="SOS"
          className="flex items-center justify-center w-10 h-10 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
        >
          <Shield size={18} strokeWidth={2} />
        </button>
      </div>
    </aside>
  );
}

export function MobileHeader({
  title,
  t,
  isOffline,
  onOpenSync,
  onOpenSos,
  onToggleDrawer,
}: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-stone-100 flex items-center px-4 h-14 landscape-header md:h-16 md:px-6">
      <div className="flex items-center gap-1.5 md:hidden">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-terracotta">
          <Footprints size={14} className="text-white" />
        </div>
        <span className="text-[15px] font-bold text-stone-900 tracking-tight">Paila</span>
        <SyncStatusBadge
          isOffline={isOffline}
          label={isOffline ? t("status.offline") : t("status.online")}
          onOpenSync={onOpenSync}
          compact
        />
      </div>

      {title && <span className="hidden md:block text-base font-bold text-stone-900">{title}</span>}

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onOpenSos}
          className="md:hidden h-8 w-8 grid place-items-center rounded-full bg-red-600 text-white ring-2 ring-white shadow-sm hover:bg-red-700 transition-colors"
          aria-label={t("actions.sos")}
        >
          <Shield size={14} strokeWidth={2.5} />
        </button>
        <button
          onClick={onToggleDrawer}
          className="md:hidden h-8 w-8 flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 transition-colors"
          aria-label={t("actions.menu")}
        >
          <Menu size={20} />
        </button>
      </div>
    </header>
  );
}

export function MobileBottomNav({ pathname, t }: ShellNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-stone-100 md:hidden landscape-hide"
      style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}
    >
      <div className="grid grid-cols-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = routeActive(pathname, item.href);
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
                className={`text-[10px] font-semibold leading-none ${
                  active ? "text-terracotta" : "text-stone-400"
                }`}
              >
                {navLabel(t, item.href, item.label)}
              </span>
              {active && <span className="h-1 w-1 rounded-full bg-terracotta" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileDrawer({ pathname, t, onClose, onOpenSos }: MobileDrawerProps) {
  return (
    <div className="fixed inset-0 z-50 md:hidden" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="absolute left-0 top-0 h-full w-64 bg-white shadow-tactile flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5 h-14 border-b border-stone-100">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-terracotta">
            <Footprints size={14} className="text-white" />
          </div>
          <span className="font-bold text-stone-900">Paila</span>
          <button
            onClick={onClose}
            className="ml-auto h-8 w-8 grid place-items-center rounded-lg text-stone-400 hover:bg-stone-100"
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = routeActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active ? "bg-terracotta/10 text-terracotta" : "text-stone-500 hover:bg-stone-100"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                {navLabel(t, item.href, item.label)}
              </Link>
            );
          })}
          <Link
            href="/hotels"
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              hotelActive(pathname)
                ? "bg-terracotta/10 text-terracotta"
                : "text-stone-500 hover:bg-stone-100"
            }`}
          >
            <HotelIcon size={20} strokeWidth={hotelActive(pathname) ? 2.5 : 1.8} />
            {t("nav.hotels", "Hotels")}
          </Link>
          <SidebarGuidesGroup variant="drawer" onNavigate={onClose} />
        </nav>
        <div className="px-3 py-4 border-t border-stone-100 space-y-2">
          <button
            onClick={() => {
              onOpenSos();
              onClose();
            }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            <Shield size={20} strokeWidth={2} />
            Emergency SOS
          </button>
          <Link
            href="/profile"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors"
          >
            <User size={20} strokeWidth={1.8} />
            Profile
          </Link>
          <div className="px-3 py-2">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </div>
  );
}
