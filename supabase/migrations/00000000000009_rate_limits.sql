-- The AI edge functions (ai-assistant, scan-bill, scan-appliance, structure-timeline)
-- are intentionally callable without signing in — anonymous instant-analysis is the
-- core FREEactive product, not a bug. But that also means the public anon key
-- (shipped in the client bundle) lets anyone call them directly and run up
-- unlimited, unmetered Anthropic usage. This is a cost/abuse guard, not a paywall:
-- it limits calls per source IP per hour rather than requiring an account.

CREATE TABLE IF NOT EXISTS public.rate_limit_events (
    id BIGSERIAL PRIMARY KEY,
    identifier TEXT NOT NULL,
    action TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rate_limit_events_lookup ON public.rate_limit_events (identifier, action, created_at);

ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;
-- No client-facing policies — this table is only ever touched via the
-- SECURITY DEFINER function below, never read or written directly.

CREATE OR REPLACE FUNCTION public.check_rate_limit(p_identifier TEXT, p_action TEXT, p_max_per_hour INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INT;
BEGIN
  DELETE FROM public.rate_limit_events WHERE created_at < now() - interval '1 hour';

  SELECT count(*) INTO recent_count
  FROM public.rate_limit_events
  WHERE identifier = p_identifier AND action = p_action AND created_at > now() - interval '1 hour';

  IF recent_count >= p_max_per_hour THEN
    RETURN false;
  END IF;

  INSERT INTO public.rate_limit_events (identifier, action) VALUES (p_identifier, p_action);
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, TEXT, INT) TO anon, authenticated;
