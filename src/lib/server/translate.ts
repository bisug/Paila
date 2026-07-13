import { fetchWithTimeout } from "@/lib/server/guardrails";

/**
 * Key-less translation via Google's public translate endpoint. This is the
 * default engine so the translator works with zero configuration — no API key,
 * no paid provider required.
 */
export async function translateText(
  sourceLang: string,
  targetLang: string,
  text: string,
  timeoutMs = 10_000,
): Promise<string | null> {
  const url =
    "https://translate.googleapis.com/translate_a/single" +
    `?client=gtx&sl=${encodeURIComponent(sourceLang)}` +
    `&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;

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

