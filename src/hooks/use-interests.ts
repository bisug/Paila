import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { InterestId } from "@/lib/interests";

export type InterestsState = {
  loading: boolean;
  authed: boolean;
  onboarded: boolean;
  interests: InterestId[];
};

export function useUserInterests(): InterestsState {
  const [state, setState] = useState<InterestsState>({
    loading: true,
    authed: false,
    onboarded: false,
    interests: [],
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        if (!cancelled)
          setState({ loading: false, authed: false, onboarded: false, interests: [] });
        return;
      }
      const { data } = await supabase
        .from("user_interests")
        .select("interests, onboarded")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setState({
        loading: false,
        authed: true,
        onboarded: !!data?.onboarded,
        interests: (data?.interests ?? []) as InterestId[],
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
