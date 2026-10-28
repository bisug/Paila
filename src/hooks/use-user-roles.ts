"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type RoleType = "admin" | "host" | "guide" | "verifier" | "traveller";

export type UserRolesState = {
  loading: boolean;
  signedIn: boolean;
  user: User | null;
  roles: ("admin" | "host" | "guide" | "verifier")[];
  activeRole: RoleType | "all";
  isAdmin: boolean;
  isHost: boolean;
  isGuide: boolean;
  isVerifier: boolean;
  isTraveller: boolean;
  hasRole: (role: "admin" | "host" | "guide" | "verifier") => boolean;
  pendingHostBookingsCount: number;
  pendingGuideReviewsCount: number;
  verificationStatus: "pending" | "approved" | "rejected" | null;
  setActiveRole: (role: RoleType | "all") => void;
  refresh: () => Promise<void>;
};

const initial: UserRolesState = {
  loading: true,
  signedIn: false,
  user: null,
  roles: [],
  activeRole: "all",
  isAdmin: false,
  isHost: false,
  isGuide: false,
  isVerifier: false,
  isTraveller: true,
  hasRole: () => false,
  pendingHostBookingsCount: 0,
  pendingGuideReviewsCount: 0,
  verificationStatus: null,
  setActiveRole: () => {},
  refresh: async () => {},
};

export const ROLE_CHANGED_EVENT = "paila_role_changed";

export function useUserRoles(): UserRolesState {
  const [state, setState] = useState<UserRolesState>(initial);

  const load = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        setState({ ...initial, loading: false });
        return;
      }

      // Read active role override (for preview / role switching in UI)
      let activeRole: RoleType | "all" = "all";
      try {
        const stored = localStorage.getItem("paila_active_role");
        if (stored && ["all", "admin", "host", "guide", "verifier", "traveller"].includes(stored)) {
          activeRole = stored as RoleType | "all";
        }
      } catch {
        // localStorage unavailable in SSR
      }

      // Fetch user profile, roles, and guide verification status in parallel:
      const [{ data: profile }, { data: rolesData }, { data: verification }] = await Promise.all([
        supabase
          .from("profiles")
          .select("account_type,business_type")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase
          .from("guide_verifications")
          .select("status")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      // Direct roles from DB or JWT
      const dbRoles = (rolesData?.map((r: { role: string }) => r.role) ?? []) as (
        "admin" | "host" | "guide" | "verifier"
      )[];
      const jwtRoles = ((user.app_metadata?.roles as string[] | undefined) ?? []) as (
        "admin" | "host" | "guide" | "verifier"
      )[];

      const mergedRolesSet = new Set<"admin" | "host" | "guide" | "verifier">([
        ...dbRoles,
        ...jwtRoles,
      ]);

      // If user profile indicates business/host or guide, reflect that:
      if (profile?.account_type === "business") {
        if (profile.business_type === "guide") {
          mergedRolesSet.add("guide");
        } else if (profile.business_type === "hotel" || profile.business_type === "other") {
          mergedRolesSet.add("host");
        }
      }

      const assignedRoles = Array.from(mergedRolesSet);

      const hasAdmin = assignedRoles.includes("admin");
      const hasHost = assignedRoles.includes("host");
      const hasGuide = assignedRoles.includes("guide");
      const hasVerifier = assignedRoles.includes("verifier");

      // Active role view filtering:
      const isAdmin = hasAdmin && (activeRole === "all" || activeRole === "admin");
      const isHost = hasHost && (activeRole === "all" || activeRole === "host");
      const isGuide = hasGuide && (activeRole === "all" || activeRole === "guide");
      const isVerifier =
        (hasVerifier || hasAdmin) && (activeRole === "all" || activeRole === "verifier");
      const isTraveller =
        activeRole === "traveller" || (!isAdmin && !isHost && !isGuide && !isVerifier);

      // Async fetch pending review counts
      let pendingGuideReviewsCount = 0;
      let pendingHostBookingsCount = 0;

      const countPromises: Promise<any>[] = [];

      if (hasAdmin || hasVerifier) {
        countPromises.push(
          supabase
            .from("guide_verifications")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending")
            .then(({ count }: { count: number | null }) => {
              pendingGuideReviewsCount = count ?? 0;
            }),
        );
      }

      if (hasHost) {
        countPromises.push(
          supabase
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .eq("host_user_id", user.id)
            .eq("status", "pending")
            .then(({ count }: { count: number | null }) => {
              pendingHostBookingsCount = count ?? 0;
            }),
        );
      }

      await Promise.all(countPromises);

      setState({
        loading: false,
        signedIn: true,
        user,
        roles: assignedRoles,
        activeRole,
        isAdmin,
        isHost,
        isGuide,
        isVerifier,
        isTraveller,
        hasRole: (r) => assignedRoles.includes(r),
        pendingHostBookingsCount,
        pendingGuideReviewsCount,
        verificationStatus: (verification?.status as UserRolesState["verificationStatus"]) ?? null,
        setActiveRole: (role) => {
          try {
            if (role === "all") {
              localStorage.removeItem("paila_active_role");
            } else {
              localStorage.setItem("paila_active_role", role);
            }
          } catch {}
          window.dispatchEvent(new CustomEvent(ROLE_CHANGED_EVENT, { detail: { role } }));
        },
        refresh: load,
      });
    } catch (err) {
      console.error("useUserRoles load error:", err);
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    void load();

    const onRoleChanged = () => {
      void load();
    };

    window.addEventListener(ROLE_CHANGED_EVENT, onRoleChanged);
    const { data: sub } = supabase.auth.onAuthStateChange(() => void load());

    return () => {
      window.removeEventListener(ROLE_CHANGED_EVENT, onRoleChanged);
      sub.subscription.unsubscribe();
    };
  }, [load]);

  return state;
}
