"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function ProfileMenu() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }
      setUser(data.user);
      const [{ count }, { data: role }] = await Promise.all([
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("read", false),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "admin")
          .maybeSingle(),
      ]);
      setUnread(count ?? 0);
      setIsAdmin(!!role);
      setLoading(false);
    })();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="animate-spin text-stone-400" />
      </div>
    );
  }
  if (!user) return null;

  const identifier = user.email || user.phone || "Traveller";
  const meta = user.user_metadata || {};
  const isProfileIncomplete = !meta.first_name || !meta.age;

  return (
    <div className="min-h-screen bg-stone-50 px-4 pt-5 pb-28">
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

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Menu</h1>
        <p className="text-sm text-stone-500 mt-1">Signed in as {identifier}</p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-3 ml-2">
            Account
          </h2>
          <div className="rounded-2xl bg-white border border-stone-100 shadow-sm overflow-hidden">
            <Link
              href="/profile/account"
              className="flex items-center gap-3 p-4 hover:bg-stone-50 transition-colors border-b border-stone-100"
            >
              <div className="h-10 w-10 rounded-xl bg-terracotta/10 text-terracotta grid place-items-center shrink-0">
                <UserIcon size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-stone-900">Profile & Details</p>
                <p className="text-xs text-stone-500 mt-0.5">View your impact and info</p>
              </div>
              <ChevronRight size={18} className="text-stone-300" />
            </Link>
            <Link
              href="/profile/bookings"
              className="flex items-center gap-3 p-4 hover:bg-stone-50 transition-colors border-b border-stone-100"
            >
              <div className="h-10 w-10 rounded-xl bg-terracotta/10 text-terracotta grid place-items-center shrink-0">
                <HotelIcon size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-stone-900">My bookings</p>
                <p className="text-xs text-stone-500 mt-0.5">Your hotel stays</p>
              </div>
              <ChevronRight size={18} className="text-stone-300" />
            </Link>
            <Link
              href="/notifications"
              className="flex items-center gap-3 p-4 hover:bg-stone-50 transition-colors border-b border-stone-100"
            >
              <div className="h-10 w-10 rounded-xl bg-pine/10 text-pine grid place-items-center shrink-0">
                <Bell size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-stone-900">Notifications</p>
                <p className="text-xs text-stone-500 mt-0.5">
                  {unread > 0 ? `${unread} unread` : "All caught up"}
                </p>
              </div>
              {unread > 0 && (
                <span className="rounded-full bg-terracotta text-white text-[10px] font-bold px-2 py-0.5">
                  {unread}
                </span>
              )}
              <ChevronRight size={18} className="text-stone-300" />
            </Link>
            {isAdmin && (
              <Link
                href="/admin/guides"
                className="flex items-center gap-3 p-4 hover:bg-stone-50 transition-colors border-b border-stone-100"
              >
                <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 grid place-items-center shrink-0">
                  <ShieldAlert size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-stone-900">Admin · Guide reviews</p>
                  <p className="text-xs text-stone-500 mt-0.5">Approve or reject submissions</p>
                </div>
                <ChevronRight size={18} className="text-stone-300" />
              </Link>
            )}
            <Link
              href="/profile/settings"
              className="flex items-center gap-3 p-4 hover:bg-stone-50 transition-colors"
            >
              <div className="h-10 w-10 rounded-xl bg-stone-100 text-stone-600 grid place-items-center shrink-0">
                <Settings size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-stone-900">Settings</p>
                <p className="text-xs text-stone-500 mt-0.5">Preferences and security</p>
              </div>
              <ChevronRight size={18} className="text-stone-300" />
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-3 ml-2">
            Resources
          </h2>
          <div className="rounded-2xl bg-white border border-stone-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 p-4 border-b border-stone-100">
              <div className="h-10 w-10 rounded-xl bg-stone-100 text-stone-600 grid place-items-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <p className="text-sm font-bold text-stone-900 flex-1">Safety Guidelines</p>
              <ChevronRight size={18} className="text-stone-300" />
            </div>
            <div className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 rounded-xl bg-stone-100 text-stone-600 grid place-items-center shrink-0">
                <BookOpen size={18} />
              </div>
              <p className="text-sm font-bold text-stone-900 flex-1">Offline Guide</p>
              <ChevronRight size={18} className="text-stone-300" />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-red-600 px-4 py-3.5 text-sm font-bold hover:bg-red-100 transition-colors"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
