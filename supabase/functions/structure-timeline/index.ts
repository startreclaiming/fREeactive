// Reclaim — Resolve: structure a spoken/typed account into a chronological event timeline.
// Uses the same ANTHROPIC_API_KEY secret as ai-assistant and scan-bill.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { transcript, priorEvents } = await req.json();
    if (!transcript || typeof transcript !== "string") {
      return new Response(JSON.stringify({ error: "Missing transcript" }), {
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

    const priorContext = Array.isArray(priorEvents) && priorEvents.length
      ? `\n\nEvents already logged for this case (keep these, only add new ones from the new account below, and re-sort everything chronologically):\n${JSON.stringify(priorEvents)}`
      : "";

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1500,
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
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Anthropic API error");

    // claude-sonnet-5 can return a "thinking" block before the "text" block, so the
    // text is not reliably at index 0 — find it by type instead.
    const textBlock = Array.isArray(data.content) ? data.content.find((b: { type?: string }) => b.type === "text") : null;
    let raw = (textBlock?.text || "").trim();
    raw = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      result = { events: [], _raw: raw };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
