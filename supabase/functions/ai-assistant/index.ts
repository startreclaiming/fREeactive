Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const body = await req.json();

    if (!body.prompt) {
      return new Response(
        JSON.stringify({ error: "Missing prompt" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
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
        max_tokens: 1500,
        system: `You are a financial analysis expert specializing in helping consumers identify billing errors, overcharges, and hidden fees. 
        
Your role is to:
- Analyze bills and statements for errors and overcharges
- Identify hidden fees, duplicate charges, and rate increases
- Provide specific, actionable recommendations
- Help draft formal dispute letters

Be thorough but concise. Focus on high-impact issues that can be disputed.`,
        messages: [
          {
            role: "user",
            content: body.prompt,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "API error");
    }

    // claude-sonnet-5 can return a "thinking" block before the "text" block, so the
    // text is not reliably at index 0 — find it by type instead.
    const textBlock = Array.isArray(data.content) ? data.content.find((b: { type?: string }) => b.type === "text") : null;

    return new Response(
      JSON.stringify({
        response: textBlock?.text || "",
        tokens: {
          input: data.usage.input_tokens,
          output: data.usage.output_tokens,
        },
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});