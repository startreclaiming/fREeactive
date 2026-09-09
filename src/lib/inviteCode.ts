import { supabase } from './supabase';

// Bypass keys that don't consume a beta invite (e.g. for demos/support).
const BYPASS_CODES = ['FOUNDMONEY', 'RECLAIM'];

export type InviteCodeResult = { valid: boolean; error?: string };

/** Single source of truth for invite-code validation, used by both AuthModal and AuthScreen. */
export async function validateInviteCode(code: string): Promise<InviteCodeResult> {
  const sanitized = code.trim().toUpperCase();
  if (!sanitized) return { valid: false, error: 'Enter your invite code.' };

  if (BYPASS_CODES.includes(sanitized)) return { valid: true };

  const { data, error } = await supabase.rpc('redeem_beta_code', { p_code: code.trim() });
  if (error) return { valid: false, error: 'Could not verify the invite code. Please try again.' };
  return data
    ? { valid: true }
    : { valid: false, error: "That invite code isn't valid or has been used up." };
}
