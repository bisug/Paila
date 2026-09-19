import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";
import { LANGUAGES, setLanguage, type LangCode } from "@/lib/i18n";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    setMounted(true);
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const currentIndex = Math.max(
    0,
    LANGUAGES.findIndex((l) => l.code === i18n.language),
  );
  const current = LANGUAGES[currentIndex] ?? LANGUAGES[0];

  // Keep DOM focus on the highlighted option: menu semantics require arrow-key
  // navigation to move the actual focus, not just a visual highlight.
  useEffect(() => {
    if (!open) return;
    const el = optionRefs.current[activeIndex];
    el?.focus();
    el?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  function close(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  function openAt(index: number) {
    setActiveIndex(index);
    setOpen(true);
  }

  function handleTriggerKeyDown(event: React.KeyboardEvent) {
    // Both arrows open on the current language rather than the first item, so a
    // keyboard user lands next to their existing choice.
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openAt(currentIndex);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openAt(currentIndex);
    }
  }

  function handleListKeyDown(event: React.KeyboardEvent) {
    const last = LANGUAGES.length - 1;
    switch (event.key) {
      case "Escape":
        event.preventDefault();
        close(true);
        break;
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((v) => (v >= last ? 0 : v + 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((v) => (v <= 0 ? last : v - 1));
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(last);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? close(false) : openAt(currentIndex))}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={mounted ? t("language.change") : "Change language"}
        suppressHydrationWarning
        className={`flex items-center gap-1.5 rounded-full border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-colors ${
          compact ? "h-8 px-2 text-xs font-semibold" : "h-11 px-3 text-sm font-semibold"
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
        <div
          role="menu"
          aria-label={mounted ? t("language.change") : "Change language"}
          onKeyDown={handleListKeyDown}
          className="absolute right-0 mt-2 w-56 max-h-80 overflow-y-auto rounded-2xl border border-stone-200 bg-white shadow-float z-50 py-1"
        >
          {LANGUAGES.map((lang, index) => {
            const active = lang.code === i18n.language;
            return (
              <button
                key={lang.code}
                ref={(el) => {
                  optionRefs.current[index] = el;
                }}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                tabIndex={-1}
                onClick={() => {
                  setLanguage(lang.code as LangCode);
                  // The option unmounts on close, so return focus to the trigger
                  // instead of dropping it to <body>.
                  close(true);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2.5 min-h-[44px] text-sm text-left hover:bg-stone-50 transition-colors ${
                  index === activeIndex ? "bg-stone-50" : ""
                } ${active ? "font-bold text-terracotta" : "font-medium text-stone-700"}`}
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
