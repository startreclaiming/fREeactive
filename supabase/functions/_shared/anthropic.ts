// Shared Anthropic call + response-parsing helpers, used by every Reclaim edge
// function that talks to Claude (ai-assistant, scan-bill, scan-appliance,
// structure-timeline) so the request shape, error handling, and the
// thinking-block-before-text-block quirk are only maintained in one place.

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string | Array<Record<string, unknown>>;
}

export interface ClaudeResult {
  text: string;
  usage: { input_tokens: number; output_tokens: number };
}

export async function callClaude(opts: {
  system: string;
  messages: ClaudeMessage[];
  maxTokens: number;
}): Promise<ClaudeResult> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: opts.maxTokens,
      system: opts.system,
      messages: opts.messages,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Anthropic API error");

  // claude-sonnet-5 can return a "thinking" block before the "text" block, so the
  // text is not reliably at index 0 — find it by type instead.
  const textBlock = Array.isArray(data.content)
    ? data.content.find((b: { type?: string }) => b.type === "text")
    : null;

  return { text: textBlock?.text || "", usage: data.usage };
}

/** Strips a ```json fence (if present) and parses, falling back if the model didn't return clean JSON. */
export function parseJSONResponse<T>(raw: string, fallback: T): T {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}
