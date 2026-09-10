import { supabase } from './supabase';
import { uid } from '../components/reclaim/moduleUtils';

const SESSION_KEY = 'reclaim_session_id';
const REFERRAL_KEY = 'reclaim_referral';

export type Pillar = 'home' | 'money' | 'resolve' | 'community' | 'general';

/** Stable anonymous id for this browser — never tied to an account. */
export function getSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = uid() + uid();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return 'no-storage';
  }
}

export interface Referral {
  referrerId?: string;
  sectorZip?: string;
}

// The referral is effectively constant for the life of a tab — cache it in memory
// after the first resolution instead of re-parsing the URL/sessionStorage on every
// trackEvent call.
let cachedReferral: Referral | null | undefined;

/** Captures ?ref=&zip= from a QR/flyer link on first visit and remembers it for the session. */
export function captureReferralFromUrl(): Referral | null {
  if (cachedReferral !== undefined) return cachedReferral;
  try {
    const params = new URLSearchParams(window.location.search);
    const referrerId = params.get('ref') || undefined;
    const sectorZip = params.get('zip') || undefined;
    if (referrerId || sectorZip) {
      const referral = { referrerId, sectorZip };
      sessionStorage.setItem(REFERRAL_KEY, JSON.stringify(referral));
      cachedReferral = referral;
      return referral;
    }
    const stored = sessionStorage.getItem(REFERRAL_KEY);
    cachedReferral = stored ? JSON.parse(stored) : null;
    return cachedReferral;
  } catch {
    cachedReferral = null;
    return null;
  }
}

/**
 * Fire-and-forget anonymous usage event — how free users are actually leveraging the app.
 * No account required; failures are silently ignored so this never blocks the UI.
 */
export function trackEvent(eventType: string, pillar: Pillar, metadata: Record<string, unknown> = {}): void {
  const referral = captureReferralFromUrl();
  supabase
    .from('usage_events')
    .insert({
      session_id: getSessionId(),
      event_type: eventType,
      pillar,
      metadata,
      referrer_id: referral?.referrerId || null,
      sector_zip: referral?.sectorZip || null,
    })
    .then(() => {}, () => {});
}
