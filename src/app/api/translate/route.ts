import { z } from "zod";
import { checkRateLimit, getClientKey } from "@/lib/server/guardrails";
import { createChatCompletion, hasAiProvider } from "@/lib/server/ai";
import { translateText } from "@/lib/server/translate";
import { TRANSLATOR_LANGUAGES, type TranslatorLangKey } from "@/lib/translator";
import { createAuthenticatedSupabaseClient } from "@/integrations/supabase/auth-middleware";

const Body = z.object({
  sourceText: z.string().min(1).max(2000),
  sourceLang: z.string().min(1).max(10),
  targetLang: z.string().min(1).max(10),
});

// Dialects without a free machine-translation engine bridge to Nepali.
const DIALECT_BRIDGE: Record<string, string> = {
  mai: "ne",
  bho: "ne",
  new: "ne",
  thl: "ne",
};

function googleCode(key: string): string {
  const lang = TRANSLATOR_LANGUAGES[key as TranslatorLangKey];
  if (!lang) return key;
  return DIALECT_BRIDGE[key] ?? lang.tlCode;
}

function labelFor(key: string): string {
  return TRANSLATOR_LANGUAGES[key as TranslatorLangKey]?.label ?? key;
}

export async function POST(request: Request) {
  // Verified session when a real project is wired (see /api/scan for demo-mode note).
  try {
    await createAuthenticatedSupabaseClient();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!checkRateLimit(getClientKey(request, "translate"), 20, 60_000)) {
    return Response.json({ error: "Too many translation requests." }, { status: 429 });
  }

  let parsed;
  try {
    parsed = Body.parse(await request.json());
  } catch (err) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { sourceText, sourceLang, targetLang } = parsed;

  const translated = await translate(sourceText, sourceLang, targetLang);
  if (translated) {
    return Response.json({ translatedText: translated });
  }

  // Graceful fallback: surface the source so the UI never goes blank.
  return Response.json({
    translatedText: `[${labelFor(targetLang)}]: ${sourceText}`,
    mock: true,
  });
}

async function translate(
  text: string,
  sourceKey: string,
  targetKey: string,
): Promise<string | null> {
  // Free, purpose-built engine first so translation works with no config.
  const free = await translateText(googleCode(sourceKey), googleCode(targetKey), text);
  if (free) return free;

  // Optional upgrade: a configured AI provider, if the free engine ever fails.
  if (hasAiProvider()) {
    return aiTranslate(text, labelFor(sourceKey), labelFor(targetKey));
  }
  return null;
}

async function aiTranslate(
  text: string,
  sourceLabel: string,
  targetLabel: string,
): Promise<string | null> {
  const result = await createChatCompletion({
    messages: [
      {
        role: "system",
        content:
          "You are a translator. Return ONLY the translated text, with no quotes, explanations, or formatting.",
      },
      {
        role: "user",
        content: `Translate the following from ${sourceLabel} to ${targetLabel}:\n\n${text}`,
      },
    ],
    temperature: 0.2,
    timeoutMs: 12_000,
  });

  if (result.error || !result.content) return null;
  return result.content;
}
