export const TRANSLATOR_LANGUAGES = {
  en: { label: "English", code: "en-US", flag: "🇬🇧", tlCode: "en" },
  hi: { label: "Hindi", code: "hi-IN", flag: "🇮🇳", tlCode: "hi" },
  zh: { label: "Mandarin", code: "zh-CN", flag: "🇨🇳", tlCode: "zh" },
  es: { label: "Spanish", code: "es-ES", flag: "🇪🇸", tlCode: "es" },
  fr: { label: "French", code: "fr-FR", flag: "🇫🇷", tlCode: "fr" },
  ja: { label: "Japanese", code: "ja-JP", flag: "🇯🇵", tlCode: "ja" },
  ne: { label: "Nepali", code: "ne-NP", flag: "🇳🇵", tlCode: "ne" },
  mai: { label: "Maithili", code: "mai-NP", flag: "🇳🇵", tlCode: "mai" },
  bho: { label: "Bhojpuri", code: "bho-NP", flag: "🇳🇵", tlCode: "bho" },
  new: { label: "Newari", code: "new-NP", flag: "🇳🇵", tlCode: "new" },
  thl: { label: "Tharu", code: "thl-NP", flag: "🇳🇵", tlCode: "thl" },
} as const;

export type TranslatorLangKey = keyof typeof TRANSLATOR_LANGUAGES;

export const TARGET_LANG_STORAGE_KEY = "paila.talk.targetLang";

export const PHRASE_CATEGORIES: { label: string; phrases: string[] }[] = [
  {
    label: "Essentials",
    phrases: ["Where am I?", "I need help", "Thank you"],
  },
  {
    label: "Travel",
    phrases: ["Where is the trail?", "How much does it cost?", "I need a doctor"],
  },
  {
    label: "Local courtesy",
    phrases: ["Namaste", "Can you help me?", "I do not understand"],
  },
];

export const LOCAL_TRANSLATIONS: Partial<Record<TranslatorLangKey, Record<string, string>>> = {
  mai: {
    "Where is the trail?": "बाटो कतय अछि? (Bato katay achhi?)",
    "Thank you": "धन्यवाद (Dhanyabad)",
    "How much does it cost?": "एकर कतेक दाम अछि? (Ekar katek daam achhi?)",
    "I need help": "हमरा मद्दत चाही (Hamra maddat chaahi)",
  },
  new: {
    "Where is the trail?": "लँ ग्व दु? (Lã gwaa du?)",
    "Thank you": "सुभाय् (Subhaay)",
    "How much does it cost?": "थुकिया गुलि तुं? (Thukiya guli tun?)",
    "I need help": "जिताः ग्वाहालि माः (Jitaa gwaahali maa)",
  },
  thl: {
    "Where is the trail?": "डगर कता बा? (Dagar kata ba?)",
    "Thank you": "धन्यवाद (Dhanyabad)",
    "How much does it cost?": "यकर कतका दाम हो? (Yakar katka daam ho?)",
    "I need help": "हमरा मदद चाही (Hamra madad chahi)",
  },
  bho: {
    "Where is the trail?": "रास्ता कहाँ बा? (Rasta kahan ba?)",
    "Thank you": "रउर बहुत धन्यवाद (Raur bahut dhanyabad)",
    "How much does it cost?": "एकर केतना दाम बा? (Ekar ketna daam ba?)",
    "I need help": "हमरा मदद चाहीं (Hamra madad chahin)",
  },
};

const LANGUAGE_ALIASES: Record<string, TranslatorLangKey> = {
  en: "en",
  "en-us": "en",
  "en-gb": "en",
  hi: "hi",
  "zh-cn": "zh",
  zh: "zh",
  es: "es",
  fr: "fr",
  ja: "ja",
  ne: "ne",
  mai: "mai",
  bho: "bho",
  new: "new",
  thl: "thl",
};

export function detectTranslatorLang(): TranslatorLangKey {
  if (typeof window === "undefined") return "ne";

  const candidates: string[] = [];
  const savedTarget = readStoredValue(TARGET_LANG_STORAGE_KEY);
  const appLang = readStoredValue("paila.lang");

  if (savedTarget) candidates.push(savedTarget);
  if (appLang) candidates.push(appLang);
  if (navigator.language) candidates.push(navigator.language);

  for (const candidate of candidates) {
    const normalized = candidate.toLowerCase();
    const base = normalized.split("-")[0];
    if (LANGUAGE_ALIASES[normalized]) return LANGUAGE_ALIASES[normalized];
    if (LANGUAGE_ALIASES[base]) return LANGUAGE_ALIASES[base];
  }

  return "ne";
}

export function cleanLookupWord(rawWord: string) {
  return rawWord.replace(/[.,!?()[\]{}"']/g, "").trim();
}

export function getLocalTranslation(targetLang: TranslatorLangKey, sourceText: string) {
  return LOCAL_TRANSLATIONS[targetLang]?.[sourceText.trim()] ?? null;
}

export function isSynthesizedDialect(langKey: TranslatorLangKey) {
  return ["mai", "new", "bho", "thl"].includes(langKey);
}

function readStoredValue(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
