import { z } from "zod";
import { checkRateLimit, fetchWithTimeout, getClientKey } from "@/lib/server/guardrails";

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

  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    return Response.json({
      translatedText: `[${targetLang}] ${sourceText}`,
      mock: true,
    });
  }

  try {
    const res = await fetchWithTimeout(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
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
        }),
      },
      12_000,
    );

    if (res.status === 429) {
      return Response.json({ error: "Rate limit reached. Try again shortly." }, { status: 429 });
    }
    if (res.status === 402) {
      return Response.json(
        { error: "AI credits exhausted. Add credits in Lovable Cloud." },
        { status: 402 },
      );
    }
    if (!res.ok) {
      const t = await res.text();
      console.error("AI gateway error", res.status, t);
      return Response.json({ error: "Translation service failed" }, { status: 500 });
    }
    const data = await res.json();
    const translatedText: string = data.choices?.[0]?.message?.content?.trim() ?? "";
    return Response.json({ translatedText });
  } catch (err) {
    console.error("translate error", err);
    return Response.json({ error: "Translation failed" }, { status: 500 });
  }
}
