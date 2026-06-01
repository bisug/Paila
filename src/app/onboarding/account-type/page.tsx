"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Footprints, Compass, MapPin, Briefcase } from "lucide-react";

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

  function save(selected: Choice, bizType?: BusinessType) {
    try {
      localStorage.setItem("paila_demo_role", selected);
      if (selected === "business" && bizType) {
        localStorage.setItem("paila_demo_business_type", bizType);
      }
    } catch {
      // Demo preference is non-critical.
    }

    if (selected === "tourist") {
      router.push("/");
    } else if (selected === "guide") {
      router.push("/guides");
    } else {
      router.push("/");
    }
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
          className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 shadow-card border border-stone-100 hover:border-terracotta/40 active:scale-[0.99] transition text-left"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-terracotta/10 text-terracotta">
            <Compass size={22} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-stone-900">I'm a Tourist</div>
            <div className="text-xs text-stone-500">Explore places, book stays and guides</div>
          </div>
          <ArrowRight size={16} className="text-stone-400" />
        </button>

        <button
          type="button"
          onClick={() => save("guide")}
          className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 shadow-card border border-stone-100 hover:border-terracotta/40 active:scale-[0.99] transition text-left"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-pine/10 text-pine">
            <MapPin size={22} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-stone-900">I'm a Local Guide</div>
            <div className="text-xs text-stone-500">Offer tours and connect with travellers</div>
          </div>
          <ArrowRight size={16} className="text-stone-400" />
        </button>

        <button
          type="button"
          onClick={() => setChoice(choice === "business" ? null : "business")}
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-terracotta px-4 py-3 text-sm font-bold text-white hover:bg-terracotta/90"
            >
              Continue
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
