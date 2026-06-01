"use server";

import { fetchWithTimeout } from "@/lib/server/guardrails";
import { createChatCompletion, hasAiProvider } from "@/lib/server/ai";
import { fetchGoogleMapsUrl } from "@/lib/server/google-maps";

export type PlaceContext = {
  elevationMeters: number | null;
  topography: string;
  climate: string;
  culture: string;
  languages: string[];
  food: string[];
  funFact: string;
};

export async function getPlaceContext({
  data,
}: {
  data: { lat: number; lng: number; name: string };
}): Promise<{ context: PlaceContext | null; error: string | null }> {
  // 1) Elevation (best-effort)
  let elevationMeters: number | null = null;
  if (process.env.GOOGLE_MAPS_API_KEY) {
    try {
      const res = await fetchGoogleMapsUrl("https://maps.googleapis.com/maps/api/elevation/json", {
        locations: `${data.lat},${data.lng}`,
      });
      if (res.ok) {
        const j = (await res.json()) as { results?: Array<{ elevation?: number }> };
        if (typeof j.results?.[0]?.elevation === "number") {
          elevationMeters = Math.round(j.results[0].elevation);
        }
      }
    } catch {
      /* ignore elevation failures */
    }
  }

  if (!hasAiProvider()) {
    return {
      context: {
        elevationMeters,
        topography: "AI place context is not configured.",
        climate: "Add OPENAI_API_KEY to enable generated climate notes.",
        culture: "Add OPENAI_API_KEY to enable generated cultural context.",
        languages: [],
        food: [],
        funFact: "",
      },
      error: null,
    };
  }

  // 2) AI-generated location context (structured JSON)
  const prompt = `You are a knowledgeable Nepal travel guide. For the location below, return a JSON object describing it for a curious traveler. Be concise, factual, and specific to the region (not generic).

Location: "${data.name}"
Coordinates: ${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}
${elevationMeters !== null ? `Elevation: ${elevationMeters} m` : ""}

Return ONLY a JSON object matching this exact shape:
{
  "topography": "1-2 sentence description of the terrain and geography",
  "climate": "1 sentence about climate / best season",
  "culture": "2-3 sentences about the dominant ethnic groups, traditions, and notable cultural features",
  "languages": ["primary language", "secondary language", ...],
  "food": ["signature dish 1", "signature dish 2", "signature dish 3", "signature dish 4"],
  "funFact": "one surprising or memorable detail about this place"
}`;

  try {
    const aiRes = await createChatCompletion({
      messages: [
        { role: "system", content: "You return only valid JSON, no markdown, no preamble." },
        { role: "user", content: prompt },
      ],
      responseFormat: { type: "json_object" },
      timeoutMs: 12_000,
    });

    if (aiRes.error) {
      if (aiRes.status === 429)
        return { context: null, error: "Rate limit reached. Try again in a moment." };
      if (aiRes.status === 402) return { context: null, error: "AI provider quota exhausted." };
      return { context: null, error: `AI error ${aiRes.status}: ${aiRes.error.slice(0, 160)}` };
    }

    const content = aiRes.content;
    if (!content) return { context: null, error: "Empty AI response" };

    let parsed: Partial<PlaceContext>;
    try {
      parsed = JSON.parse(content);
    } catch {
      return { context: null, error: "Could not parse AI response" };
    }

    return {
      context: {
        elevationMeters,
        topography: parsed.topography ?? "—",
        climate: parsed.climate ?? "—",
        culture: parsed.culture ?? "—",
        languages: Array.isArray(parsed.languages) ? parsed.languages.slice(0, 6) : [],
        food: Array.isArray(parsed.food) ? parsed.food.slice(0, 8) : [],
        funFact: parsed.funFact ?? "",
      },
      error: null,
    };
  } catch (e) {
    return { context: null, error: e instanceof Error ? e.message : "AI request failed" };
  }
}
