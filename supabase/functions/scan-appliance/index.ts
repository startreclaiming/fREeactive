// Reclaim — Home: appliance rating-plate scan (AI vision).
// Accepts a base64 photo of a rating/serial plate, returns structured appliance data.
// Uses the same ANTHROPIC_API_KEY secret as ai-assistant and scan-bill.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { imageBase64, mediaType } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "Missing imageBase64" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 800,
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
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Anthropic API error");

    // claude-sonnet-5 can return a "thinking" block before the "text" block, so the
    // text is not reliably at index 0 — find it by type instead.
    const textBlock = Array.isArray(data.content) ? data.content.find((b: { type?: string }) => b.type === "text") : null;
    let raw = (textBlock?.text || "").trim();
    raw = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

    let appliance;
    try {
      appliance = JSON.parse(raw);
    } catch {
      appliance = { brand: "", modelName: "", modelNumber: null, serialNumber: null, category: "Other", manufactureYear: null };
    }

    return new Response(JSON.stringify({ appliance }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
