"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import type { TFunction } from "i18next";
import {
  Bell,
  ChevronRight,
  Footprints,
  HeartHandshake,
  Hotel as HotelIcon,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  User,
  X,
  Building2,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SidebarGuidesGroup } from "@/components/layout/SidebarGuidesGroup";
import { RoleBadge } from "@/components/layout/RoleBadge";
import { useUserRoles } from "@/hooks/use-user-roles";
import { supabase } from "@/integrations/supabase/client";
import { navItems, navKeyFor } from "@/lib/data";
import { NOTIFICATIONS_CHANGED_EVENT } from "@/lib/notifications";

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

function impactActive(pathname: string) {
  return pathname.startsWith("/impact");
}

function navLabel(t: TFunction, href: string, fallback: string) {
  return t(`nav.${navKeyFor(href)}`, fallback);
}

function useUnreadCount() {
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("read", false);
      if (!cancelled) setUnread(count ?? 0);
    };
    void load();
    // The notifications page owns the writes, so it tells us when to re-count
    // instead of the badge polling forever to stay in sync.
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, load);
    };
  }, []);
  return unread;
}

function NotificationsBell({ t, label }: { t: TFunction; label?: string }) {
  const unread = useUnreadCount();
  return (
    <Link
      href="/notifications"
      aria-label={t("nav.notifications", "Notifications")}
      title={label ?? t("nav.notifications", "Notifications")}
      className="relative grid h-11 w-11 place-items-center rounded-lg text-stone-500 hover:bg-stone-100 transition-colors"
    >
      <Bell size={20} strokeWidth={1.8} />
      {unread > 0 && (
        <span className="absolute top-1.5 right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[11px] font-bold leading-none text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}

function SyncStatusBadge({
  isOffline,
  label,
  onOpenSync,
  compact = false,
}: SyncState & { compact?: boolean; label: string }) {
  if (compact) {
    return (
      <button
        onClick={onOpenSync}
        aria-label={label}
        title={label}
        className="grid h-10 w-10 place-items-center rounded-xl transition-colors hover:bg-stone-100 text-stone-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
      >
        <span
          className={`h-2.5 w-2.5 rounded-full ${isOffline ? "bg-amber-500 animate-pulse" : "bg-pine"}`}
        />
      </button>
    );
  }
  return (
    <button
      onClick={onOpenSync}
      className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-all select-none ${
        isOffline
          ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
          : "bg-pine-tint border-pine/20 text-pine hover:bg-pine-tint/80"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isOffline ? "bg-amber-500 animate-pulse" : "bg-pine"}`}
      />
      {label}
    </button>
  );
}

function DesktopNavItems({ pathname, t, minimized }: ShellNavProps & { minimized: boolean }) {
  const { isHost, pendingHostBookingsCount } = useUserRoles();
  const isHostBookingsActive = pathname.startsWith("/profile/bookings");

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
            className={`relative flex items-center ${
              minimized ? "justify-center w-11 h-11 mx-auto" : "gap-3 px-3.5"
            } py-2.5 rounded-xl text-sm font-semibold transition-all group ${
              active
                ? "bg-terracotta/10 text-terracotta font-bold"
                : "text-stone-600 hover:bg-stone-100/80 hover:text-stone-900"
            }`}
          >
            {active && !minimized && (
              <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-terracotta" />
            )}
            <Icon
              size={20}
              strokeWidth={active ? 2.5 : 1.8}
              className={active ? "text-terracotta" : "text-stone-500 group-hover:text-stone-700"}
            />
            {!minimized && (
              <>
                <span className="truncate">{label}</span>
                {active && <ChevronRight size={14} className="ml-auto text-terracotta/60" />}
              </>
            )}
          </Link>
        );
      })}
      <Link
        href="/hotels"
        title={minimized ? t("nav.hotels", "Hotels") : undefined}
        className={`relative flex items-center ${
          minimized ? "justify-center w-11 h-11 mx-auto" : "gap-3 px-3.5"
        } py-2.5 rounded-xl text-sm font-semibold transition-all group ${
          hotelActive(pathname)
            ? "bg-terracotta/10 text-terracotta font-bold"
            : "text-stone-600 hover:bg-stone-100/80 hover:text-stone-900"
        }`}
      >
        {hotelActive(pathname) && !minimized && (
          <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-terracotta" />
        )}
        <HotelIcon
          size={20}
          strokeWidth={hotelActive(pathname) ? 2.5 : 1.8}
          className={
            hotelActive(pathname) ? "text-terracotta" : "text-stone-500 group-hover:text-stone-700"
          }
        />
        {!minimized && (
          <>
            <span className="truncate">{t("nav.hotels", "Hotels")}</span>
            {hotelActive(pathname) && (
              <ChevronRight size={14} className="ml-auto text-terracotta/60" />
            )}
          </>
        )}
      </Link>
      <Link
        href="/impact"
        title={minimized ? t("nav.impact", "Impact") : undefined}
        className={`relative flex items-center ${
          minimized ? "justify-center w-11 h-11 mx-auto" : "gap-3 px-3.5"
        } py-2.5 rounded-xl text-sm font-semibold transition-all group ${
          impactActive(pathname)
            ? "bg-terracotta/10 text-terracotta font-bold"
            : "text-stone-600 hover:bg-stone-100/80 hover:text-stone-900"
        }`}
      >
        {impactActive(pathname) && !minimized && (
          <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-terracotta" />
        )}
        <HeartHandshake
          size={20}
          strokeWidth={impactActive(pathname) ? 2.5 : 1.8}
          className={
            impactActive(pathname) ? "text-terracotta" : "text-stone-500 group-hover:text-stone-700"
          }
        />
        {!minimized && (
          <>
            <span className="truncate">{t("nav.impact", "Impact")}</span>
            {impactActive(pathname) && (
              <ChevronRight size={14} className="ml-auto text-terracotta/60" />
            )}
          </>
        )}
      </Link>
      {isHost && (
        <Link
          href="/profile/bookings?tab=host"
          title={minimized ? "Host Reservations" : undefined}
          className={`relative flex items-center ${
            minimized ? "justify-center w-11 h-11 mx-auto" : "gap-3 px-3.5"
          } py-2.5 rounded-xl text-sm font-semibold transition-all group ${
            isHostBookingsActive
              ? "bg-pine/10 text-pine font-bold"
              : "text-stone-600 hover:bg-stone-100/80 hover:text-stone-900"
          }`}
        >
          {isHostBookingsActive && !minimized && (
            <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-pine" />
          )}
          <Building2
            size={20}
            strokeWidth={isHostBookingsActive ? 2.5 : 1.8}
            className={
              isHostBookingsActive ? "text-pine" : "text-stone-500 group-hover:text-stone-700"
            }
          />
          {!minimized && (
            <>
              <span className="truncate">Host Stays</span>
              {pendingHostBookingsCount > 0 ? (
                <span className="ml-auto rounded-full bg-terracotta text-white text-[10px] font-bold px-1.5 py-0.5">
                  {pendingHostBookingsCount}
                </span>
              ) : isHostBookingsActive ? (
                <ChevronRight size={14} className="ml-auto text-pine/60" />
              ) : null}
            </>
          )}
        </Link>
      )}
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
  const { roles, activeRole } = useUserRoles();
  const currentRole = activeRole === "all" ? roles[0] || "traveller" : activeRole;

  return (
    <aside
      className={`
        hidden md:flex landscape-hide
        flex-col
        ${minimized ? "md:w-20" : "md:w-64 lg:w-72"}
        md:min-h-screen
        bg-card border-r border-border
        md:sticky md:top-0 md:h-screen md:overflow-y-auto
        z-40 shrink-0
        transition-all duration-300
      `}
    >
      <div
        className={`flex items-center ${minimized ? "justify-center px-0 flex-col gap-2 pt-3" : "gap-3 px-5"} h-16 border-b border-border shrink-0`}
      >
        <button
          onClick={onToggleMinimized}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-terracotta hover:bg-terracotta/90 transition-all shadow-xs active:scale-95"
          aria-label={minimized ? "Expand navigation" : "Collapse navigation"}
          title={minimized ? "Expand sidebar" : "Paila"}
        >
          <Footprints size={18} className="text-white" />
        </button>
        {!minimized ? (
          <>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-foreground tracking-tight leading-none">
                Paila
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mt-0.5">
                Nepal
              </span>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <SyncStatusBadge
                isOffline={isOffline}
                label={isOffline ? t("status.offline") : t("status.online")}
                onOpenSync={onOpenSync}
              />
              <button
                onClick={onToggleMinimized}
                className="grid h-8 w-8 place-items-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
              >
                <PanelLeftClose size={16} />
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={onToggleMinimized}
            className="grid h-7 w-7 place-items-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <PanelLeftOpen size={15} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <DesktopNavItems pathname={pathname} t={t} minimized={minimized} />
        <SidebarGuidesGroup variant="full" minimized={minimized} />
      </nav>

      <div
        className={`px-3 py-4 border-t border-stone-100 shrink-0 ${
          minimized ? "space-y-3 flex flex-col items-center" : "space-y-2"
        }`}
      >
        <button
          onClick={onOpenSos}
          title={minimized ? "Emergency SOS" : undefined}
          className={`flex items-center justify-center rounded-xl font-bold transition-all ${
            minimized
              ? "h-10 w-10 p-0 bg-red-50 text-red-600 hover:bg-red-100 ring-1 ring-red-200"
              : "w-full px-3.5 py-2.5 gap-3 bg-red-50/80 text-red-600 hover:bg-red-100/80 border border-red-200/60 shadow-xs active:scale-[0.98]"
          }`}
        >
          <Shield size={18} strokeWidth={2.2} />
          {!minimized && <span>Emergency SOS</span>}
        </button>
        <Link
          href="/profile"
          title={minimized ? "Profile" : undefined}
          className={`flex items-center justify-center rounded-xl font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors ${
            minimized ? "h-10 w-10 p-0" : "w-full px-3 py-2.5 gap-3"
          }`}
        >
          <User size={19} strokeWidth={1.8} />
          {!minimized && <span>Profile</span>}
        </Link>
        {!minimized && (
          <div className="px-3 py-1 flex items-center justify-between border-t border-border/50 pt-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Role
            </span>
            <RoleBadge role={currentRole} size="sm" />
          </div>
        )}
        {!minimized && (
          <div className="px-3 py-1.5 pt-1">
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
        <Link
          href="/"
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-terracotta hover:bg-terracotta/90 transition-all shadow-xs"
          title="Paila Home"
          aria-label="Paila Home"
        >
          <Footprints size={14} className="text-white" />
        </Link>
      </div>
      <nav className="flex-1 flex flex-col items-center py-1.5 gap-1 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = routeActive(pathname, item.href);
          const label = navLabel(t, item.href, item.label);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={label}
              aria-label={label}
              className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
                active ? "bg-terracotta/10 text-terracotta" : "text-stone-500 hover:bg-stone-100"
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
            </Link>
          );
        })}
        <Link
          href="/hotels"
          title={t("nav.hotels", "Hotels")}
          aria-label={t("nav.hotels", "Hotels")}
          className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
            hotelActive(pathname)
              ? "bg-terracotta/10 text-terracotta"
              : "text-stone-500 hover:bg-stone-100"
          }`}
        >
          <HotelIcon size={18} strokeWidth={hotelActive(pathname) ? 2.5 : 1.8} />
        </Link>
        <Link
          href="/impact"
          title={t("nav.impact", "Impact")}
          aria-label={t("nav.impact", "Impact")}
          className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
            impactActive(pathname)
              ? "bg-terracotta/10 text-terracotta"
              : "text-stone-500 hover:bg-stone-100"
          }`}
        >
          <HeartHandshake size={18} strokeWidth={impactActive(pathname) ? 2.5 : 1.8} />
        </Link>
        <SidebarGuidesGroup variant="rail" />
      </nav>
      <div className="flex flex-col items-center pb-2 gap-1 shrink-0 border-t border-stone-100 pt-1.5">
        <Link
          href="/profile"
          title={t("nav.profile", "Profile")}
          aria-label={t("nav.profile", "Profile")}
          className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
            routeActive(pathname, "/profile")
              ? "bg-terracotta/10 text-terracotta"
              : "text-stone-500 hover:bg-stone-100"
          }`}
        >
          <User size={18} strokeWidth={routeActive(pathname, "/profile") ? 2.5 : 1.8} />
        </Link>
        <button
          onClick={onOpenSos}
          title={t("actions.sos", "Emergency SOS")}
          aria-label={t("actions.sos", "Emergency SOS")}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 ring-1 ring-red-200 transition-colors"
        >
          <Shield size={18} strokeWidth={2.2} />
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
  onToggleDrawer,
}: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border flex items-center px-4 h-14 landscape-header md:h-16 md:px-6">
      {/* Mobile portrait brand & title */}
      <div className="flex items-center gap-2 md:hidden min-w-0 landscape-hide">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-terracotta shadow-xs">
          <Footprints size={14} className="text-white" />
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[15px] font-bold text-foreground tracking-tight shrink-0">
            Paila
          </span>
          {title && title !== "Home" && (
            <>
              <span className="text-muted-foreground/40">/</span>
              <span className="text-xs font-semibold text-muted-foreground truncate">{title}</span>
            </>
          )}
        </div>
        <SyncStatusBadge
          isOffline={isOffline}
          label={isOffline ? t("status.offline") : t("status.online")}
          onOpenSync={onOpenSync}
          compact
        />
      </div>

      {/* Landscape mobile & standard desktop title */}
      <div className="hidden md:flex landscape-show-flex items-center gap-2 min-w-0">
        <span className="text-sm md:text-base font-bold text-foreground truncate">
          {title || "Paila"}
        </span>
        <div className="md:hidden landscape-show-flex">
          <SyncStatusBadge
            isOffline={isOffline}
            label={isOffline ? t("status.offline") : t("status.online")}
            onOpenSync={onOpenSync}
            compact
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <NotificationsBell t={t} />
        <button
          onClick={onToggleDrawer}
          className="md:hidden landscape-show-flex h-9 w-9 md:h-10 md:w-10 flex items-center justify-center rounded-xl text-stone-600 hover:bg-stone-100 transition-colors"
          aria-label={t("actions.menu")}
        >
          <Menu size={20} />
        </button>
      </div>
    </header>
  );
}

