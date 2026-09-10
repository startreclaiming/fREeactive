// Reclaim — Resolve: structure a spoken/typed account into a chronological event timeline.
// Uses the same ANTHROPIC_API_KEY secret as ai-assistant and scan-bill.

import { corsHeaders } from "../_shared/cors.ts";
import { callClaude, parseJSONResponse } from "../_shared/anthropic.ts";
import { checkRateLimit } from "../_shared/rateLimit.ts";

const MAX_TRANSCRIPT_LENGTH = 8000;
const MAX_PRIOR_EVENTS = 200;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { transcript, priorEvents } = await req.json();
    if (!transcript || typeof transcript !== "string") {
      return new Response(JSON.stringify({ error: "Missing transcript" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (transcript.length > MAX_TRANSCRIPT_LENGTH) {
      return new Response(JSON.stringify({ error: "Transcript too long" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const events = Array.isArray(priorEvents) ? priorEvents.slice(0, MAX_PRIOR_EVENTS) : [];

    const allowed = await checkRateLimit(req, "structure-timeline", 15);
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded — please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const priorContext = events.length
      ? `\n\nEvents already logged for this case (keep these, only add new ones from the new account below, and re-sort everything chronologically):\n${JSON.stringify(events)}`
      : "";

    const { text } = await callClaude({
      system:
        "You help self-represented litigants and tenants turn a plain-speech account of their situation into a clean, chronological timeline for a court filing. " +
        "Extract discrete events with dates where mentioned (use the person's own wording for what happened, keep it factual and neutral, not argumentative). " +
        "If no date is given for an event, infer a relative order but leave the date field null rather than guessing a real date. " +
        "Respond with ONLY a JSON object — no prose, no markdown, no code fences.",
      messages: [
        {
          role: "user",
          content:
            `Here is the person's account, in their own words:\n"""${transcript}"""${priorContext}\n\n` +
            'Return JSON with exactly this shape: {"events": [{"date": string|null, "description": string, "category": string}]}. ' +
            '"category" should be a short label like "Notice", "Communication", "Payment", "Damage", "Deadline", or similar. Sort events chronologically (undated events last, in the order implied by the account).',
        },
      ],
      maxTokens: 1500,
    });

    const result = parseJSONResponse(text, { events: [], _raw: text });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
