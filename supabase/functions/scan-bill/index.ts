// Reclaim — Bill Scan (AI vision)
// Accepts a base64 image, returns structured bill data + disputable-charge flags.
// Uses the same ANTHROPIC_API_KEY secret as the ai-assistant function.

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
        max_tokens: 1200,
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
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Anthropic API error");

    // claude-sonnet-5 can return a "thinking" block before the "text" block, so the
    // text is not reliably at index 0 — find it by type instead.
    const textBlock = Array.isArray(data.content) ? data.content.find((b: { type?: string }) => b.type === "text") : null;
    let raw = (textBlock?.text || "").trim();
    raw = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

    let bill;
    try {
      bill = JSON.parse(raw);
    } catch {
      bill = { doc_type: "", vendor: "", date: null, currency: null, total: null, line_items: [], flags: [], verdict: "review", _raw: raw };
    }

    return new Response(JSON.stringify({ bill }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
