"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../integrations/supabase/client";
import i18n, { LANGUAGES } from "../lib/i18n";
import { Toaster } from "../components/ui/sonner";

function AuthSync() {
  const router = useRouter();
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      router.refresh();
    });
    return () => subscription.unsubscribe();
  }, [router]);
  return null;
}

function LangSync() {
  useEffect(() => {
    const apply = (code: string) => {
      const lang = LANGUAGES.find((l) => l.code === code);
      document.documentElement.lang = code;
      document.documentElement.dir = lang?.rtl ? "rtl" : "ltr";
    };
    apply(i18n.language);
    i18n.on("languageChanged", apply);
    return () => {
      i18n.off("languageChanged", apply);
    };
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthSync />
      <LangSync />
      {children}
      <Toaster />
    </QueryClientProvider>
  );
}
