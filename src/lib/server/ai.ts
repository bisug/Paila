import { fetchWithTimeout } from "@/lib/server/guardrails";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionOptions = {
  messages: ChatMessage[];
  responseFormat?: { type: "json_object" };
  temperature?: number;
  timeoutMs?: number;
};

export type ChatCompletionResult = {
  content: string | null;
  status: number;
  error: string | null;
};

export function hasAiProvider() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function createChatCompletion({
  messages,
  responseFormat,
  temperature = 0.2,
  timeoutMs = 12_000,
}: ChatCompletionOptions): Promise<ChatCompletionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { content: null, status: 0, error: "Missing OPENAI_API_KEY" };
  }

  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const res = await fetchWithTimeout(
    `${baseUrl}/chat/completions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        ...(responseFormat ? { response_format: responseFormat } : {}),
      }),
    },
    timeoutMs,
  );

  if (!res.ok) {
    const text = await res.text();
    return {
      content: null,
      status: res.status,
      error: text.slice(0, 300) || `AI provider returned ${res.status}`,
    };
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return {
    content: data.choices?.[0]?.message?.content?.trim() ?? null,
    status: res.status,
    error: null,
  };
}
