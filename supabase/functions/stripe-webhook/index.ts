// Reclaim — PROactive subscription webhook.
// Verifies the Stripe webhook signature (manually, via Web Crypto — no Stripe SDK
// dependency) and keeps subscription_status in sync with Stripe: 'active' on
// checkout.session.completed, and back down to 'canceled'/'past_due' when Stripe
// reports a cancellation or failed renewal — previously only the forward direction
// was handled, so a canceled subscriber kept paid access forever.
//
// Requires these Supabase function secrets to be set before this does anything real:
//   STRIPE_WEBHOOK_SECRET   — from the Stripe Dashboard's webhook endpoint config
//   SUPABASE_SERVICE_ROLE_KEY — needed to update user_profiles bypassing RLS
//
// Point the Stripe webhook endpoint at this function's URL, subscribed to at least
// checkout.session.completed, customer.subscription.updated,
// customer.subscription.deleted, and invoice.payment_failed.

import { createClient } from 'npm:@supabase/supabase-js@2';

const MAX_SIGNATURE_AGE_SECONDS = 5 * 60;

async function verifyStripeSignature(payload: string, header: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=')) as [string, string][]);
  const timestamp = parts['t'];
  const signature = parts['v1'];
  if (!timestamp || !signature) return false;

  // Reject old signatures so a captured/logged webhook payload can't be replayed
  // later to re-activate or re-trigger a subscription change.
  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) return false;
  const ageSeconds = Math.abs(Date.now() / 1000 - timestampSeconds);
  if (ageSeconds > MAX_SIGNATURE_AGE_SECONDS) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
  const expected = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, '0')).join('');

  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!webhookSecret || !supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Webhook not configured — missing secrets' }), { status: 500 });
  }

  const signatureHeader = req.headers.get('Stripe-Signature');
  const payload = await req.text();
  if (!signatureHeader || !(await verifyStripeSignature(payload, signatureHeader, webhookSecret))) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
  }

  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(payload);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  if (event.type === 'checkout.session.completed') {
    const session = event.data?.object || {};
    // client_reference_id should be set to the Supabase user id when creating the
    // Checkout Session / Payment Link redirect, so we know who just paid.
    const userId = session.client_reference_id as string | undefined;
    const email = (session.customer_details as { email?: string } | undefined)?.email;
    const customerId = session.customer as string | undefined;

    const patch = { subscription_status: 'active', ...(customerId ? { stripe_customer_id: customerId } : {}) };
    if (userId) {
      await supabase.from('user_profiles').update(patch).eq('id', userId);
    } else if (email) {
      await supabase.from('user_profiles').update(patch).eq('email', email);
    }
  } else if (event.type === 'customer.subscription.deleted') {
    const sub = event.data?.object || {};
    const customerId = sub.customer as string | undefined;
    if (customerId) {
      await supabase.from('user_profiles').update({ subscription_status: 'canceled' }).eq('stripe_customer_id', customerId);
    }
  } else if (event.type === 'customer.subscription.updated') {
    const sub = event.data?.object || {};
    const customerId = sub.customer as string | undefined;
    const stripeStatus = sub.status as string | undefined;
    if (customerId && stripeStatus) {
      const mapped = stripeStatus === 'active' || stripeStatus === 'trialing'
        ? 'active'
        : stripeStatus === 'past_due' || stripeStatus === 'unpaid'
          ? 'past_due'
          : 'canceled';
      await supabase.from('user_profiles').update({ subscription_status: mapped }).eq('stripe_customer_id', customerId);
    }
  } else if (event.type === 'invoice.payment_failed') {
    const invoice = event.data?.object || {};
    const customerId = invoice.customer as string | undefined;
    if (customerId) {
      await supabase.from('user_profiles').update({ subscription_status: 'past_due' }).eq('stripe_customer_id', customerId);
    }
  }

  return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
});
