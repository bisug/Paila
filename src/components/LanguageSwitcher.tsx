import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";
import { LANGUAGES, setLanguage, type LangCode } from "@/lib/i18n";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={mounted ? t("language.change") : "Change language"}
        suppressHydrationWarning
        className={`flex items-center gap-1.5 rounded-full border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-colors ${
          compact ? "h-8 px-2 text-xs font-semibold" : "h-9 px-3 text-sm font-semibold"
        }`}
      >
        <Globe size={compact ? 13 : 15} className="text-stone-500" />
        <span className="leading-none" suppressHydrationWarning>
          {mounted ? current.flag : "🌐"}
        </span>
        <span className="hidden sm:inline leading-none" suppressHydrationWarning>
          {mounted ? current.label : "Language"}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 max-h-80 overflow-y-auto rounded-2xl border border-stone-200 bg-white shadow-float z-50 py-1">
          {LANGUAGES.map((lang) => {
            const active = lang.code === i18n.language;
            return (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code as LangCode);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-stone-50 transition-colors ${
                  active ? "font-bold text-terracotta" : "font-medium text-stone-700"
                }`}
              >
                <span className="text-base leading-none">{lang.flag}</span>
                <span className="flex-1">{lang.label}</span>
                {active && <Check size={14} className="text-terracotta" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
