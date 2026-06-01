"use client";

import Link from "next/link";
import { ArrowLeft, Bell, Moon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LANGUAGES, setLanguage, type LangCode } from "@/lib/i18n";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  return (
    <div className="min-h-screen bg-stone-50 px-4 pt-5 pb-28">
      <Link
        href="/profile"
        className="inline-flex items-center gap-2 text-sm font-semibold text-stone-500 hover:text-stone-900 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Menu
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Settings</h1>
        <p className="text-sm text-stone-500 mt-1">Manage your app preferences</p>
      </div>

      <div className="rounded-2xl bg-white border border-stone-100 shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-stone-900">{t("language.label")}</p>
          <p className="text-xs font-medium text-stone-500">
            {current.flag} {current.label}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
          {LANGUAGES.map((lang) => {
            const active = lang.code === i18n.language;
            return (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code as LangCode)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm text-left transition-colors ${
                  active
                    ? "border-terracotta bg-terracotta/10 text-terracotta font-bold"
                    : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50 font-medium"
                }`}
              >
                <span className="text-base leading-none">{lang.flag}</span>
                <span className="flex-1 truncate">{lang.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-stone-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <Bell size={18} className="text-stone-400" />
            <p className="text-sm font-bold text-stone-900">Notifications</p>
          </div>
          <div className="h-6 w-11 rounded-full bg-pine/20 relative">
            <div className="h-5 w-5 rounded-full bg-pine absolute right-0.5 top-0.5" />
          </div>
        </div>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Moon size={18} className="text-stone-400" />
            <p className="text-sm font-bold text-stone-900">Dark Mode</p>
          </div>
          <div className="h-6 w-11 rounded-full bg-stone-200 relative">
            <div className="h-5 w-5 rounded-full bg-white absolute left-0.5 top-0.5 shadow-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
