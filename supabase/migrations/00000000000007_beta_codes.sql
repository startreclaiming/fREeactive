-- Beta invite codes (src/lib/inviteCode.ts's redeem_beta_code RPC path — the
-- FOUNDMONEY/RECLAIM bypass codes are checked client-side before this ever runs).
-- No public policies: only the SECURITY DEFINER function below may touch this table.

CREATE TABLE IF NOT EXISTS public.beta_codes (
    code TEXT PRIMARY KEY,
    max_uses INTEGER NOT NULL DEFAULT 1,
    used_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.beta_codes ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.redeem_beta_code(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.beta_codes%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.beta_codes WHERE code = upper(trim(p_code)) FOR UPDATE;
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  IF v_row.used_count >= v_row.max_uses THEN
    RETURN false;
  END IF;
  UPDATE public.beta_codes SET used_count = used_count + 1 WHERE code = v_row.code;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_beta_code(TEXT) TO anon, authenticated;

-- Seed one generous demo code so signup works out of the box beyond the two
-- hardcoded bypass codes.
INSERT INTO public.beta_codes (code, max_uses) VALUES ('WELCOME', 1000)
ON CONFLICT (code) DO NOTHING;
