"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useTranslation } from "react-i18next";
import { Loader2, Check, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { INTERESTS, type InterestId } from "@/lib/interests";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const MIN_SELECT = 3;

export default function InterestsOnboarding() {
  const { t } = useTranslation();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<InterestId>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }
      setUserId(data.user.id);
      supabase
        .from("user_interests")
        .select("interests")
        .eq("user_id", data.user.id)
        .maybeSingle()
        .then(({ data: row }: { data: { interests: string[] | null } | null }) => {
          if (row?.interests?.length) setSelected(new Set(row.interests as InterestId[]));
        });
    });
  }, [router]);

  function toggle(id: InterestId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function save(interests: InterestId[]) {
    if (!userId) return;
    setSaving(true);
    setError("");
    const { error } = await supabase.from("user_interests").upsert({
      user_id: userId,
      interests,
      onboarded: true,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
  }

  const count = selected.size;
  const canContinue = count >= MIN_SELECT;

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-8 md:py-12">
      <div className="mx-auto w-full max-w-lg">
        <div className="flex justify-end mb-3">
          <LanguageSwitcher compact />
        </div>
        <div className="text-center mb-8">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-terracotta/10 text-terracotta">
            <Sparkles size={22} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-stone-900">
            {t("onboarding.title")}
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            {t("onboarding.subtitle", { count: MIN_SELECT })}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {INTERESTS.map(({ id, label, tKey, icon: Icon }) => {
            const active = selected.has(id);
            return (
              <button
                key={id}
                onClick={() => toggle(id)}
                className={`relative flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all active:scale-[0.98] ${
                  active
                    ? "border-terracotta bg-terracotta/5 shadow-sm"
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    active ? "bg-terracotta text-white" : "bg-stone-100 text-stone-600"
                  }`}
                >
                  <Icon size={18} />
                </div>
                <span className="text-sm font-semibold text-stone-900">{t(tKey, label)}</span>
                {active && (
                  <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-terracotta text-white">
                    <Check size={12} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="sticky bottom-4 mt-8 flex flex-col gap-2">
          <button
            disabled={!canContinue || saving}
            onClick={() => save(Array.from(selected))}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-terracotta px-4 py-3 text-sm font-bold text-white shadow-card disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                {t("actions.continue")}{" "}
                {count > 0 && (
                  <span className="opacity-80">{t("onboarding.selectedCount", { count })}</span>
                )}
              </>
            )}
          </button>
          <button
            disabled={saving}
            onClick={() => save([])}
            className="w-full rounded-xl bg-transparent px-4 py-2.5 text-xs font-semibold text-stone-500 hover:text-stone-900"
          >
            {t("actions.skip")}
          </button>
          {!canContinue && count > 0 && (
            <p className="text-center text-[11px] text-stone-400">
              {t("onboarding.needMore", { count: MIN_SELECT - count })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
