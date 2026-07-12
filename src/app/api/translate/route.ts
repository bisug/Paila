import { z } from "zod";
import { checkRateLimit, getClientKey, isSupabaseConfigured } from "@/lib/server/guardrails";
import { createChatCompletion, hasAiProvider } from "@/lib/server/ai";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const Body = z.object({
  sourceText: z.string().min(1).max(2000),
  sourceLang: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[\p{L}\s-]+$/u),
  targetLang: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[\p{L}\s-]+$/u),
});

export async function POST(request: Request) {
  // Only enforce Supabase session auth when a real project is wired (see /api/scan).
  if (isSupabaseConfigured()) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      },
    );

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
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

  if (!hasAiProvider()) {
    return Response.json({
      translatedText: `[${targetLang}] ${sourceText}`,
      mock: true,
    });
  }

  try {
    const result = await createChatCompletion({
      messages: [
        {
          role: "system",
          content:
            "You are a translator. Return ONLY the translated text, with no quotes, explanations, or formatting.",
        },
        {
          role: "user",
          content: `Translate the following from ${sourceLang} to ${targetLang}:\n\n${sourceText}`,
        },
      ],
      temperature: 0.2,
      timeoutMs: 12_000,
    });

    if (result.status === 429) {
      return Response.json({ error: "Rate limit reached. Try again shortly." }, { status: 429 });
    }
    if (result.status === 402) {
      return Response.json({ error: "AI provider quota exhausted." }, { status: 402 });
    }
    if (result.error) {
      console.error("AI provider error", result.status, result.error);
      return Response.json({ error: "Translation service failed" }, { status: 500 });
    }
    return Response.json({ translatedText: result.content ?? "" });
  } catch (err) {
    console.error("translate error", err);
    return Response.json({ error: "Translation failed" }, { status: 500 });
  }
}
