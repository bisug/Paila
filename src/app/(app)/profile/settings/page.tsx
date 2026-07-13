"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Moon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LANGUAGES, setLanguage, type LangCode } from "@/lib/i18n";

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        checked ? "bg-primary" : "bg-border"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
          checked ? "right-0.5" : "left-0.5"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

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
                onClick={() => setLanguage(lang.code as LangCode)}
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

      <div className="rounded-card bg-card border border-border shadow-card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Bell size={18} className="text-muted-foreground" />
            <p className="text-sm font-bold text-foreground">Notifications</p>
          </div>
          <Switch
            checked={notifications}
            onChange={setNotifications}
            label="Notifications"
          />
        </div>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Moon size={18} className="text-muted-foreground" />
            <p className="text-sm font-bold text-foreground">Dark Mode</p>
          </div>
          <Switch checked={darkMode} onChange={setDarkMode} label="Dark Mode" />
        </div>
      </div>
    </div>
  );
}
