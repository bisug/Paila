import { useState, useEffect, useRef } from "react";
import { Mic, Volume2, ArrowRightLeft, X, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

const LANGUAGES = {
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

type LangKey = keyof typeof LANGUAGES;

const PHRASE_CATEGORIES: { label: string; phrases: string[] }[] = [
  {
    label: "Essentials",
    phrases: ["Where am I?", "I need help", "Thank you"],
  },
];

const MOCK_LOCAL_DICT: Record<string, Record<string, string>> = {
  mai: {
    "Where is the trail?": "बाटो कतय अछि? (Bato katay achhi?)",
    Thanks: "धन्यवाद (Dhanyabad)",
    "Cost?": "एकर कतेक दाम अछि? (Ekar katek daam achhi?)",
    "Need help": "हमरा मद्दत चाही (Hamra maddat chaahi)",
  },
  new: {
    "Where is the trail?": "लँ ग्व दु? (Lã gwaa du?)",
    Thanks: "सुभाय् (Subhaay)",
    "Cost?": "थुकिया गुलि तुं? (Thukiya guli tun?)",
    "Need help": "जिताः ग्वाहालि माः (Jitaa gwaahali maa)",
  },
  thl: {
    "Where is the trail?": "डगर कता बा? (Dagar kata ba?)",
    Thanks: "धन्यवाद (Dhanyabad)",
    "Cost?": "यकर कतका दाम हो? (Yakar katka daam ho?)",
    "Need help": "हमरा मदद चाही (Hamra madad chahi)",
  },
  bho: {
    "Where is the trail?": "रास्ता कहाँ बा? (Rasta kahan ba?)",
    Thanks: "रउर बहुत धन्यवाद (Raur bahut dhanyabad)",
    "Cost?": "एकर केतना दाम बा? (Ekar ketna daam ba?)",
    "Need help": "हमरा मदद चाहीं (Hamra madad chahin)",
  },
};

function detectLangKey(): LangKey {
  if (typeof window === "undefined") return "ne";
  try {
    const saved = localStorage.getItem("paila.talk.targetLang");
    if (saved && saved in LANGUAGES) return saved as LangKey;
  } catch {
    // Stored language preference is best-effort.
  }
  // Map app i18n / browser language to a supported translator language
  const candidates: string[] = [];
  try {
    const appLang = localStorage.getItem("paila.lang");
    if (appLang) candidates.push(appLang);
  } catch {
    // Stored language preference is best-effort.
  }
  if (typeof navigator !== "undefined" && navigator.language) candidates.push(navigator.language);
  const aliases: Record<string, LangKey> = {
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
  for (const c of candidates) {
    const lower = c.toLowerCase();
    if (aliases[lower]) return aliases[lower];
    const base = lower.split("-")[0];
    if (aliases[base]) return aliases[base];
  }
  return "ne";
}

export function TranslatorView() {
  const { i18n } = useTranslation();
  const detected = detectLangKey();
  // Source defaults to English (traveler input); target auto-detects to user's app language
  const [sourceLang, setSourceLang] = useState<LangKey>(detected === "en" ? "en" : "en");
  const [targetLang, setTargetLang] = useState<LangKey>(detected === "en" ? "ne" : detected);
  const userPickedTarget = useRef(false);

  // Re-sync target if app language changes and user hasn't manually overridden
  useEffect(() => {
    if (userPickedTarget.current) return;
    const next = detectLangKey();
    if (next !== "en") setTargetLang(next);
  }, [i18n.language]);

  const [sourceText, setSourceText] = useState("");
  const [targetText, setTargetText] = useState("");

  const [isTranslating, setIsTranslating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const lastSpokenRef = useRef<string>("");

  // Dictionary State
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wordMeaning, setWordMeaning] = useState<string | null>(null);
  const [isFetchingMeaning, setIsFetchingMeaning] = useState(false);

  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  // Translation Effect (One-way)
  useEffect(() => {
    if (!sourceText.trim()) {
      setTargetText("");
      return;
    }

    const timer = setTimeout(async () => {
      setIsTranslating(true);

      // Mock dictionary for rare Nepali dialects (Devanagari + Romanized)
      if (MOCK_LOCAL_DICT[targetLang] && MOCK_LOCAL_DICT[targetLang][sourceText]) {
        setTargetText(MOCK_LOCAL_DICT[targetLang][sourceText]);
        setIsTranslating(false);
        return;
      }

      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceText,
            sourceLang: LANGUAGES[sourceLang].label,
            targetLang: LANGUAGES[targetLang].label,
          }),
        });

        if (!response.ok) {
          throw new Error("Translation API failed");
        }

        const data = await response.json();
        if (data.translatedText) {
          setTargetText(data.translatedText);
        } else {
          setTargetText(`[${LANGUAGES[targetLang].label}]: ${sourceText}`);
        }
      } catch (err) {
        console.error("Translation Error:", err);
        setTargetText(`[${LANGUAGES[targetLang].label}]: ${sourceText}`);
      } finally {
        setIsTranslating(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [sourceText, sourceLang, targetLang]);

  // Auto-speak the translation as soon as it's ready (voice-to-voice flow)
  useEffect(() => {
    if (!autoSpeak) return;
    if (!targetText || isTranslating) return;
    if (lastSpokenRef.current === targetText) return;
    lastSpokenRef.current = targetText;
    handleSpeak(targetText, targetLang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetText, isTranslating, autoSpeak, targetLang]);

  function toggleListen() {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.lang = LANGUAGES[sourceLang].code;
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSourceText((prev) => (prev ? prev + " " + transcript : transcript));
      };

      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    } else {
      alert("Speech recognition is not supported in this browser.");
    }
  }

  function playPhoneticBeeps(text: string) {
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();

      // Extract romanized text inside parentheses if available (e.g. "(Bato katay achhi?)")
      let cleanText = text;
      const bracketMatch = text.match(/\(([^)]+)\)/);
      if (bracketMatch && bracketMatch[1]) {
        cleanText = bracketMatch[1];
      }

      cleanText = cleanText.replace(/[.,!?()[\]{}"']/g, "").trim();
      if (!cleanText) return;

      const words = cleanText.split(/\s+/);
      let time = ctx.currentTime + 0.05;

      words.forEach((word, wordIdx) => {
        // Estimate syllables based on vowel counts
        const vowels = word.match(/[aeiouy]/gi);
        const syllableCount = vowels ? Math.max(1, vowels.length) : 2;

        for (let i = 0; i < syllableCount; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.connect(gain);
          gain.connect(ctx.destination);

          // Use triangle wave for a warm, plucky organic instrument timbre (like a sarangi/tungna pluck)
          osc.type = "triangle";

          // Sequence of notes in a warm Himalayan pentatonic scale (A minor pentatonic: A, C, D, E, G)
          const notes = [220.0, 261.63, 293.66, 329.63, 392.0, 440.0];
          const charCode = word.toLowerCase().charCodeAt(i % word.length) || 97;
          const noteIdx = (charCode + i + wordIdx) % notes.length;
          osc.frequency.setValueAtTime(notes[noteIdx], time);

          const duration = 0.1 + word.length * 0.008;
          gain.gain.setValueAtTime(0, time);
          gain.gain.linearRampToValueAtTime(0.12, time + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

          osc.start(time);
          osc.stop(time + duration + 0.02);

          time += duration + 0.05; // Gap between syllables
        }
        time += 0.08; // Gap between words
      });
    } catch (err) {
      console.error("Web Audio Synth error:", err);
    }
  }

  function handleSpeak(text: string, langKey: LangKey) {
    if (!text || typeof window === "undefined") return;

    const isDialect = ["mai", "new", "bho", "thl"].includes(langKey);

    if (!isDialect && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const voices = window.speechSynthesis.getVoices();

      let voiceCode = LANGUAGES[langKey].code;

      // Fallback Nepali (ne-NP) to Hindi (hi-IN) voice if Nepali voice isn't installed
      if (langKey === "ne") {
        const hasNepali = voices.some((v) => v.lang.startsWith("ne"));
        if (!hasNepali) {
          const hasHindi = voices.some((v) => v.lang.startsWith("hi"));
          if (hasHindi) {
            voiceCode = "hi-IN";
          }
        }
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = voiceCode;

      try {
        window.speechSynthesis.speak(utterance);
        return;
      } catch (err) {
        console.warn("Speech Synthesis failed, falling back to Web Audio Synth", err);
      }
    }

    // Playback phonetic beeps if native voice unavailable or rare local dialect
    playPhoneticBeeps(text);
  }

  function handleSwap() {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(targetText);
  }

  // Dictionary lookup for selected words
  async function handleWordClick(rawWord: string, lang: LangKey) {
    // Clean punctuation from the word
    const word = rawWord.replace(/[.,!?()[\]{}"']/g, "").trim();
    if (!word) return;

    setSelectedWord(word);
    setWordMeaning(null);
    setIsFetchingMeaning(true);

    if (lang === "en") {
      try {
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const data = await res.json();
        if (data && data[0] && data[0].meanings && data[0].meanings[0]) {
          setWordMeaning(data[0].meanings[0].definitions[0].definition);
        } else {
          setWordMeaning("No definition found.");
        }
      } catch (err) {
        setWordMeaning("Could not load definition.");
      }
    } else {
      // For foreign words, fetch a direct translation back to English
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${LANGUAGES[lang].tlCode}&tl=en&dt=t&q=${encodeURIComponent(word)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && data[0] && data[0][0]) {
          setWordMeaning(`Translates to: "${data[0][0][0]}"`);
        } else {
          setWordMeaning("Could not translate word.");
        }
      } catch (err) {
        setWordMeaning("Translation error.");
      }
    }
    setIsFetchingMeaning(false);
  }

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col bg-stone-50 overflow-hidden">
      {/* ── Language Selectors Bar ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-stone-100 shadow-sm z-20">
        <div className="relative flex-1">
          <select
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value as LangKey)}
            className="w-full appearance-none rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-semibold text-stone-700 outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/15 transition-all cursor-pointer"
          >
            {Object.entries(LANGUAGES).map(([key, lang]) => (
              <option key={key} value={key}>
                {lang.flag} {lang.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSwap}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors shadow-sm active:scale-95"
        >
          <ArrowRightLeft size={16} />
        </button>

        <div className="relative flex-1">
          <select
            value={targetLang}
            onChange={(e) => {
              const v = e.target.value as LangKey;
              userPickedTarget.current = true;
              setTargetLang(v);
              try {
                localStorage.setItem("paila.talk.targetLang", v);
              } catch {
                // Stored language preference is best-effort.
              }
            }}
            className="w-full appearance-none rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-semibold text-stone-700 outline-none focus:border-pine focus:ring-2 focus:ring-pine/15 transition-all cursor-pointer"
          >
            {Object.entries(LANGUAGES).map(([key, lang]) => (
              <option key={key} value={key}>
                {lang.flag} {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Main Content Area (Side-by-side on desktop, scrolls internally on mobile) ─────────────── */}
      <div className="flex flex-col flex-1 min-h-0 md:flex-row md:overflow-hidden">
        {/* ── Input Area ─────────────────────────────────────────────────── */}
        <div className="flex flex-col bg-white border-b md:border-b-0 md:border-r border-stone-100 shadow-sm px-6 pt-4 pb-4 md:w-1/2 md:overflow-y-auto overflow-y-auto min-h-0 flex-1 relative">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-terracotta">
              Translate from {LANGUAGES[sourceLang].label}
            </span>
            {sourceText && (
              <button
                onClick={() => setSourceText("")}
                className="text-stone-400 hover:text-stone-600"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            className="w-full min-h-[100px] resize-none bg-transparent text-2xl font-bold tracking-tight leading-snug text-stone-900 outline-none placeholder:text-stone-300 custom-scrollbar"
          />

          <div className="mt-4 space-y-3">
            {PHRASE_CATEGORIES.map((cat) => (
              <div key={cat.label}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1.5">
                  {cat.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {cat.phrases.map((phrase) => (
                    <button
                      key={phrase}
                      onClick={() => setSourceText(phrase)}
                      className="rounded-full bg-stone-50 px-3.5 py-1.5 text-xs font-semibold text-stone-600 shadow-sm border border-stone-200 hover:border-terracotta/40 hover:text-terracotta active:scale-95 transition-all"
                    >
                      {phrase}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Output Area ────────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 flex flex-col px-6 py-4 overflow-y-auto relative md:w-1/2 bg-stone-50 md:pb-24">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[11px] font-bold uppercase tracking-widest text-pine">
              Translation in {LANGUAGES[targetLang].label} (Tap words for meaning)
            </span>
            <button
              onClick={() => handleSpeak(targetText, targetLang)}
              className="h-10 w-10 flex items-center justify-center rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700 transition-colors active:scale-95"
            >
              <Volume2 size={20} />
            </button>
          </div>

          <div className="relative">
            {targetText ? (
              <p className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight leading-snug text-stone-900 flex flex-wrap gap-x-2 gap-y-1">
                {targetText.split(" ").map((word, i) => (
                  <span
                    key={i}
                    onClick={() => handleWordClick(word, targetLang)}
                    className="cursor-pointer hover:bg-pine/10 hover:text-pine rounded-lg transition-colors px-1 -mx-1"
                  >
                    {word}
                  </span>
                ))}
              </p>
            ) : (
              <p className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight leading-snug text-stone-300">
                Translation will appear here...
              </p>
            )}

            {isTranslating && (
              <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-stone-400 animate-pulse">
                <Sparkles size={16} /> Translating...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Voice bar (always visible, no scroll needed) ─────────────────── */}
      <div className="shrink-0 border-t border-stone-200 bg-white/95 backdrop-blur px-4 py-2 flex items-center gap-3 md:absolute md:bottom-8 md:left-1/2 md:-translate-x-1/2 md:z-30 md:border md:rounded-full md:shadow-float md:px-4 md:py-2">
        <button
          type="button"
          onClick={() => setAutoSpeak((v) => !v)}
          aria-pressed={autoSpeak}
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border transition-colors shrink-0 ${
            autoSpeak
              ? "bg-pine/10 text-pine border-pine/30"
              : "bg-white text-stone-400 border-stone-200"
          }`}
        >
          <Volume2 size={11} />
          Auto {autoSpeak ? "on" : "off"}
        </button>

        <button
          onClick={toggleListen}
          aria-label={isListening ? "Stop listening" : "Tap and speak to translate"}
          className={`h-14 w-14 rounded-full flex items-center justify-center shadow-float active:scale-95 transition-all shrink-0 ${
            isListening ? "bg-red-500 animate-pulse ring-4 ring-red-500/25" : "bg-terracotta"
          }`}
        >
          <Mic size={22} className="text-white" />
        </button>

        <p className="text-xs font-semibold text-stone-600 flex-1 truncate">
          {isListening ? "Listening… tap mic to stop" : "Tap mic & speak to translate"}
        </p>
      </div>

      {/* ── Dictionary Modal ───────────────────────────────────────────── */}
      {selectedWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-float animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-terracotta mb-1">
                  Word Meaning
                </p>
                <h3 className="text-2xl font-bold text-stone-900">{selectedWord}</h3>
              </div>
              <button
                onClick={() => setSelectedWord(null)}
                className="h-8 w-8 grid place-items-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="min-h-[60px] flex items-center bg-stone-50 rounded-2xl p-4 border border-stone-100">
              {isFetchingMeaning ? (
                <div className="flex items-center gap-2 text-sm font-semibold text-stone-400 animate-pulse">
                  <Sparkles size={16} /> Fetching meaning...
                </div>
              ) : (
                <p className="text-base font-medium text-stone-700 leading-relaxed">
                  {wordMeaning}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
