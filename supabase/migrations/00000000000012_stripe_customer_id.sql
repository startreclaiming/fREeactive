-- The webhook could only ever move subscription_status forward (to 'active') on
-- checkout.session.completed — there was no way to react to a cancellation or a
-- failed renewal, because we never stored which Stripe customer a profile belongs
-- to. Without that link, a later customer.subscription.deleted/updated event has
-- no reliable way to find the right row (email matching alone is fragile — see
-- 00000000000008's unique constraint fix for why). Store it once at checkout time.
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
CREATE INDEX IF NOT EXISTS user_profiles_stripe_customer_id_idx ON public.user_profiles (stripe_customer_id);

-- Client-writable columns are an explicit allowlist (see 00000000000008) — this
-- column is deliberately left out of that GRANT, so no REVOKE is needed here.
