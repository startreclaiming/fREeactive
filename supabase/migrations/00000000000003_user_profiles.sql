-- User profiles: trial/subscription state, notification prefs, and the stat
-- counters UserProfile.tsx displays. One row per auth.users row.

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    neighborhood TEXT,
    notify_maintenance BOOLEAN NOT NULL DEFAULT true,
    notify_bills BOOLEAN NOT NULL DEFAULT true,
    notify_community BOOLEAN NOT NULL DEFAULT true,
    notify_legal BOOLEAN NOT NULL DEFAULT true,
    notify_email BOOLEAN NOT NULL DEFAULT false,
    home_progress INT NOT NULL DEFAULT 0,
    money_progress INT NOT NULL DEFAULT 0,
    rights_progress INT NOT NULL DEFAULT 0,
    community_progress INT NOT NULL DEFAULT 0,
    total_saved NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_recovered NUMERIC(12,2) NOT NULL DEFAULT 0,
    guides_completed INT NOT NULL DEFAULT 0,
    disputes_filed INT NOT NULL DEFAULT 0,
    legal_actions INT NOT NULL DEFAULT 0,
    neighbors_helped INT NOT NULL DEFAULT 0,
    trial_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    trial_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
    subscription_status TEXT NOT NULL DEFAULT 'none',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-provision a profile (with a 14-day trial) on signup, regardless of which
-- signup path was used — AuthModal.tsx never inserted one itself, and
-- AuthScreen.tsx's manual insert used the wrong column name (user_id instead of
-- id), so neither path reliably created this row before. A DB trigger is the
-- single source of truth instead.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name, trial_start, trial_end)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    now(),
    now() + interval '14 days'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- This must only ever run via the trigger above, never as a public RPC endpoint.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
