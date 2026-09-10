// Reclaim's AI edge functions (ai-assistant, scan-bill, scan-appliance,
// structure-timeline) are deliberately callable without signing in — anonymous
// instant analysis is the core FREEactive product, not an oversight. But the
// public anon key ships in the client bundle, so without a guard anyone could
// call these directly and run unlimited, unmetered Anthropic usage. This limits
// calls per source IP per hour instead of requiring an account.

import { createClient } from "npm:@supabase/supabase-js@2";

export async function checkRateLimit(req: Request, action: string, maxPerHour: number): Promise<boolean> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) return true; // fail open rather than break the app if misconfigured

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    const client = createClient(supabaseUrl, anonKey);
    const { data, error } = await client.rpc("check_rate_limit", {
      p_identifier: ip,
      p_action: action,
      p_max_per_hour: maxPerHour,
    });
    if (error) return true; // fail open — never block real users over a logging hiccup
    return data === true;
  } catch {
    return true;
  }
}
