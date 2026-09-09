-- search_log: anonymous analytics for the Alameda search funnel (AlamedaLanding.tsx).
CREATE TABLE IF NOT EXISTS public.search_log (
    id BIGSERIAL PRIMARY KEY,
    search_term TEXT,
    result_count INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.search_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can log a search" ON public.search_log
    FOR INSERT TO anon, authenticated WITH CHECK (true);

-- search_profiles: the self/family people a signed-in user has asked Reclaim to
-- track for unclaimed-property matches (UnclaimedCheck.tsx → save_search_profiles RPC).
CREATE TABLE IF NOT EXISTS public.search_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    relationship TEXT NOT NULL,
    full_name TEXT NOT NULL,
    address_line TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.search_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own search profiles" ON public.search_profiles
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.save_search_profiles(p_profiles JSONB)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Must be signed in to save search profiles';
  END IF;

  FOR profile IN SELECT * FROM jsonb_array_elements(p_profiles)
  LOOP
    INSERT INTO public.search_profiles (user_id, relationship, full_name, address_line, city, state, zip)
    VALUES (
      auth.uid(),
      profile->>'relationship',
      profile->>'full_name',
      profile->>'address_line',
      profile->>'city',
      profile->>'state',
      profile->>'zip'
    );
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_search_profiles(JSONB) TO authenticated;
