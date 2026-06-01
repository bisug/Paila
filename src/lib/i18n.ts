import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enUS from "@/locales/en-US/common.json";
import enGB from "@/locales/en-GB/common.json";
import ne from "@/locales/ne/common.json";
import hi from "@/locales/hi/common.json";
import mai from "@/locales/mai/common.json";
import bho from "@/locales/bho/common.json";
import newa from "@/locales/new/common.json";
import thl from "@/locales/thl/common.json";
import zhCN from "@/locales/zh-CN/common.json";
import ar from "@/locales/ar/common.json";
import es from "@/locales/es/common.json";
import fr from "@/locales/fr/common.json";
import ja from "@/locales/ja/common.json";
import de from "@/locales/de/common.json";
import ko from "@/locales/ko/common.json";
import ptBR from "@/locales/pt-BR/common.json";
import ru from "@/locales/ru/common.json";
import it from "@/locales/it/common.json";
import bn from "@/locales/bn/common.json";
import ta from "@/locales/ta/common.json";
import ur from "@/locales/ur/common.json";
import th from "@/locales/th/common.json";
import id from "@/locales/id/common.json";
import vi from "@/locales/vi/common.json";
import bo from "@/locales/bo/common.json";

export const LANGUAGES = [
  { code: "en-US", label: "English (US)", flag: "🇺🇸", rtl: false },
  { code: "en-GB", label: "English (UK)", flag: "🇬🇧", rtl: false },
  { code: "ne", label: "नेपाली", flag: "🇳🇵", rtl: false },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳", rtl: false },
  { code: "mai", label: "मैथिली", flag: "🇳🇵", rtl: false },
  { code: "bho", label: "भोजपुरी", flag: "🇳🇵", rtl: false },
  { code: "new", label: "नेवारी", flag: "🇳🇵", rtl: false },
  { code: "thl", label: "थारू", flag: "🇳🇵", rtl: false },
  { code: "bo", label: "བོད་ཡིག", flag: "🇨🇳", rtl: false },
  { code: "bn", label: "বাংলা", flag: "🇧🇩", rtl: false },
  { code: "ta", label: "தமிழ்", flag: "🇮🇳", rtl: false },
  { code: "ur", label: "اردو", flag: "🇵🇰", rtl: true },
  { code: "zh-CN", label: "中文", flag: "🇨🇳", rtl: false },
  { code: "ja", label: "日本語", flag: "🇯🇵", rtl: false },
  { code: "ko", label: "한국어", flag: "🇰🇷", rtl: false },
  { code: "th", label: "ไทย", flag: "🇹🇭", rtl: false },
  { code: "id", label: "Bahasa Indonesia", flag: "🇮🇩", rtl: false },
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳", rtl: false },
  { code: "ar", label: "العربية", flag: "🇸🇦", rtl: true },
  { code: "es", label: "Español", flag: "🇪🇸", rtl: false },
  { code: "pt-BR", label: "Português (BR)", flag: "🇧🇷", rtl: false },
  { code: "fr", label: "Français", flag: "🇫🇷", rtl: false },
  { code: "it", label: "Italiano", flag: "🇮🇹", rtl: false },
  { code: "de", label: "Deutsch", flag: "🇩🇪", rtl: false },
  { code: "ru", label: "Русский", flag: "🇷🇺", rtl: false },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

const STORAGE_KEY = "paila.lang";

function detectInitialLang(): string {
  if (typeof window === "undefined") return "en-US";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGUAGES.some((l) => l.code === saved)) return saved;
    const nav = navigator.language;
    const match =
      LANGUAGES.find((l) => l.code === nav) ??
      LANGUAGES.find((l) => l.code.split("-")[0] === nav.split("-")[0]);
    if (match) return match.code;
  } catch {
    // Ignore unavailable browser storage/language APIs.
  }
  return "en-US";
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      "en-US": { common: enUS },
      "en-GB": { common: enGB },
      ne: { common: ne },
      hi: { common: hi },
      mai: { common: mai },
      bho: { common: bho },
      new: { common: newa },
      thl: { common: thl },
      "zh-CN": { common: zhCN },
      ar: { common: ar },
      es: { common: es },
      fr: { common: fr },
      ja: { common: ja },
      de: { common: de },
      ko: { common: ko },
      "pt-BR": { common: ptBR },
      ru: { common: ru },
      it: { common: it },
      bn: { common: bn },
      ta: { common: ta },
      ur: { common: ur },
      th: { common: th },
      id: { common: id },
      vi: { common: vi },
      bo: { common: bo },
    },
    lng: detectInitialLang(),
    fallbackLng: "en-US",
    defaultNS: "common",
    ns: ["common"],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export function setLanguage(code: LangCode) {
  i18n.changeLanguage(code);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // Language persistence is best-effort.
    }
    const lang = LANGUAGES.find((l) => l.code === code);
    document.documentElement.lang = code;
    document.documentElement.dir = lang?.rtl ? "rtl" : "ltr";
  }
}

export default i18n;
