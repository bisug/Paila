import { fetchWithTimeout } from "@/lib/server/guardrails";

/**
 * Key-less translation engine with multi-provider fallback:
 * 1. MyMemory API (free, official open translation memory)
 * 2. Lingva API (free open-source translation proxy)
 * 3. Google GTX public endpoint (graceful fallback)
 */
export async function translateText(
  sourceLang: string,
  targetLang: string,
  text: string,
  timeoutMs = 10_000,
): Promise<string | null> {
  const trimmed = text.trim();
  if (!trimmed) return "";

  // 1. Try MyMemory API (Official free tier, no API key required)
  try {
    const pair = `${sourceLang}|${targetLang}`;
    const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${encodeURIComponent(pair)}`;
    const res = await fetchWithTimeout(myMemoryUrl, { method: "GET" }, Math.min(timeoutMs, 4000));
    if (res.ok) {
      const data = (await res.json()) as {
        responseData?: { translatedText?: string };
        responseStatus?: number;
      };
      const translated = data?.responseData?.translatedText;
      if (
        translated &&
        !translated.startsWith("MYMEMORY WARNING:") &&
        translated.trim() !== trimmed
      ) {
        return translated;
      }
    }
  } catch {
    // Continue to next provider
  }

  // 2. Try Lingva API (Open-source free translation engine)
  try {
    const lingvaUrl = `https://lingva.ml/api/v1/${encodeURIComponent(sourceLang)}/${encodeURIComponent(targetLang)}/${encodeURIComponent(trimmed)}`;
    const res = await fetchWithTimeout(lingvaUrl, { method: "GET" }, Math.min(timeoutMs, 4000));
    if (res.ok) {
      const data = (await res.json()) as { translation?: string };
      if (data?.translation && data.translation.trim()) {
        return data.translation;
      }
    }
  } catch {
    // Continue to next provider
  }

  // 3. Fallback: Google GTX public endpoint
  const url =
    "https://translate.googleapis.com/translate_a/single" +
    `?client=gtx&sl=${encodeURIComponent(sourceLang)}` +
    `&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(trimmed)}`;

  try {
    const res = await fetchWithTimeout(
      url,
      {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        },
      },
      timeoutMs,
    );
    if (!res.ok) return null;
    return extractTranslation(await res.json());
  } catch {
    return null;
  }
}

/** Pull the joined translated sentence out of the gtx response shape. */
export function extractTranslation(data: unknown): string {
  const segments = (data as Array<unknown> | null)?.[0];
  if (!Array.isArray(segments)) return "";
  return segments
    .map((segment) => (Array.isArray(segment) ? ((segment[0] as string) ?? "") : ""))
    .join("");
}
