-- Unclaimed-property datasets. Two tables, matching two real consumers that
-- turned out to assume different column shapes for the same kind of data:
--   - discoveryService.ts / Dashboard.tsx expect `last_known_address` (text) and
--     no lat/lng — this is the statewide CA SCO ledger.
--   - Map.tsx / Connect4Community.tsx expect `address` + numeric `latitude`/
--     `longitude` for map clustering.
-- ca_unclaimed_property below is a superset covering both rather than picking
-- one consumer over the other. `alameda_property_cache` is the separate,
-- narrower Alameda-only cache used by the door-flyer campaign funnel.
--
-- Both are read-only from the client (public SELECT) — rows are populated by a
-- data-import job, not by app users. Numeric BIGSERIAL ids (not UUID) because
-- Dashboard.tsx/Map.tsx already type `id` as a number.

CREATE TABLE IF NOT EXISTS public.ca_unclaimed_property (
    id BIGSERIAL PRIMARY KEY,
    property_id TEXT,
    owner_name TEXT NOT NULL,
    holder_name TEXT,
    property_type TEXT,
    amount NUMERIC(12,2) DEFAULT 0,
    reported_year INTEGER,
    last_known_address TEXT,
    address TEXT,
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ca_unclaimed_owner_name ON public.ca_unclaimed_property(owner_name);
CREATE INDEX IF NOT EXISTS idx_ca_unclaimed_latlng ON public.ca_unclaimed_property(latitude, longitude);

ALTER TABLE public.ca_unclaimed_property ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public can read ca unclaimed property" ON public.ca_unclaimed_property
    FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.alameda_property_cache (
    id BIGSERIAL PRIMARY KEY,
    owner_name TEXT NOT NULL,
    holder_name TEXT,
    last_known_address TEXT,
    amount NUMERIC(12,2) DEFAULT 0,
    property_type TEXT,
    zipcode INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alameda_owner_name ON public.alameda_property_cache(owner_name);
CREATE INDEX IF NOT EXISTS idx_alameda_zipcode ON public.alameda_property_cache(zipcode);

ALTER TABLE public.alameda_property_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public can read alameda property cache" ON public.alameda_property_cache
    FOR SELECT TO anon, authenticated USING (true);
