"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AccountClient } from "@/components/views/AccountClient";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/login");
      else setUser(data.user);
    });
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="animate-spin text-stone-400" />
      </div>
    );
  }
  return <AccountClient user={user} />;
}
