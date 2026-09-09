-- Referral scan/conversion tracking, shared by the physical Alameda door-flyer
-- campaign and the digital landing-page QR code.
-- Recovered from a misplaced src/components/CountyGate.tsx (a .tsx file that
-- actually contained raw SQL, not a component) during the OS-alignment cleanup.
--
-- `clean_street` now defaults to '' and `source` was added so one table can
-- represent both a physical per-street flyer scan and a street-less digital
-- QR/link scan, while keeping the unique constraint usable for upsert-style
-- scan-count increments (a nullable column would break that — NULL <> NULL).

CREATE TABLE IF NOT EXISTS public.flyer_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sector_zip VARCHAR(10) NOT NULL,
    clean_street TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT 'flyer' CHECK (source IN ('flyer', 'landing_qr', 'social_share')),
    scan_count INT DEFAULT 0 NOT NULL,
    conversion_count INT DEFAULT 0 NOT NULL,
    total_capital_recovered NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_referrer_sector UNIQUE (referrer_id, sector_zip, clean_street, source)
);

CREATE INDEX IF NOT EXISTS idx_flyer_referrer ON public.flyer_analytics(referrer_id);

ALTER TABLE public.flyer_analytics ENABLE ROW LEVEL SECURITY;

-- Anonymous, insert-only, same pattern as usage_events — anyone can log a scan,
-- only the dashboard/service role can read the analytics.
CREATE POLICY "anyone can log a flyer scan" ON public.flyer_analytics
    FOR INSERT TO anon, authenticated WITH CHECK (true);
