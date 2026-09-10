// Reclaim — Bill Scan (AI vision)
// Accepts a base64 image, returns structured bill data + disputable-charge flags.
// Uses the same ANTHROPIC_API_KEY secret as the ai-assistant function.

import { corsHeaders } from "../_shared/cors.ts";
import { callClaude, parseJSONResponse } from "../_shared/anthropic.ts";
import { checkRateLimit } from "../_shared/rateLimit.ts";

const MAX_IMAGE_BASE64_LENGTH = 8_000_000; // ~6MB decoded — generous for a 1600px JPEG at 0.82 quality

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { imageBase64, mediaType } = await req.json();
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(JSON.stringify({ error: "Missing imageBase64" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (imageBase64.length > MAX_IMAGE_BASE64_LENGTH) {
      return new Response(JSON.stringify({ error: "Image too large" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allowed = await checkRateLimit(req, "scan-bill", 15);
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded — please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { text } = await callClaude({
      system:
        "You are a meticulous bill-reading assistant for consumers. Read the bill accurately and flag charges that look disputable (late fees, unexplained or duplicate charges, rate increases, fees for services not used). Respond with ONLY a JSON object — no prose, no markdown, no code fences.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType || "image/jpeg", data: imageBase64 },
            },
            {
              type: "text",
              text:
                'Extract this bill as JSON with exactly this shape: ' +
                '{"doc_type": string, "vendor": string, "date": string|null, "currency": string|null, "total": number|null, ' +
                '"line_items": [{"label": string, "amount": number}], ' +
                '"flags": [{"label": string, "reason": string, "severity": "confirm"|"dispute"}], ' +
                '"verdict": "clear"|"review"|"vampire"}. ' +
                '"doc_type" is a short description of what the document is (e.g. "utility bill", "receipt", "invoice"). ' +
                'Set "severity" to "dispute" for charges you are fairly confident are wrong/overcharged, "confirm" for ones the customer should just double-check. ' +
                'Set "verdict" to "vampire" if there is at least one "dispute"-severity flag, "review" if there are only "confirm"-severity flags, "clear" if there is nothing to flag. ' +
                "Amounts must be plain numbers with no currency symbols. If nothing looks disputable, return an empty flags array and verdict \"clear\".",
            },
          ],
        },
      ],
      maxTokens: 1200,
    });

    const bill = parseJSONResponse(text, {
      doc_type: "", vendor: "", date: null, currency: null, total: null, line_items: [], flags: [], verdict: "review", _raw: text,
    });

    return new Response(JSON.stringify({ bill }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
