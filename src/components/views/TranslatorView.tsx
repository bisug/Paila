"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRightLeft, Copy, Mic, Sparkles, Volume2, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  cleanLookupWord,
  detectTranslatorLang,
  getLocalTranslation,
  isSynthesizedDialect,
  PHRASE_CATEGORIES,
  TARGET_LANG_STORAGE_KEY,
  TRANSLATOR_LANGUAGES,
  type TranslatorLangKey,
} from "@/lib/translator";

type SpeechRecognitionAlternativeLike = { transcript: string };

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  length: number;
  0: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionResultListLike = {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
};

type SpeechRecognitionResultEventLike = {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

const DEFAULT_SOURCE_LANG: TranslatorLangKey = "en";
const DEFAULT_TARGET_LANG: TranslatorLangKey = "ne";

export function TranslatorView() {
  const { i18n } = useTranslation();
  const [sourceLang, setSourceLang] = useState<TranslatorLangKey>(DEFAULT_SOURCE_LANG);
  const [targetLang, setTargetLang] = useState<TranslatorLangKey>(DEFAULT_TARGET_LANG);
  const [sourceText, setSourceText] = useState("");
  const [targetText, setTargetText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wordMeaning, setWordMeaning] = useState<string | null>(null);
  const [isFetchingMeaning, setIsFetchingMeaning] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSpokenRef = useRef("");
  const userPickedTarget = useRef(false);

  useEffect(() => {
    const SpeechRecognition =
      (window as SpeechWindow).SpeechRecognition ??
      (window as SpeechWindow).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onerror = (event) => {
      console.warn("Speech recognition error", event.error);
      setIsListening(false);
      setInterimText("");
    };
    recognition.onend = () => {
      setIsListening(false);
      setInterimText("");
    };
    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (userPickedTarget.current) return;

    window.queueMicrotask(() => {
      const nextLang = detectTranslatorLang();
      setTargetLang(nextLang === "en" ? DEFAULT_TARGET_LANG : nextLang);
    });
  }, [i18n.language]);

  useEffect(() => {
    const text = sourceText.trim();

    if (!text) {
      lastSpokenRef.current = "";
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsTranslating(true);

      const localTranslation = getLocalTranslation(targetLang, text);
      if (localTranslation) {
        setTargetText(localTranslation);
        setIsTranslating(false);
        return;
      }

      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            sourceText: text,
            sourceLang,
            targetLang,
          }),
        });

        if (!response.ok) throw new Error("Translation API failed");

        const data: { translatedText?: string } = await response.json();
        setTargetText(
          data.translatedText || `[${TRANSLATOR_LANGUAGES[targetLang].label}]: ${text}`,
        );
      } catch (error) {
        if (controller.signal.aborted) return;
        console.warn("Translation error", error);
        setTargetText(`[${TRANSLATOR_LANGUAGES[targetLang].label}]: ${text}`);
      } finally {
        if (!controller.signal.aborted) setIsTranslating(false);
      }
    }, 500);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [sourceLang, sourceText, targetLang]);

  useEffect(() => {
    if (!autoSpeak || !targetText || isTranslating) return;
    if (lastSpokenRef.current === targetText) return;

    lastSpokenRef.current = targetText;
    speakText(targetText, targetLang);
  }, [autoSpeak, isTranslating, targetLang, targetText]);

  function handleTargetLangChange(nextLang: TranslatorLangKey) {
    userPickedTarget.current = true;
    setTargetLang(nextLang);

    try {
      localStorage.setItem(TARGET_LANG_STORAGE_KEY, nextLang);
    } catch {
      // Stored language preference is best-effort.
    }
  }

  function handleSourceTextChange(nextText: string) {
    setSourceText(nextText);

    if (!nextText.trim()) {
      setTargetText("");
      setIsTranslating(false);
      lastSpokenRef.current = "";
    }
  }

  function handleSwap() {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(targetText);
    setTargetText(sourceText);
  }

  function toggleListen() {
    const recognition = recognitionRef.current;

    if (isListening) {
      recognition?.stop();
      setIsListening(false);
      setInterimText("");
      return;
    }

    if (!recognition) {
      toast.error("Speech recognition isn't supported in this browser.");
      return;
    }

    recognition.lang = TRANSLATOR_LANGUAGES[sourceLang].code;
    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result?.[0]?.transcript ?? "";
        if (result?.isFinal) {
          setSourceText((current) => (current ? `${current} ${transcript}`.trim() : transcript));
        } else {
          interim += transcript;
        }
      }
      setInterimText(interim);
    };

    try {
      recognition.start();
      setIsListening(true);
      setInterimText("");
    } catch (error) {
      console.warn("Could not start speech recognition", error);
    }
  }

  async function handleWordClick(rawWord: string, lang: TranslatorLangKey) {
    const word = cleanLookupWord(rawWord);
    if (!word) return;

    setSelectedWord(word);
    setWordMeaning(null);
    setIsFetchingMeaning(true);

    try {
      if (lang === "en") {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const data = await response.json();
        setWordMeaning(
          data?.[0]?.meanings?.[0]?.definitions?.[0]?.definition ?? "No definition found.",
        );
        return;
      }

      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${
          TRANSLATOR_LANGUAGES[lang].tlCode
        }&tl=en&dt=t&q=${encodeURIComponent(word)}`,
      );
      const data = await response.json();
      setWordMeaning(
        data?.[0]?.[0]?.[0] ? `Translates to: "${data[0][0][0]}"` : "Could not translate word.",
      );
    } catch {
      setWordMeaning(lang === "en" ? "Could not load definition." : "Translation error.");
    } finally {
      setIsFetchingMeaning(false);
    }
  }

  function speakText(text: string, langKey: TranslatorLangKey) {
    if (!text) return;

    const isDialect = isSynthesizedDialect(langKey);
    let spoken = text;
    let ttsLang = TRANSLATOR_LANGUAGES[langKey].tlCode;

    // Dialects have no free speech engine; speak the romanized pronunciation.
    if (isDialect) {
      const roman = text.match(/\(([^)]+)\)/)?.[1];
      spoken = roman ? roman.trim() : text.replace(/[^\p{L}\p{N}\s]/gu, "");
      ttsLang = "en";
    }

    const synthVoices = window.speechSynthesis?.getVoices?.() ?? [];
    const hasNativeVoice =
      !isDialect && synthVoices.some((voice) => voice.lang.toLowerCase().startsWith(ttsLang));

    if (hasNativeVoice) {
      speakWithSynthesis(spoken, TRANSLATOR_LANGUAGES[langKey].code);
    } else {
      playGoogleTts(spoken, ttsLang);
    }
  }

  function speakWithSynthesis(text: string, voiceCode: string) {
    if (!window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = voiceCode;
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.warn("Speech synthesis failed, falling back to tone playback", error);
      playPhoneticTones(text);
    }
  }

  // Free, key-less speech via Google's TTS audio endpoint. Cross-browser and
  // covers every supported language; falls back to native synthesis offline.
  function playGoogleTts(text: string, ttsLang: string) {
    if (!text) {
      playPhoneticTones(text);
      return;
    }

    try {
      audioRef.current?.pause();
      const url =
        "https://translate.google.com/translate_tts" +
        `?ie=UTF-8&client=tw-ob&q=${encodeURIComponent(text)}&tl=${encodeURIComponent(ttsLang)}`;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play().catch((err) => {
        console.warn("Google TTS unavailable, using synthesis", err);
        speakWithSynthesis(text, ttsLang);
      });
    } catch (err) {
      console.warn("Google TTS failed, using synthesis", err);
      speakWithSynthesis(text, ttsLang);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 pb-24 md:pb-8">
      <section className="border-b border-stone-200 bg-white px-4 py-5 md:px-8 md:py-7">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-widest text-terracotta">
            Travel translator
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-stone-950 md:text-4xl">
            Translate, listen, and learn useful words on the road
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600 md:text-base">
            Use quick phrases, voice input, and word lookup for common travel conversations.
          </p>
        </div>
      </section>

      <section className="sticky top-14 z-20 border-b border-stone-200 bg-white/95 px-4 py-3 backdrop-blur md:top-16 md:px-8">
        <div className="grid grid-cols-[minmax(0,1fr)_44px_minmax(0,1fr)] items-end gap-2 md:max-w-3xl">
          <LanguageSelect
            label="From"
            value={sourceLang}
            onChange={setSourceLang}
            tone="terracotta"
          />
          <button
            type="button"
            onClick={handleSwap}
            className="grid h-11 w-11 place-items-center rounded-xl border border-stone-200 bg-stone-50 text-stone-500 shadow-sm transition-colors hover:bg-stone-100"
            aria-label="Swap languages"
          >
            <ArrowRightLeft size={16} />
          </button>
          <LanguageSelect
            label="To"
            value={targetLang}
            onChange={handleTargetLangChange}
            tone="pine"
          />
        </div>
      </section>

      <main className="grid flex-1 gap-4 px-4 py-5 md:grid-cols-2 md:px-8 md:py-6">
        <section className="flex min-h-[320px] flex-col rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-terracotta">
                Translate from {TRANSLATOR_LANGUAGES[sourceLang].label}
              </p>
              <p className="mt-0.5 text-xs text-stone-500">Type or use a quick phrase.</p>
            </div>
            {sourceText && (
              <button
                type="button"
                onClick={() => handleSourceTextChange("")}
                className="grid h-9 w-9 place-items-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                aria-label="Clear source text"
              >
                <X size={17} />
              </button>
            )}
          </div>

          <textarea
            value={sourceText}
            onChange={(event) => handleSourceTextChange(event.target.value)}
            placeholder="Type a phrase to translate..."
            className="min-h-36 flex-1 resize-none rounded-xl border border-stone-200 bg-stone-50 p-4 text-xl font-semibold leading-snug text-stone-900 outline-none transition-colors placeholder:text-stone-300 focus:border-terracotta focus:bg-white focus:ring-2 focus:ring-terracotta/15 md:text-2xl"
          />

          {isListening && interimText && (
            <p aria-live="polite" className="mt-2 text-sm italic text-terracotta">
              {interimText}
            </p>
          )}

          <div className="mt-4 space-y-3">
            {PHRASE_CATEGORIES.map((category) => (
              <div key={category.label}>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  {category.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {category.phrases.map((phrase) => (
                    <button
                      key={phrase}
                      type="button"
                      onClick={() => handleSourceTextChange(phrase)}
                      className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 shadow-sm transition-colors hover:border-terracotta/40 hover:text-terracotta"
                    >
                      {phrase}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex min-h-[320px] flex-col rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-pine">
                Translation in {TRANSLATOR_LANGUAGES[targetLang].label}
              </p>
              <p className="mt-0.5 text-xs text-stone-500">Tap a translated word for meaning.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard
                    ?.writeText(targetText)
                    .then(() => toast.success("Translation copied"))
                    .catch(() => toast.error("Could not copy"));
                }}
                disabled={!targetText}
                className="grid h-11 w-11 place-items-center rounded-xl bg-stone-100 text-stone-700 transition-colors hover:bg-stone-200 disabled:cursor-not-allowed disabled:text-stone-300"
                aria-label="Copy translation"
              >
                <Copy size={18} />
              </button>
              <button
                type="button"
                onClick={() => speakText(targetText, targetLang)}
                disabled={!targetText}
                className="grid h-11 w-11 place-items-center rounded-xl bg-stone-100 text-stone-700 transition-colors hover:bg-stone-200 disabled:cursor-not-allowed disabled:text-stone-300"
                aria-label="Play translation"
              >
                <Volume2 size={18} />
              </button>
            </div>
          </div>

          <div className="min-h-36 flex-1 rounded-xl border border-stone-200 bg-stone-50 p-4">
            {targetText ? (
              <p
                aria-live="polite"
                className="flex flex-wrap gap-x-2 gap-y-1 text-xl font-semibold leading-snug text-stone-900 md:text-2xl"
              >
                {targetText.split(" ").map((word, index) => (
                  <button
                    key={`${word}-${index}`}
                    type="button"
                    onClick={() => handleWordClick(word, targetLang)}
                    className="rounded-lg px-1 text-left transition-colors hover:bg-pine/10 hover:text-pine"
                  >
                    {word}
                  </button>
                ))}
              </p>
            ) : (
              <p className="text-xl font-semibold leading-snug text-stone-300 md:text-2xl">
                Translation will appear here...
              </p>
            )}

            {isTranslating && (
              <div
                aria-live="polite"
                className="mt-4 flex items-center gap-2 text-sm font-semibold text-stone-400"
              >
                <Sparkles size={16} className="animate-pulse" />
                Translating...
              </div>
            )}
          </div>
        </section>
      </main>

      <VoiceBar
        autoSpeak={autoSpeak}
        isListening={isListening}
        speechSupported={speechSupported}
        onToggleAutoSpeak={() => setAutoSpeak((current) => !current)}
        onToggleListen={toggleListen}
      />

      {selectedWord && (
        <WordMeaningModal
          isLoading={isFetchingMeaning}
          meaning={wordMeaning}
          onClose={() => setSelectedWord(null)}
          word={selectedWord}
        />
      )}
    </div>
  );
}

function LanguageSelect({
  label,
  onChange,
  tone,
  value,
}: {
  label: string;
  onChange: (value: TranslatorLangKey) => void;
  tone: "terracotta" | "pine";
  value: TranslatorLangKey;
}) {
  const focusClass =
    tone === "terracotta"
      ? "focus:border-terracotta focus:ring-terracotta/15"
      : "focus:border-pine focus:ring-pine/15";

  return (
    <label className="min-w-0">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-stone-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as TranslatorLangKey)}
        className={`h-10 w-full appearance-none rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm font-semibold text-stone-700 outline-none transition-colors focus:bg-white focus:ring-2 ${focusClass}`}
      >
        {Object.entries(TRANSLATOR_LANGUAGES).map(([key, lang]) => (
          <option key={key} value={key}>
            {lang.flag} {lang.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function VoiceBar({
  autoSpeak,
  isListening,
  speechSupported,
  onToggleAutoSpeak,
  onToggleListen,
}: {
  autoSpeak: boolean;
  isListening: boolean;
  speechSupported: boolean;
  onToggleAutoSpeak: () => void;
  onToggleListen: () => void;
}) {
  return (
    <div className="fixed bottom-16 left-0 right-0 z-30 border-t border-stone-200 bg-white/95 px-4 py-2 backdrop-blur md:bottom-8 md:left-1/2 md:right-auto md:flex md:-translate-x-1/2 md:items-center md:gap-3 md:rounded-full md:border md:px-4 md:shadow-float">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleAutoSpeak}
          aria-pressed={autoSpeak}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
            autoSpeak
              ? "border-pine/30 bg-pine/10 text-pine"
              : "border-stone-200 bg-white text-stone-400"
          }`}
        >
          <Volume2 size={11} />
          Auto {autoSpeak ? "on" : "off"}
        </button>

        <button
          type="button"
          onClick={onToggleListen}
          disabled={!speechSupported}
          aria-label={
            isListening
              ? "Stop listening"
              : speechSupported
                ? "Tap and speak to translate"
                : "Speech input not supported in this browser"
          }
          className={`grid h-14 w-14 shrink-0 place-items-center rounded-full shadow-float transition-transform active:scale-95 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none ${
            isListening ? "animate-pulse bg-red-500 ring-4 ring-red-500/25" : "bg-terracotta"
          }`}
        >
          <Mic size={22} className="text-white" />
        </button>

        <p
          aria-live="polite"
          className="min-w-0 flex-1 truncate text-xs font-semibold text-stone-600 md:w-48"
        >
          {isListening
            ? "Listening... tap mic to stop"
            : speechSupported
              ? "Tap mic and speak to translate"
              : "Voice input needs Chrome, Edge, or Safari"}
        </p>
      </div>
    </div>
  );
}

