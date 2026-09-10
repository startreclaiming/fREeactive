import { supabase } from './supabase';

export type InviteCodeResult = { valid: boolean; error?: string };

/**
 * Single source of truth for invite-code validation, used by both AuthModal and AuthScreen.
 * Every code — including demo/support codes — must be seeded into the `beta_codes` table
 * and go through `redeem_beta_code` server-side. A client-side bypass list previously lived
 * here, but since it shipped in the JS bundle anyone reading devtools could mint unlimited
 * free-trial accounts with it, defeating the invite gate entirely.
 */
export async function validateInviteCode(code: string): Promise<InviteCodeResult> {
  const sanitized = code.trim().toUpperCase();
  if (!sanitized) return { valid: false, error: 'Enter your invite code.' };

  const { data, error } = await supabase.rpc('redeem_beta_code', { p_code: code.trim() });
  if (error) return { valid: false, error: 'Could not verify the invite code. Please try again.' };
  return data
    ? { valid: true }
    : { valid: false, error: "That invite code isn't valid or has been used up." };
}
