// Reclaim — Home: appliance rating-plate scan (AI vision).
// Accepts a base64 photo of a rating/serial plate, returns structured appliance data.
// Uses the same ANTHROPIC_API_KEY secret as ai-assistant and scan-bill.

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

    const allowed = await checkRateLimit(req, "scan-appliance", 15);
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded — please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { text } = await callClaude({
      system:
        "You read appliance rating plates / serial tags from photos for a home-maintenance app. " +
        "Extract brand, model, serial number, and a best-guess category from this fixed list: Appliance, Electronics, HVAC, Plumbing, Furniture, Other. " +
        "If a manufacture date or date code is visible, extract the year only (as a 4-digit string) — do not guess a year if none is visible. " +
        "Respond with ONLY a JSON object — no prose, no markdown, no code fences.",
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
                'Extract this rating plate as JSON with exactly this shape: ' +
                '{"brand": string, "modelName": string, "modelNumber": string|null, "serialNumber": string|null, "category": string, "manufactureYear": string|null}. ' +
                '"modelName" should be a short human-friendly label like "Front-Load Washer" or "40-Gallon Water Heater", not the raw model number. ' +
                'If the image is unreadable or not a rating plate, return brand and modelName as empty strings.',
            },
          ],
        },
      ],
      maxTokens: 800,
    });

    const appliance = parseJSONResponse(text, {
      brand: "", modelName: "", modelNumber: null, serialNumber: null, category: "Other", manufactureYear: null,
    });

    return new Response(JSON.stringify({ appliance }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
