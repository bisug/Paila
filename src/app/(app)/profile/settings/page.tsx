"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LANGUAGES, setLanguage, type LangCode } from "@/lib/i18n";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];
  const [, setTick] = useState(0);

  return (
    <div className="min-h-screen bg-background px-4 pt-5 pb-28">
      <Link
        href="/profile"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Menu
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your app preferences</p>
      </div>

      <div className="rounded-card bg-card border border-border shadow-card p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-foreground">{t("language.label")}</p>
          <p className="text-xs font-medium text-muted-foreground">
            {current.flag} {current.label}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
          {LANGUAGES.map((lang) => {
            const active = lang.code === i18n.language;
            return (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code as LangCode);
                  setTick((n) => n + 1);
                }}
                aria-pressed={active}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm text-left transition-colors ${
                  active
                    ? "border-terracotta bg-terracotta/10 text-terracotta font-bold"
                    : "border-border bg-card text-foreground hover:bg-muted font-medium"
                }`}
              >
                <span className="text-base leading-none">{lang.flag}</span>
                <span className="flex-1 truncate">{lang.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notification and dark-mode toggles were removed: they were visual-only
          state with no backing behavior. Re-add only once wired to real
          preferences (dark mode needs the .dark token set applied app-wide). */}
    </div>
  );
}
