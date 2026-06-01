"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Compass,
  Footprints,
  Loader2,
  MapPin,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Choice = "tourist" | "guide" | "business";
type BusinessType = "restaurant" | "hotel" | "shop" | "transport" | "other";

const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: "restaurant", label: "Restaurant Owner" },
  { value: "hotel", label: "Hotel / Homestay" },
  { value: "shop", label: "Shop / Store" },
  { value: "transport", label: "Transport Provider" },
  { value: "other", label: "Other" },
];

export default function AccountTypePage() {
  const router = useRouter();
  const [choice, setChoice] = useState<Choice | null>(null);
  const [businessType, setBusinessType] = useState<BusinessType>("restaurant");
  const [savingChoice, setSavingChoice] = useState<Choice | null>(null);
  const [error, setError] = useState("");

  async function save(selected: Choice, bizType?: BusinessType) {
    setError("");
    setSavingChoice(selected);

    try {
      localStorage.setItem("paila_demo_role", selected);
      if (selected === "business" && bizType) {
        localStorage.setItem("paila_demo_business_type", bizType);
      }
    } catch {
      // Demo preference is non-critical.
    }

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) {
        router.push("/login?next=/onboarding/account-type");
        return;
      }

      const accountType = selected === "tourist" ? "traveller" : "business";
      const nextBusinessType =
        selected === "guide" ? "guide" : selected === "business" ? (bizType ?? businessType) : null;
      const metadata = user.user_metadata ?? {};
      const fullName =
        typeof metadata.full_name === "string"
          ? metadata.full_name
          : typeof metadata.name === "string"
            ? metadata.name
            : null;

      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          user_id: user.id,
          account_type: accountType,
          business_type: nextBusinessType,
          ...(fullName ? { full_name: fullName } : {}),
        },
        { onConflict: "user_id" },
      );

      if (profileError) throw profileError;

      if (selected === "guide") {
        router.push("/guide/verify");
      } else {
        router.push("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your account type.");
    } finally {
      setSavingChoice(null);
    }
  }

  function isSaving(selected: Choice) {
    return savingChoice === selected;
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center px-4 xs:px-6 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-terracotta shadow-float">
          <Footprints size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Tell us about you</h1>
        <p className="mt-2 text-sm text-stone-500 font-medium">How will you use Paila?</p>
      </div>

      <div className="mx-auto w-full max-w-sm space-y-3">
        <button
          type="button"
          onClick={() => save("tourist")}
          disabled={!!savingChoice}
          className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 shadow-card border border-stone-100 hover:border-terracotta/40 active:scale-[0.99] transition text-left"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-terracotta/10 text-terracotta">
            <Compass size={22} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-stone-900">I'm a Tourist</div>
            <div className="text-xs text-stone-500">Explore places, book stays and guides</div>
          </div>
          {isSaving("tourist") ? (
            <Loader2 size={16} className="animate-spin text-stone-400" />
          ) : (
            <ArrowRight size={16} className="text-stone-400" />
          )}
        </button>

        <button
          type="button"
          onClick={() => save("guide")}
          disabled={!!savingChoice}
          className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 shadow-card border border-stone-100 hover:border-terracotta/40 active:scale-[0.99] transition text-left"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-pine/10 text-pine">
            <MapPin size={22} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-stone-900">I'm a Local Guide</div>
            <div className="text-xs text-stone-500">Offer tours and connect with travellers</div>
          </div>
          {isSaving("guide") ? (
            <Loader2 size={16} className="animate-spin text-stone-400" />
          ) : (
            <ArrowRight size={16} className="text-stone-400" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setChoice(choice === "business" ? null : "business")}
          disabled={!!savingChoice}
          className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 shadow-card border border-stone-100 hover:border-terracotta/40 active:scale-[0.99] transition text-left"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-stone-200 text-stone-700">
            <Briefcase size={22} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-stone-900">Other business</div>
            <div className="text-xs text-stone-500">Hotel, restaurant, shop, transport…</div>
          </div>
        </button>

        {choice === "business" && (
          <div className="rounded-2xl bg-white p-4 shadow-card border border-stone-100 space-y-3">
            <label className="block text-xs font-semibold text-stone-600">Business type</label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value as BusinessType)}
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm bg-white"
            >
              {BUSINESS_TYPES.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => save("business", businessType)}
              disabled={!!savingChoice}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-terracotta px-4 py-3 text-sm font-bold text-white hover:bg-terracotta/90"
            >
              {isSaving("business") ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ArrowRight size={14} />
              )}
              Continue
            </button>
          </div>
        )}

        {error && (
          <p className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-700">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
