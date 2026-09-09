-- Anonymous usage analytics: how free users are actually leveraging the app,
-- with no account or email required. Written by src/lib/usageTracking.ts.
--
-- referrer_id/sector_zip are free-text (not FK-constrained) so an anonymous
-- write never fails just because a referral code doesn't resolve to a row in
-- flyer_analytics — they exist purely to let the two tables be cross-referenced
-- when both are populated.

CREATE TABLE IF NOT EXISTS public.usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    pillar TEXT NOT NULL CHECK (pillar IN ('home', 'money', 'resolve', 'community', 'general')),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    referrer_id TEXT,
    sector_zip TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_usage_events_session ON public.usage_events(session_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_type ON public.usage_events(event_type);
CREATE INDEX IF NOT EXISTS idx_usage_events_created ON public.usage_events(created_at);

ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

-- Anonymous, insert-only: anyone can log a usage event, nobody can read/update/delete
-- through the client API (analytics are read via the dashboard/service role only).
CREATE POLICY "anyone can insert usage events" ON public.usage_events
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
