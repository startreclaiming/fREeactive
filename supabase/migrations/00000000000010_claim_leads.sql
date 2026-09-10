-- Dashboard.tsx's "Send my claim guide" flow used to POST to a `send-claim-email`
-- edge function that was never actually built, so the Alameda funnel's core
-- conversion CTA 404'd every single time. There's no email-sending provider
-- (Resend/SendGrid/etc) wired into this project, so rather than fabricate one,
-- the fix is to genuinely capture the lead server-side: store it here, and be
-- honest in the UI that it's a saved request rather than a sent email.

CREATE TABLE IF NOT EXISTS public.claim_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    properties JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.claim_leads ENABLE ROW LEVEL SECURITY;

-- Anonymous visitors can submit a lead but never read them back — this is a
-- write-only intake table, same pattern as flyer_analytics/usage_events.
CREATE POLICY "anyone can submit a claim lead" ON public.claim_leads
    FOR INSERT WITH CHECK (true);
