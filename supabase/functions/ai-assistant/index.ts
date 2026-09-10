import { corsHeaders } from "../_shared/cors.ts";
import { callClaude, ClaudeMessage } from "../_shared/anthropic.ts";
import { checkRateLimit } from "../_shared/rateLimit.ts";

const MAX_PROMPT_LENGTH = 4000;
const MAX_CONTEXT_LENGTH = 2000;
const MAX_IMAGE_BASE64_LENGTH = 8_000_000; // ~6MB decoded

const PLAIN_LANGUAGE_RULE =
  "Write for someone with no legal, financial, or technical background — plain everyday words, no jargon or acronyms " +
  "(don't say things like \"FOIA request\" or \"small claims\" without explaining what it means in one short phrase). " +
  "Keep it short enough to read comfortably on a phone screen.";

const SYSTEM_PROMPTS: Record<string, string> = {
  money:
    "You are a financial analysis expert specializing in helping consumers identify billing errors, overcharges, and hidden fees. " +
    "Your role is to analyze bills and statements for errors, identify hidden fees, duplicate charges, and rate increases, provide " +
    "specific, actionable recommendations, and help draft formal dispute letters. Be thorough but concise. Focus on high-impact issues " +
    "that can be disputed. " + PLAIN_LANGUAGE_RULE,
  home:
    "You are a home maintenance and appliance-care expert. Help the user diagnose problems with appliances, HVAC, plumbing, and other " +
    "household systems, recommend safe DIY steps versus when to call a professional, and explain warranty and recall considerations. " +
    "Be practical and safety-conscious. " + PLAIN_LANGUAGE_RULE,
  resolve:
    "You are a legal empowerment guide helping self-represented people understand their rights and next steps (tenancy, consumer, " +
    "employment, family, benefits). Explain plainly, help structure a chronological account of events, and always note you are not a " +
    "substitute for a licensed attorney for anything case-specific. " + PLAIN_LANGUAGE_RULE,
  community:
    "You are a community-organizing advisor helping neighbors coordinate, share resources, and respond to local issues (outages, safety, " +
    "mutual aid). Give practical, actionable guidance for organizing a small group of neighbors. " + PLAIN_LANGUAGE_RULE,
};

// Used whenever the domain isn't already known (a typed/spoken message that didn't
// clearly match one of the four areas above).
const GENERAL_SYSTEM_PROMPT =
  "You are Reclaim, an instant-help assistant. The user has sent a spoken or typed message about a problem — it could be about their " +
  "home or an appliance, their money (a bill, fee, or subscription), their legal or tenant rights, or their community/neighbors. Work " +
  "out which of those it is yourself; you don't need to announce it. " +
  "If you need one specific detail to give a genuinely useful answer, ask exactly one short, specific clarifying question instead of " +
  "guessing. Otherwise, give a direct, specific, actionable response right away. " + PLAIN_LANGUAGE_RULE;

// The flagship free feature: scan an appliance's rating plate and get real value back
// immediately — this is the concrete shape that response should take, not a generic reply.
const IMAGE_SYSTEM_PROMPT =
  "You are Reclaim, an instant-help assistant. The user just took a photo. Most often it's an appliance or equipment rating/serial " +
  "plate (water heater, furnace, dishwasher, HVAC unit, etc.) or a document like a bill or notice — figure out which. " +
  "If it's an appliance or equipment nameplate, identify: the manufacturer and model, roughly when it was made (from any date code or " +
  "manufacture date visible), its typical expected lifespan for that type of equipment, common issues or failure points for that type " +
  "or brand if you know of any, and 2-3 concrete recommended maintenance actions. Present these as short, clearly labeled points, not " +
  "a wall of text — that is the core value this feature is meant to deliver, so give it directly whenever the plate is readable. " +
  "If it's a bill, receipt, or notice instead, read it and point out anything worth double-checking or disputing (unexpected fees, " +
  "rate increases, deadlines). " +
  "Only ask a clarifying question if the photo is genuinely unclear or unreadable — don't ask when you can just answer. " + PLAIN_LANGUAGE_RULE;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    const hasPrompt = typeof body.prompt === "string" && body.prompt.length > 0;
    const hasImage = typeof body.imageBase64 === "string" && body.imageBase64.length > 0;
    if (!hasPrompt && !hasImage) {
      return new Response(JSON.stringify({ error: "Missing prompt or image" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (hasPrompt && body.prompt.length > MAX_PROMPT_LENGTH) {
      return new Response(JSON.stringify({ error: "Prompt too long" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (hasImage && body.imageBase64.length > MAX_IMAGE_BASE64_LENGTH) {
      return new Response(JSON.stringify({ error: "Image too large" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (body.context && (typeof body.context !== "string" || body.context.length > MAX_CONTEXT_LENGTH)) {
      return new Response(JSON.stringify({ error: "Context too long" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allowed = await checkRateLimit(req, "ai-assistant", 30);
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded — please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pillar = typeof body.pillar === "string" ? body.pillar : "";
    // scanOrigin covers follow-up turns in a photo-started conversation, where this
    // particular request has no new image attached but should keep the same framing.
    const systemPrompt = hasImage || body.scanOrigin === true
      ? IMAGE_SYSTEM_PROMPT
      : SYSTEM_PROMPTS[pillar] || GENERAL_SYSTEM_PROMPT;
    const textPart = body.context ? `Context: ${body.context}\n\nQuestion: ${body.prompt}` : (body.prompt || "What is this, and what should I do?");

    const userContent: ClaudeMessage["content"] = hasImage
      ? [
          { type: "image", source: { type: "base64", media_type: body.mediaType || "image/jpeg", data: body.imageBase64 } },
          { type: "text", text: textPart },
        ]
      : textPart;

    const priorMessages: ClaudeMessage[] = Array.isArray(body.history)
      ? body.history
          .filter((m: unknown): m is { role: string; content: string } =>
            !!m && typeof m === "object" && typeof (m as { role?: unknown }).role === "string" && typeof (m as { content?: unknown }).content === "string")
          .slice(-10)
          .map((m: { role: string; content: string }) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content.slice(0, MAX_PROMPT_LENGTH),
          }))
      : [];

    const { text, usage } = await callClaude({
      system: systemPrompt,
      messages: [...priorMessages, { role: "user", content: userContent }],
      maxTokens: 1500,
    });

    return new Response(
      JSON.stringify({
        response: text,
        tokens: { input: usage.input_tokens, output: usage.output_tokens },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
