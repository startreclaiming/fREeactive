-- The "users can update own profile" RLS policy (00000000000003) restricts which
-- ROW a client can update (auth.uid() = id) but not which COLUMNS — RLS's USING
-- clause cannot express column-level rules. That meant any authenticated user
-- could run `update user_profiles set subscription_status='active'` directly
-- from the browser and grant themselves PROactive for free, or rewrite their own
-- stat counters, completely bypassing the Stripe webhook.
--
-- Postgres column-level GRANTs are checked independently of RLS, so restrict the
-- UPDATE grant itself to only the fields a user should ever change client-side.
-- Billing/entitlement/stat fields become writable only by the service role
-- (the Stripe webhook, and any future SECURITY DEFINER function).
REVOKE UPDATE ON public.user_profiles FROM authenticated;
GRANT UPDATE (
    display_name,
    neighborhood,
    notify_maintenance,
    notify_bills,
    notify_community,
    notify_legal,
    notify_email
) ON public.user_profiles TO authenticated;

-- Defense in depth for the Stripe webhook's email-fallback match: prevent two
-- profiles from ever sharing an email, so `.eq('email', email)` can only ever
-- match a single, correct row (NULLs are still allowed to repeat).
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_email_unique UNIQUE (email);
