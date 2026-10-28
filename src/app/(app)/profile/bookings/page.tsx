"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  Calendar,
  Users,
  MapPin,
  ChevronLeft,
  BookOpen,
  RotateCcw,
  Building2,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import {
  listMyBookings,
  listHostBookings,
  cancelBooking,
  respondToBooking,
} from "@/lib/actions/bookings";
import { supabase } from "@/integrations/supabase/client";
import { useUserRoles } from "@/hooks/use-user-roles";
import { toast } from "sonner";

type Booking = Awaited<ReturnType<typeof listMyBookings>>[number];
type HostBooking = Awaited<ReturnType<typeof listHostBookings>>[number];
type TabType = "my" | "host";
type StatusFilter = "all" | "pending" | "confirmed" | "cancelled";

function statusTone(status: string) {
  switch (status) {
    case "confirmed":
      return "bg-pine/10 text-pine border-pine/30";
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "cancelled":
      return "bg-stone-100 text-stone-600 border-stone-200";
    case "failed":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-stone-100 text-stone-600 border-stone-200";
  }
}

export default function BookingsPage() {
  const router = useRouter();
  const { isHost, isAdmin } = useUserRoles();

  const [activeTab, setActiveTab] = useState<TabType>("my");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [myBookings, setMyBookings] = useState<Booking[] | null>(null);
  const [hostBookings, setHostBookings] = useState<HostBooking[] | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Read initial query param ?tab=host on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "host") {
        setActiveTab("host");
      }
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/login");
        return;
      }

      const token = session.access_token;
      const [userList, hostList] = await Promise.all([
        listMyBookings({ data: { token } }),
        isHost || isAdmin
          ? listHostBookings({ data: { token } }).catch(() => [])
          : Promise.resolve([]),
      ]);

      setMyBookings(userList);
      setHostBookings(hostList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [router, isHost, isAdmin]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Traveler cancel handler
  async function handleCancel(id: string) {
    if (!window.confirm("Cancel this booking request?")) return;
    setBusyId(id);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await cancelBooking({ data: { id, token: session?.access_token } });
      setMyBookings(
        (prev) => prev?.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)) ?? prev,
      );
      toast.success("Booking request cancelled");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to cancel booking");
    } finally {
      setBusyId(null);
    }
  }

  // Host response handler (confirm or decline)
  async function handleHostResponse(id: string, status: "confirmed" | "cancelled") {
    const actionLabel = status === "confirmed" ? "confirm" : "decline";
    if (!window.confirm(`Are you sure you want to ${actionLabel} this reservation request?`))
      return;

    setBusyId(id);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      await respondToBooking({ data: { id, status, token: session?.access_token } });

      setHostBookings((prev) => prev?.map((b) => (b.id === id ? { ...b, status } : b)) ?? prev);
      toast.success(status === "confirmed" ? "Reservation confirmed!" : "Reservation declined.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `Failed to ${actionLabel} reservation`);
    } finally {
      setBusyId(null);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background grid place-items-center px-4 text-center">
        <div className="rounded-card bg-card border border-border shadow-card p-6 max-w-sm">
          <p className="text-sm font-bold text-foreground">Couldn’t load bookings</p>
          <p className="text-xs text-muted-foreground mt-1">{error}</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-1.5 rounded-lg bg-terracotta px-4 py-2 text-sm font-bold text-white hover:bg-terracotta/90"
            >
              <RotateCcw size={14} /> Try again
            </button>
            <Link
              href="/profile"
              className="inline-flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !myBookings && !hostBookings) {
    return (
      <div className="min-h-screen bg-background grid place-items-center">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const canShowHostTab = isHost || isAdmin;
  const currentList = activeTab === "my" ? (myBookings ?? []) : (hostBookings ?? []);
  const pendingHostCount = (hostBookings ?? []).filter((b) => b.status === "pending").length;

  const filteredList = currentList.filter((b) => {
    if (statusFilter === "all") return true;
    return b.status === statusFilter;
  });

  return (
    <div className="min-h-screen bg-background px-4 pt-5 pb-28 md:pb-8 md:max-w-2xl md:mx-auto">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1 text-sm font-medium text-stone-500 hover:text-stone-900"
      >
        <ChevronLeft size={16} /> Profile
      </Link>

      <div className="mt-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
          {activeTab === "my" ? (
            <BookOpen className="text-terracotta" size={24} />
          ) : (
            <Building2 className="text-pine" size={24} />
          )}
          {activeTab === "my" ? "My Bookings" : "Host Reservations"}
        </h1>
      </div>

      {/* ── Role Tab Switcher (Visible if user has Host or Admin role) ── */}
      {canShowHostTab && (
        <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 border border-border">
          <button
            type="button"
            onClick={() => {
              setActiveTab("my");
              setStatusFilter("all");
            }}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "my"
                ? "bg-card text-foreground shadow-xs ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen size={14} />
            <span>My Trips</span>
            {(myBookings?.length ?? 0) > 0 && (
              <span className="rounded-full bg-muted-foreground/15 text-foreground text-[10px] px-1.5 py-0.2">
                {myBookings?.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("host");
              setStatusFilter("all");
            }}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "host"
                ? "bg-card text-foreground shadow-xs ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building2 size={14} className="text-pine" />
            <span>Host Reservations</span>
            {pendingHostCount > 0 && (
              <span className="rounded-full bg-terracotta text-white text-[10px] font-extrabold px-1.5 py-0.2">
                {pendingHostCount} pending
              </span>
            )}
          </button>
        </div>
      )}

      {/* ── Status Filter Chips ── */}
      <div className="mt-4 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {(["all", "pending", "confirmed", "cancelled"] as StatusFilter[]).map((filter) => {
          const isSelected = statusFilter === filter;
          return (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors capitalize ${
                isSelected
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {filter}
            </button>
          );
        })}
      </div>

      {/* ── Bookings List ── */}
      {filteredList.length === 0 ? (
        <div className="mt-8 rounded-card border border-dashed border-border bg-card p-8 text-center">
          {activeTab === "my" ? (
            <>
              <p className="text-sm font-semibold text-foreground">No bookings found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {statusFilter === "all"
                  ? "You haven't booked any stays yet."
                  : `No ${statusFilter} stays in your history.`}
              </p>
              <Link
                href="/hotels"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-terracotta px-4 py-2 text-sm font-bold text-white hover:bg-terracotta/90"
              >
                <Sparkles size={14} /> Browse stays
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-foreground">No host reservations</p>
              <p className="text-xs text-muted-foreground mt-1">
                {statusFilter === "all"
                  ? "Incoming booking requests from guests will appear here."
                  : `No ${statusFilter} guest reservations found.`}
              </p>
            </>
          )}
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {filteredList.map((b) => {
            const isPending = b.status === "pending";
            const isBusy = busyId === b.id;

            return (
              <li
                key={b.id}
                className="rounded-card bg-card border border-border shadow-card overflow-hidden flex flex-col xs:flex-row transition-shadow hover:shadow-card-md"
              >
                {b.hotel_image && (
                  <img
                    src={b.hotel_image}
                    alt={b.hotel_name}
                    className="h-32 xs:h-auto xs:w-32 shrink-0 object-cover"
                  />
                )}
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/hotels/${b.hotel_slug}`}
                        className="font-bold text-stone-900 text-sm leading-snug hover:underline"
                      >
                        {b.hotel_name}
                      </Link>
                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-wider rounded-full border px-2 py-0.5 shrink-0 ${statusTone(
                          b.status,
                        )}`}
                      >
                        {b.status}
                      </span>
                    </div>

                    <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin size={12} className="shrink-0" /> {b.hotel_location}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-stone-600 dark:text-stone-300">
                      <Calendar size={12} className="shrink-0" /> {b.check_in} → {b.check_out} ·{" "}
                      {b.nights} night{b.nights === 1 ? "" : "s"}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-stone-600 dark:text-stone-300">
                      <Users size={12} className="shrink-0" /> {b.guests} guest
                      {b.guests === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Total Amount
                      </span>
                      <p className="text-sm font-bold text-foreground tabular-nums">
                        NPR {b.total_npr.toLocaleString()}
                      </p>
                    </div>

                    {/* ── Traveler Actions ── */}
                    {activeTab === "my" && isPending && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleCancel(b.id)}
                        className="rounded-lg border border-red-200 bg-red-50 text-red-600 px-3 py-1.5 text-xs font-bold hover:bg-red-100 disabled:opacity-50 transition-colors"
                      >
                        {isBusy ? <Loader2 size={12} className="animate-spin inline mr-1" /> : null}
                        Cancel Request
                      </button>
                    )}

                    {/* ── Host Actions ── */}
                    {activeTab === "host" && isPending && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleHostResponse(b.id, "confirmed")}
                          className="inline-flex items-center gap-1 rounded-lg bg-pine text-white px-3 py-1.5 text-xs font-bold hover:bg-pine/90 disabled:opacity-50 shadow-xs transition-colors"
                        >
                          {isBusy ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Check size={13} strokeWidth={2.5} />
                          )}
                          <span>Accept</span>
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleHostResponse(b.id, "cancelled")}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 text-red-600 px-2.5 py-1.5 text-xs font-bold hover:bg-red-100 disabled:opacity-50 transition-colors"
                        >
                          <X size={13} strokeWidth={2.5} />
                          <span>Decline</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
