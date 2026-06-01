"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Footprints } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function LoginPage() {
  const router = useRouter();

  function enterDemo() {
    try {
      localStorage.setItem("paila_demo_signed_in", "1");
    } catch {
      // Demo preference is non-critical.
    }
    router.push("/onboarding/account-type");
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center px-4 xs:px-6 py-10 xs:py-12">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-terracotta shadow-float">
          <Footprints size={28} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">Welcome to Paila</h1>
        <p className="mt-2 text-sm text-stone-500 font-medium">
          Demo mode — no account needed. Continue to choose how you'll use Paila.
        </p>
      </div>

      <div className="mx-auto w-full max-w-sm">
        <button
          onClick={enterDemo}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-terracotta px-4 py-3 text-sm font-bold text-white hover:bg-terracotta/90"
        >
          Continue <ArrowRight size={14} />
        </button>
        <p className="mt-4 text-center text-xs text-stone-400">
          You'll pick Tourist or Local Guide on the next screen.
        </p>
      </div>
    </div>
  );
}
