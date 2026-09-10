-- FOUNDMONEY and RECLAIM used to be a client-side bypass list in src/lib/inviteCode.ts
-- (removed — it shipped in the JS bundle, so anyone reading devtools could use it to
-- mint unlimited free-trial accounts). Since these codes may already be circulating in
-- marketing material, seed them as real server-validated codes instead of just deleting
-- them, so anyone who already has one still gets in — through the actual redeem_beta_code
-- path this time, with a real, enforceable use limit.
INSERT INTO public.beta_codes (code, max_uses) VALUES
    ('FOUNDMONEY', 1000),
    ('RECLAIM', 1000)
ON CONFLICT (code) DO NOTHING;
