// Reclaim — PROactive subscription webhook.
// Verifies the Stripe webhook signature (manually, via Web Crypto — no Stripe SDK
// dependency) and flips subscription_status to 'active' on checkout.session.completed.
//
// Requires these Supabase function secrets to be set before this does anything real:
//   STRIPE_WEBHOOK_SECRET   — from the Stripe Dashboard's webhook endpoint config
//   SUPABASE_SERVICE_ROLE_KEY — needed to update user_profiles bypassing RLS
//
// Point the Stripe webhook endpoint at this function's URL, subscribed to at least
// checkout.session.completed.

import { createClient } from 'npm:@supabase/supabase-js@2';

async function verifyStripeSignature(payload: string, header: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=')) as [string, string][]);
  const timestamp = parts['t'];
  const signature = parts['v1'];
  if (!timestamp || !signature) return false;

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data?.object || {};
    // client_reference_id should be set to the Supabase user id when creating the
    // Checkout Session / Payment Link redirect, so we know who just paid.
    const userId = session.client_reference_id as string | undefined;
    const email = (session.customer_details as { email?: string } | undefined)?.email;

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    if (userId) {
      await supabase.from('user_profiles').update({ subscription_status: 'active' }).eq('id', userId);
    } else if (email) {
      await supabase.from('user_profiles').update({ subscription_status: 'active' }).eq('email', email);
    }
  }

  return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
});
