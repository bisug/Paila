"use client";

import { useMemo, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { navItems, navKeyFor } from "@/lib/data";
import { SosPanel } from "@/components/modals/SosPanel";
import { OfflineSyncModal } from "@/components/layout/OfflineSyncModal";
import {
  DesktopSidebar,
  LandscapeRail,
  MobileBottomNav,
  MobileDrawer,
  MobileHeader,
} from "@/components/layout/AppShellNavigation";

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
    const item = navItems.find((i) =>
      i.href === "/" ? pathname === "/" : pathname === i.href || pathname.startsWith(`${i.href}/`),
    );
    if (item) return t(`nav.${navKeyFor(item.href)}`, item.label);
    if (pathname.startsWith("/hotels") || pathname.startsWith("/booking")) {
      return t("nav.hotels", "Hotels");
    }
    if (pathname.startsWith("/guides") || pathname.startsWith("/guide")) {
      return t("nav.guides", "Guides");
    }
    if (pathname.startsWith("/profile")) return t("nav.profile", "Profile");
    return "";
  }, [pathname, t]);

  return (
    <div className="min-h-screen bg-stone-100 font-sans flex flex-col md:flex-row">
      <DesktopSidebar
        pathname={pathname}
        t={t}
        minimized={sidebarMinimized}
        isOffline={isOffline}
        onToggleMinimized={() => setSidebarMinimized(!sidebarMinimized)}
        onOpenSync={() => setSyncModalOpen(true)}
        onOpenSos={() => setSosOpen(true)}
      />

      <LandscapeRail pathname={pathname} t={t} onOpenSos={() => setSosOpen(true)} />

      <div className="flex-1 flex flex-col min-w-0 landscape-content-offset">
        <MobileHeader
          title={activeTitle}
          t={t}
          isOffline={isOffline}
          onOpenSync={() => setSyncModalOpen(true)}
          onOpenSos={() => setSosOpen(true)}
          onToggleDrawer={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 pb-20 md:pb-6 min-h-0">
          <div className="w-full h-full md:max-w-5xl xl:max-w-6xl md:mx-auto">{children}</div>
        </main>
      </div>

      <MobileBottomNav pathname={pathname} t={t} />

      {sidebarOpen && (
        <MobileDrawer
          pathname={pathname}
          t={t}
          onClose={() => setSidebarOpen(false)}
          onOpenSos={() => setSosOpen(true)}
        />
      )}

      {sosOpen && <SosPanel isOffline={isOffline} onClose={() => setSosOpen(false)} />}

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