function WordMeaningModal({
  isLoading,
  meaning,
  onClose,
  word,
}: {
  isLoading: boolean;
  meaning: string | null;
  onClose: () => void;
  word: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Word meaning"
        className="w-full max-w-sm rounded-modal bg-white p-6 shadow-tactile"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-terracotta">
              Word meaning
            </p>
            <h3 className="break-words text-2xl font-bold text-stone-900">{word}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-stone-100 text-stone-500 transition-colors hover:bg-stone-200"
            aria-label="Close word meaning"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex min-h-[72px] items-center rounded-2xl border border-stone-100 bg-stone-50 p-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-stone-400">
              <Sparkles size={16} className="animate-pulse" />
              Fetching meaning...
            </div>
          ) : (
            <p className="text-base font-medium leading-relaxed text-stone-700">
              {meaning ?? "No meaning available."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function playPhoneticTones(text: string) {
  try {
    const AudioContextClass =
      (window as SpeechWindow).AudioContext ?? (window as SpeechWindow).webkitAudioContext;
    if (!AudioContextClass) return;

    const context = new AudioContextClass();
    const bracketMatch = text.match(/\(([^)]+)\)/);
    const cleanText = (bracketMatch?.[1] ?? text).replace(/[.,!?()[\]{}"']/g, "").trim();
    if (!cleanText) return;

    let time = context.currentTime + 0.05;
    const notes = [220.0, 261.63, 293.66, 329.63, 392.0, 440.0];

    cleanText.split(/\s+/).forEach((word, wordIndex) => {
      const vowels = word.match(/[aeiouy]/gi);
      const syllableCount = vowels ? Math.max(1, vowels.length) : 2;

      for (let i = 0; i < syllableCount; i++) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const charCode = word.toLowerCase().charCodeAt(i % word.length) || 97;
        const noteIndex = (charCode + i + wordIndex) % notes.length;
        const duration = 0.1 + word.length * 0.008;

        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(notes[noteIndex], time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.12, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        oscillator.start(time);
        oscillator.stop(time + duration + 0.02);

        time += duration + 0.05;
      }

      time += 0.08;
    });
  } catch (error) {
    console.warn("Web Audio playback failed", error);
  }
}
