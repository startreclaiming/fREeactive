// supabase-js's client always sends `apikey` and `x-client-info` alongside
// `Authorization`/`Content-Type` — omitting them here fails the browser's CORS
// preflight before the request ever reaches this function. This is easy to miss
// entirely in local testing: curl doesn't do CORS preflight, and Playwright's
// mocked routes don't enforce it the way a real browser does, so this only shows
// up against an actual deployed frontend.
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
