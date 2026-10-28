"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  User as UserIcon,
  Settings,
  LogOut,
  ChevronRight,
  BookOpen,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Bell,
  ShieldAlert,
  Hotel as HotelIcon,
  Building2,
  Compass,
  QrCode,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRoles } from "@/hooks/use-user-roles";
import { RoleBadge } from "@/components/layout/RoleBadge";
import { RoleSwitcher } from "@/components/layout/RoleSwitcher";
import { PermitQrModal } from "@/components/modals/PermitQrModal";
import { SEED_PERMITS, type TrekkingPermit } from "@/lib/permits";

export default function ProfileMenu() {
  const router = useRouter();
  const {
    user,
    loading: rolesLoading,
    roles,
    isAdmin,
    isHost,
    isGuide,
    isVerifier,
    pendingHostBookingsCount,
    pendingGuideReviewsCount,
    verificationStatus,
  } = useUserRoles();

  const [unread, setUnread] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState<TrekkingPermit | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { count } = await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("read", false);

        if (mounted) setUnread(count ?? 0);
      } catch (err) {
        console.error("Notifications count error:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.refresh();
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
      setLoggingOut(false);
    }
  }

  if (rolesLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return null;

  const identifier = user.email || user.phone || "Traveller";
  const meta = user.user_metadata || {};
  const isProfileIncomplete = !meta.first_name;

  return (
    <div className="min-h-screen bg-background px-4 pt-5 pb-28 md:max-w-2xl md:mx-auto">
      {selectedPermit && (
        <PermitQrModal permit={selectedPermit} open onClose={() => setSelectedPermit(null)} />
      )}
      {isProfileIncomplete && (
        <Link
          href="/profile/account"
          className="mb-6 flex items-start gap-3 rounded-xl bg-orange-50 p-4 border border-orange-200 hover:bg-orange-100 transition-colors shadow-sm"
        >
          <AlertTriangle size={18} className="text-orange-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-orange-900 leading-snug">
              Your profile is incomplete
            </p>
            <p className="text-xs font-medium text-orange-700 mt-0.5">
              Add your name, age and details.
            </p>
          </div>
          <ChevronRight size={16} className="text-orange-400 ml-auto mt-2" />
        </Link>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Menu</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Signed in as {identifier}</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
          {roles.map((r) => (
            <RoleBadge key={r} role={r} size="sm" />
          ))}
        </div>
      </div>

      {/* Role Switcher (Preview perspectives) */}
      <RoleSwitcher className="mb-6" />

      <div className="space-y-6">
        {/* ── Host Portal Section ────────────────────────────── */}
        {isHost && (
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 ml-2 flex items-center justify-between">
              <span>Host Management</span>
              {pendingHostBookingsCount > 0 && (
                <span className="text-terracotta text-[10px] font-bold">
                  {pendingHostBookingsCount} action required
                </span>
              )}
            </h2>
            <div className="rounded-card bg-card border border-border shadow-card overflow-hidden">
              <Link
                href="/profile/bookings?tab=host"
                className="flex items-center gap-3 p-4 hover:bg-muted transition-colors border-b border-border"
              >
                <div className="h-10 w-10 rounded-xl bg-pine/10 text-pine grid place-items-center shrink-0">
                  <Building2 size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground">Host Reservations</p>
                    {pendingHostBookingsCount > 0 && (
                      <span className="rounded-full bg-terracotta text-white text-[10px] font-extrabold px-1.5 py-0.2">
                        {pendingHostBookingsCount} pending
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Review and confirm guest stays at your lodge
                  </p>
                </div>
                <ChevronRight size={18} className="text-stone-300" />
              </Link>
            </div>
          </div>
        )}

        {/* ── Guide Center Section ────────────────────────────── */}
        {isGuide && (
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 ml-2">
              Guide Center
            </h2>
            <div className="rounded-card bg-card border border-border shadow-card overflow-hidden">
              <Link
                href="/guide/verify"
                className="flex items-center gap-3 p-4 hover:bg-muted transition-colors border-b border-border"
              >
                <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-700 grid place-items-center shrink-0">
                  <Compass size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground">Verification & License</p>
                    {verificationStatus && (
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          verificationStatus === "approved"
                            ? "bg-pine/10 text-pine border-pine/30"
                            : verificationStatus === "pending"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {verificationStatus}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    NTB credentials, guiding regions and status
                  </p>
                </div>
                <ChevronRight size={18} className="text-stone-300" />
              </Link>
            </div>
          </div>
        )}

        {/* ── Verifier Tools Section ────────────────────────────── */}
        {isVerifier && (
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 ml-2">
              Checkpoint Tools
            </h2>
            <div className="rounded-card bg-card border border-border shadow-card overflow-hidden">
              <Link
                href="/scan"
                className="flex items-center gap-3 p-4 hover:bg-muted transition-colors border-b border-border"
              >
                <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-700 grid place-items-center shrink-0">
                  <QrCode size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">Checkpoint Permit Scanner</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Scan trekker permits & NTB guide QR codes offline
                  </p>
                </div>
                <ChevronRight size={18} className="text-stone-300" />
              </Link>
            </div>
          </div>
        )}

        {/* ── Admin Oversight Section ─────────────────────────── */}
        {isAdmin && (
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 ml-2">
              Platform Administration
            </h2>
            <div className="rounded-card bg-card border border-border shadow-card overflow-hidden">
              <Link
                href="/admin/guides"
                className="flex items-center gap-3 p-4 hover:bg-muted transition-colors border-b border-border"
              >
                <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 grid place-items-center shrink-0">
                  <ShieldAlert size={18} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground">
                      Guide Reviews & Verification
                    </p>
                    {pendingGuideReviewsCount > 0 && (
                      <span className="rounded-full bg-terracotta text-white text-[10px] font-extrabold px-1.5 py-0.2">
                        {pendingGuideReviewsCount} pending
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Approve or reject guide license submissions
                  </p>
                </div>
                <ChevronRight size={18} className="text-stone-300" />
              </Link>
            </div>
          </div>
        )}

        {/* ── General Account Section ─────────────────────────── */}
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 ml-2">
            Account & Trips
          </h2>
          <div className="rounded-card bg-card border border-border shadow-card overflow-hidden">
            <Link
              href="/profile/account"
              className="flex items-center gap-3 p-4 hover:bg-muted transition-colors border-b border-border"
            >
              <div className="h-10 w-10 rounded-xl bg-terracotta/10 text-terracotta grid place-items-center shrink-0">
                <UserIcon size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Profile & Details</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  View your impact, roles and info
                </p>
              </div>
              <ChevronRight size={18} className="text-stone-300" />
            </Link>
            <button
              type="button"
              onClick={() => setSelectedPermit(SEED_PERMITS[0])}
              className="w-full flex items-center gap-3 p-4 hover:bg-muted transition-colors border-b border-border text-left"
            >
              <div className="h-10 w-10 rounded-xl bg-pine/10 text-pine grid place-items-center shrink-0">
                <QrCode size={18} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-foreground">Digital Permits (TIMS / ACAP)</p>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-pine/10 text-pine border border-pine/30">
                    Offline Valid
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Show cryptographic QR pass for trail checkpoints
                </p>
              </div>
              <ChevronRight size={18} className="text-stone-300" />
            </button>
            <Link
              href="/profile/bookings"
              className="flex items-center gap-3 p-4 hover:bg-muted transition-colors border-b border-border"
            >
              <div className="h-10 w-10 rounded-xl bg-terracotta/10 text-terracotta grid place-items-center shrink-0">
                <HotelIcon size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">My bookings</p>
                <p className="text-xs text-muted-foreground mt-0.5">Your booked hotel stays</p>
              </div>
              <ChevronRight size={18} className="text-stone-300" />
            </Link>
            <Link
              href="/notifications"
              className="flex items-center gap-3 p-4 hover:bg-muted transition-colors border-b border-border"
            >
              <div className="h-10 w-10 rounded-xl bg-pine/10 text-pine grid place-items-center shrink-0">
                <Bell size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Notifications</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {unread > 0 ? `${unread} unread` : "All caught up"}
                </p>
              </div>
              {unread > 0 && (
                <span className="rounded-full bg-terracotta text-white text-[11px] font-bold px-2 py-0.5">
                  {unread}
                </span>
              )}
              <ChevronRight size={18} className="text-stone-300" />
            </Link>
            <Link
              href="/profile/settings"
              className="flex items-center gap-3 p-4 hover:bg-muted transition-colors"
            >
              <div className="h-10 w-10 rounded-xl bg-muted text-muted-foreground grid place-items-center shrink-0">
                <Settings size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Settings</p>
                <p className="text-xs text-muted-foreground mt-0.5">Preferences and security</p>
              </div>
              <ChevronRight size={18} className="text-stone-300" />
            </Link>
          </div>
        </div>

        {/* ── Resources Section ──────────────────────────────── */}
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 ml-2">
            Safety & Offline
          </h2>
          <div className="rounded-card bg-card border border-border shadow-card overflow-hidden">
            <div className="flex items-start gap-3 p-4 border-b border-border">
              <div className="h-10 w-10 rounded-xl bg-muted text-muted-foreground grid place-items-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Safety Guidelines</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tap the red SOS button anytime for emergency contacts and your live location.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4">
              <div className="h-10 w-10 rounded-xl bg-muted text-muted-foreground grid place-items-center shrink-0">
                <BookOpen size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Offline Guide</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Maps, bookings and phrases stay available offline once loaded.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 text-red-600 px-4 py-3.5 text-sm font-bold hover:bg-red-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
            {loggingOut ? "Logging out…" : "Log Out"}
          </button>
        </div>
      </div>
    </div>
  );
}
