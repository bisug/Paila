"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Footprints,
  Shield,
  User,
  X,
  Menu,
  ChevronRight,
  ChevronLeft,
  Hotel as HotelIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { navItems, navKeyFor } from "@/lib/data";
import { SosPanel } from "@/components/modals/SosPanel";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SidebarGuidesGroup } from "@/components/layout/SidebarGuidesGroup";
import { OfflineSyncModal } from "@/components/layout/OfflineSyncModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [sosOpen, setSosOpen] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);

  const [isOnline, setIsOnline] = useState(true);
  const [forceOffline, setForceOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOnline(navigator.onLine);
    const savedForce = localStorage.getItem("force_offline") === "true";
    setForceOffline(savedForce);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const isOffline = forceOffline || !isOnline;

  const handleForceOfflineToggle = () => {
    const nextVal = !forceOffline;
    setForceOffline(nextVal);
    localStorage.setItem("force_offline", String(nextVal));
    window.dispatchEvent(new CustomEvent("offline_toggle", { detail: nextVal }));
  };

  const handleSyncNow = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1500);
  };

  const activeTitle = useMemo(() => {
    const item = navItems.find((i) => i.href === pathname);
    return item ? t(`nav.${navKeyFor(item.href)}`, item.label) : "";
  }, [pathname, t]);

  return (
    // Root: on mobile = full screen, on md+ = flex row-reverse (sidebar on right + content on left)
    <div className="min-h-screen bg-stone-100 font-sans flex flex-col md:flex-row-reverse">
      {/* ── DESKTOP / TABLET SIDEBAR ─────────────────────────────────────────
           Visible on md+ screens. Hidden on mobile portrait.
           Also shown as a rail in landscape (lsc:flex) via CSS media query.      */}
      <aside
        className={`
        hidden md:flex
        flex-col
        ${sidebarMinimized ? "md:w-20" : "md:w-64 lg:w-72"}
        md:min-h-screen
        bg-white border-l border-stone-200
        md:sticky md:top-0 md:h-screen md:overflow-y-auto
        z-40 shrink-0
        transition-all duration-300
      `}
      >
        {/* Sidebar brand */}
        <div
          className={`flex items-center ${sidebarMinimized ? "justify-center px-0" : "gap-3 px-5"} h-16 border-b border-stone-100 shrink-0`}
        >
          <button
            onClick={() => setSidebarMinimized(!sidebarMinimized)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-terracotta hover:bg-terracotta/90 transition-colors shadow-sm"
          >
            <Footprints size={16} className="text-white" />
          </button>
          {!sidebarMinimized && (
            <>
              <span className="text-lg font-bold text-stone-900 tracking-tight">Paila</span>
              {/* Sync badge */}
              <button
                onClick={() => setSyncModalOpen(true)}
                className={`ml-auto flex items-center gap-1 rounded-full px-2.5 py-1 border text-[10px] font-bold uppercase tracking-wider transition-all select-none ${
                  isOffline
                    ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                    : "bg-pine-tint border-pine/20 text-pine hover:bg-pine-tint/80"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${isOffline ? "bg-amber-500 animate-pulse" : "bg-pine"}`}
                />
                {isOffline ? t("status.offline") : t("status.online")}
              </button>
            </>
          )}
        </div>

        {/* Sidebar nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={sidebarMinimized ? t(`nav.${navKeyFor(item.href)}`, item.label) : undefined}
                className={`flex items-center ${sidebarMinimized ? "justify-center w-10 h-10 mx-auto" : "gap-3 px-3"} py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                  active
                    ? "bg-terracotta/10 text-terracotta"
                    : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                }`}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={
                    active ? "text-terracotta" : "text-stone-400 group-hover:text-stone-600"
                  }
                />
                {!sidebarMinimized && (
                  <>
                    <span>{t(`nav.${navKeyFor(item.href)}`, item.label)}</span>
                    {active && <ChevronLeft size={14} className="ml-auto text-terracotta/60" />}
                  </>
                )}
              </Link>
            );
          })}
          <Link
            href="/hotels"
            title={sidebarMinimized ? t("nav.hotels", "Hotels") : undefined}
            className={`flex items-center ${sidebarMinimized ? "justify-center w-10 h-10 mx-auto" : "gap-3 px-3"} py-2.5 rounded-xl text-sm font-semibold transition-all group ${
              pathname.startsWith("/hotels") || pathname.startsWith("/booking")
                ? "bg-terracotta/10 text-terracotta"
                : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"
            }`}
          >
            <HotelIcon
              size={20}
              strokeWidth={pathname.startsWith("/hotels") ? 2.5 : 1.8}
              className={
                pathname.startsWith("/hotels")
                  ? "text-terracotta"
                  : "text-stone-400 group-hover:text-stone-600"
              }
            />
            {!sidebarMinimized && <span>{t("nav.hotels", "Hotels")}</span>}
          </Link>
          <SidebarGuidesGroup variant="full" minimized={sidebarMinimized} />
        </nav>

        {/* Sidebar bottom: SOS + Profile + Language */}
        <div
          className={`px-3 py-4 border-t border-stone-100 shrink-0 ${sidebarMinimized ? "space-y-4 flex flex-col items-center" : "space-y-2"}`}
        >
          <button
            onClick={() => setSosOpen(true)}
            title={sidebarMinimized ? "Emergency SOS" : undefined}
            className={`flex items-center justify-center rounded-xl font-semibold text-red-600 hover:bg-red-50 transition-colors ${sidebarMinimized ? "h-10 w-10 p-0" : "w-full px-3 py-2.5 gap-3"}`}
          >
            <Shield size={20} strokeWidth={2} />
            {!sidebarMinimized && "Emergency SOS"}
          </button>
          <Link
            href="/profile"
            title={sidebarMinimized ? "Profile" : undefined}
            className={`flex items-center justify-center rounded-xl font-semibold text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors ${sidebarMinimized ? "h-10 w-10 p-0" : "w-full px-3 py-2.5 gap-3"}`}
          >
            <User size={20} strokeWidth={1.8} />
            {!sidebarMinimized && "Profile"}
          </Link>
          {!sidebarMinimized && (
            <div className="px-3 py-2">
              <LanguageSwitcher />
            </div>
          )}
        </div>
      </aside>

      {/* ── LANDSCAPE PHONE RAIL NAV ──────────────────────────────────────────
           Shown only in landscape on small screens (phones rotated).
           Uses CSS: @media (orientation: landscape) and (max-height: 500px)
           Applied via the `landscape-rail` class defined in globals.css        */}
      <aside className="landscape-rail hidden flex-col w-14 bg-white border-r border-stone-200 z-40 fixed top-0 left-0 h-full shrink-0">
        <div className="flex items-center justify-center h-11 border-b border-stone-100 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-terracotta">
            <Footprints size={13} className="text-white" />
          </div>
        </div>
        <nav className="flex-1 flex flex-col items-center py-2 gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={t(`nav.${navKeyFor(item.href)}`, item.label)}
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
            onClick={() => setSosOpen(true)}
            title="SOS"
            className="flex items-center justify-center w-10 h-10 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
          >
            <Shield size={18} strokeWidth={2} />
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT COLUMN ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 landscape-content-offset">
        {/* ── Top header ─────────────────────────────────────────────────────
             Mobile portrait: fixed at top, full width, 56px tall
             Desktop: static, 64px, part of the flex column
             Landscape phone: static, 44px compact                           */}
        <header
          className="
          sticky top-0 z-40
          bg-white/95 backdrop-blur-sm border-b border-stone-100
          flex items-center
          px-4 h-14 landscape-header
          md:h-16 md:px-6
        "
        >
          {/* Mobile logo (top-left, hidden on desktop — shown in sidebar) */}
          <div className="flex items-center gap-1.5 md:hidden">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-terracotta">
              <Footprints size={14} className="text-white" />
            </div>
            <span className="text-[15px] font-bold text-stone-900 tracking-tight">Paila</span>
            <button
              onClick={() => setSyncModalOpen(true)}
              className={`flex items-center gap-0.5 rounded-full px-1 py-[1px] border text-[7px] font-bold uppercase tracking-wider transition-all select-none ${
                isOffline
                  ? "bg-amber-50 border-amber-200 text-amber-700"
                  : "bg-pine-tint border-pine/20 text-pine"
              }`}
            >
              <span
                className={`h-[3px] w-[3px] rounded-full ${isOffline ? "bg-amber-500 animate-pulse" : "bg-pine"}`}
              />
              {isOffline ? t("status.offline") : t("status.online")}
            </button>
          </div>

          {/* Desktop: page title */}
          {activeTitle && (
            <span className="hidden md:block text-base font-bold text-stone-900">
              {activeTitle}
            </span>
          )}

          {/* Right side: SOS + Profile + Menu */}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setSosOpen(true)}
              className="md:hidden h-8 w-8 grid place-items-center rounded-full bg-red-600 text-white ring-2 ring-white shadow-sm hover:bg-red-700 transition-colors"
              aria-label={t("actions.sos")}
            >
              <Shield size={14} strokeWidth={2.5} />
            </button>
            {/* Mobile: hamburger moved to the right */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden h-8 w-8 flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 transition-colors"
              aria-label={t("actions.menu")}
            >
              <Menu size={20} />
            </button>
          </div>
        </header>

        {/* ── Page content ──────────────────────────────────────────────────── */}
        <main className="flex-1 pb-20 md:pb-6 min-h-0">
          {/* On desktop, constrain content width for readability */}
          <div className="w-full h-full md:max-w-5xl xl:max-w-6xl md:mx-auto">{children}</div>
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ─────────────────────────────────────────────────
           Only shown on mobile portrait. Hidden on md+ (sidebar), hidden
           in landscape small screens (rail nav handles it).                  */}
      <nav
        className="
          fixed bottom-0 left-0 right-0 z-30
          bg-white border-t border-stone-100
          md:hidden landscape-hide
        "
        style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}
      >
        <div className="grid grid-cols-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname != null && pathname === item.href;
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
                  {t(`nav.${navKeyFor(item.href)}`, item.label)}
                </span>
                {active && <span className="h-1 w-1 rounded-full bg-terracotta" />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── MOBILE DRAWER NAV (slide-in on hamburger) ─────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="absolute left-0 top-0 h-full w-64 bg-white shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 h-14 border-b border-stone-100">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-terracotta">
                <Footprints size={14} className="text-white" />
              </div>
              <span className="font-bold text-stone-900">Paila</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="ml-auto h-8 w-8 grid place-items-center rounded-lg text-stone-400 hover:bg-stone-100"
              >
                <X size={16} />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      active
                        ? "bg-terracotta/10 text-terracotta"
                        : "text-stone-500 hover:bg-stone-100"
                    }`}
                  >
                    <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                    {t(`nav.${navKeyFor(item.href)}`, item.label)}
                  </Link>
                );
              })}
              <Link
                href="/hotels"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  pathname.startsWith("/hotels")
                    ? "bg-terracotta/10 text-terracotta"
                    : "text-stone-500 hover:bg-stone-100"
                }`}
              >
                <HotelIcon size={20} strokeWidth={pathname.startsWith("/hotels") ? 2.5 : 1.8} />
                {t("nav.hotels", "Hotels")}
              </Link>
              <SidebarGuidesGroup variant="drawer" onNavigate={() => setSidebarOpen(false)} />
            </nav>
            <div className="px-3 py-4 border-t border-stone-100 space-y-2">
              <button
                onClick={() => {
                  setSosOpen(true);
                  setSidebarOpen(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
              >
                <Shield size={20} strokeWidth={2} />
                Emergency SOS
              </button>
              <Link
                href="/profile"
                onClick={() => setSidebarOpen(false)}
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
      )}

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {sosOpen && <SosPanel onClose={() => setSosOpen(false)} />}

      {syncModalOpen && (
        <OfflineSyncModal
          forceOffline={forceOffline}
          isOffline={isOffline}
          isSyncing={isSyncing}
          onClose={() => setSyncModalOpen(false)}
          onForceOfflineToggle={handleForceOfflineToggle}
          onSyncNow={handleSyncNow}
        />
      )}
    </div>
  );
}
