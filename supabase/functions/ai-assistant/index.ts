import { corsHeaders } from "../_shared/cors.ts";
import { callClaude } from "../_shared/anthropic.ts";
import { checkRateLimit } from "../_shared/rateLimit.ts";

const MAX_PROMPT_LENGTH = 4000;
const MAX_CONTEXT_LENGTH = 2000;

const SYSTEM_PROMPTS: Record<string, string> = {
  money:
    "You are a financial analysis expert specializing in helping consumers identify billing errors, overcharges, and hidden fees. " +
    "Your role is to analyze bills and statements for errors, identify hidden fees, duplicate charges, and rate increases, provide " +
    "specific, actionable recommendations, and help draft formal dispute letters. Be thorough but concise. Focus on high-impact issues " +
    "that can be disputed.",
  home:
    "You are a home maintenance and appliance-care expert. Help the user diagnose problems with appliances, HVAC, plumbing, and other " +
    "household systems, recommend safe DIY steps versus when to call a professional, and explain warranty and recall considerations. " +
    "Be practical and safety-conscious.",
  resolve:
    "You are a legal empowerment guide helping self-represented people understand their rights and next steps (tenancy, consumer, " +
    "employment, family, benefits). Explain plainly, cite the general area of law when relevant, help structure a chronological account " +
    "of events, and always note you are not a substitute for a licensed attorney for anything case-specific.",
  community:
    "You are a community-organizing advisor helping neighbors coordinate, share resources, and respond to local issues (outages, safety, " +
    "mutual aid). Give practical, actionable guidance for organizing a small group of neighbors.",
};
const DEFAULT_SYSTEM_PROMPT = SYSTEM_PROMPTS.money;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    if (!body.prompt || typeof body.prompt !== "string") {
      return new Response(JSON.stringify({ error: "Missing prompt" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (body.prompt.length > MAX_PROMPT_LENGTH) {
      return new Response(JSON.stringify({ error: "Prompt too long" }), {
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
    const systemPrompt = SYSTEM_PROMPTS[pillar] || DEFAULT_SYSTEM_PROMPT;
    const userContent = body.context ? `Context: ${body.context}\n\nQuestion: ${body.prompt}` : body.prompt;

    const { text, usage } = await callClaude({
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
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
