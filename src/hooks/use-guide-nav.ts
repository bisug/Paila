import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type GuideNavState = {
  loading: boolean;
  signedIn: boolean;
  isGuide: boolean;
  isAdmin: boolean;
  verificationStatus: "pending" | "approved" | "rejected" | null;
  pendingReviewCount: number;
};

const initial: GuideNavState = {
  loading: true,
  signedIn: false,
  isGuide: false,
  isAdmin: false,
  verificationStatus: null,
  pendingReviewCount: 0,
};

export function useGuideNav(): GuideNavState {
  const [state, setState] = useState<GuideNavState>(initial);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        if (!cancelled) setState({ ...initial, loading: false });
        return;
      }

      const [{ data: profile }, { data: roles }, { data: verification }] = await Promise.all([
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

      const isAdmin = !!roles?.some((r: { role: string }) => r.role === "admin");
      const isGuide = profile?.account_type === "business" && profile?.business_type === "guide";

      let pendingReviewCount = 0;
      if (isAdmin) {
        const { count } = await supabase
          .from("guide_verifications")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending");
        pendingReviewCount = count ?? 0;
      }

      if (cancelled) return;
      setState({
        loading: false,
        signedIn: true,
        isGuide,
        isAdmin,
        verificationStatus: (verification?.status as GuideNavState["verificationStatus"]) ?? null,
        pendingReviewCount,
      });
    }

    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