export function MobileSosFab({
  t,
  onOpenSos,
  isDetail = false,
}: {
  t: TFunction;
  onOpenSos: () => void;
  isDetail?: boolean;
}) {
  return (
    <button
      onClick={onOpenSos}
      className="md:hidden landscape-hide fixed right-4 z-40 h-13 w-13 grid place-items-center rounded-full bg-red-600 text-white shadow-float ring-2 ring-red-100 hover:bg-red-700 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-red-400"
      aria-label={t("actions.sos")}
      style={{
        bottom: isDetail
          ? "calc(9.5rem + max(0px, env(safe-area-inset-bottom)))"
          : "calc(4.75rem + max(0px, env(safe-area-inset-bottom)))",
      }}
    >
      <Shield size={20} strokeWidth={2.4} />
    </button>
  );
}

export function MobileBottomNav({ pathname, t }: ShellNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-card/95 backdrop-blur-md border-t border-border md:hidden landscape-hide"
      style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}
    >
      <div
        className="grid items-center h-16"
        style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = routeActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 px-1 transition-all ${
                active ? "text-terracotta" : "text-muted-foreground hover:text-foreground"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <div
                className={`flex items-center justify-center w-10 h-7 rounded-full transition-all ${
                  active ? "bg-terracotta/12 text-terracotta" : "text-muted-foreground"
                }`}
              >
                <Icon size={19} strokeWidth={active ? 2.4 : 1.8} />
              </div>
              <span
                className={`text-[11px] font-semibold leading-tight tracking-tight truncate max-w-full px-0.5 ${
                  active ? "text-terracotta font-bold" : "text-muted-foreground"
                }`}
              >
                {navLabel(t, item.href, item.label)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileDrawer({ pathname, t, onClose, onOpenSos }: MobileDrawerProps) {
  const { roles, activeRole, isHost, pendingHostBookingsCount } = useUserRoles();
  const currentRole = activeRole === "all" ? roles[0] || "traveller" : activeRole;

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          onInteractOutside={(e) => e.preventDefault()}
          className="fixed right-0 top-0 z-50 h-full w-68 max-w-[85vw] bg-card shadow-tactile flex flex-col"
        >
          <div className="flex items-center gap-3 px-5 h-16 border-b border-border">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-terracotta shadow-xs">
              <Footprints size={16} className="text-white" />
            </div>
            <Dialog.Title asChild>
              <div className="flex flex-col">
                <span className="font-bold text-foreground tracking-tight leading-none">Paila</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mt-0.5">
                  Nepal
                </span>
              </div>
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="ml-auto h-10 w-10 grid place-items-center rounded-xl text-stone-500 hover:bg-stone-100 transition-colors"
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = routeActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? "bg-terracotta/10 text-terracotta font-bold"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  <Icon
                    size={19}
                    strokeWidth={active ? 2.5 : 1.8}
                    className={active ? "text-terracotta" : "text-stone-500"}
                  />
                  {navLabel(t, item.href, item.label)}
                </Link>
              );
            })}
            <Link
              href="/hotels"
              onClick={onClose}
              className={`flex items-center gap-3 px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold transition-all ${
                hotelActive(pathname)
                  ? "bg-terracotta/10 text-terracotta font-bold"
                  : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              <HotelIcon
                size={19}
                strokeWidth={hotelActive(pathname) ? 2.5 : 1.8}
                className={hotelActive(pathname) ? "text-terracotta" : "text-stone-500"}
              />
              {t("nav.hotels", "Hotels")}
            </Link>
            <Link
              href="/impact"
              onClick={onClose}
              className={`flex items-center gap-3 px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold transition-all ${
                impactActive(pathname)
                  ? "bg-terracotta/10 text-terracotta font-bold"
                  : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              <HeartHandshake
                size={19}
                strokeWidth={impactActive(pathname) ? 2.5 : 1.8}
                className={impactActive(pathname) ? "text-terracotta" : "text-stone-500"}
              />
              {t("nav.impact", "Impact")}
            </Link>
            {isHost && (
              <Link
                href="/profile/bookings?tab=host"
                onClick={onClose}
                className="flex items-center gap-3 px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-100"
              >
                <Building2 size={19} className="text-stone-500" />
                <span>Host Stays</span>
                {pendingHostBookingsCount > 0 && (
                  <span className="ml-auto rounded-full bg-terracotta text-white text-[10px] font-bold px-1.5 py-0.5">
                    {pendingHostBookingsCount}
                  </span>
                )}
              </Link>
            )}
            <SidebarGuidesGroup variant="drawer" onNavigate={onClose} />
          </nav>
          <div className="px-3 py-4 border-t border-border space-y-2">
            <div className="px-3 py-1 flex items-center justify-between pb-2 border-b border-border/50">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Active Role
              </span>
              <RoleBadge role={currentRole} size="sm" />
            </div>
            <button
              onClick={() => {
                onOpenSos();
                onClose();
              }}
              className="flex items-center gap-3 w-full px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm font-bold bg-red-50 text-red-600 border border-red-200/60 hover:bg-red-100 transition-colors"
            >
              <Shield size={19} strokeWidth={2.2} />
              Emergency SOS
            </button>
            <Link
              href="/profile"
              onClick={onClose}
              className="flex items-center gap-3 px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors"
            >
              <User size={19} strokeWidth={1.8} />
              Profile
            </Link>
            <div className="px-3 py-2">
              <LanguageSwitcher />
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
