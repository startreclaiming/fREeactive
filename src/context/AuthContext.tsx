import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email?: string | null;
  display_name?: string | null;
  neighborhood?: string | null;
  notify_maintenance?: boolean;
  notify_bills?: boolean;
  notify_community?: boolean;
  notify_legal?: boolean;
  notify_email?: boolean;
  created_at?: string;
  home_progress?: number;
  money_progress?: number;
  rights_progress?: number;
  community_progress?: number;
  total_saved?: number;
  total_recovered?: number;
  guides_completed?: number;
  disputes_filed?: number;
  legal_actions?: number;
  neighbors_helped?: number;
  trial_start?: string | null;
  trial_end?: string | null;
  subscription_status?: string | null;
}

export type TrialStatusValue = 'unknown' | 'subscribed' | 'expired' | 'expiring' | 'active';

/** Single source of truth for trial/subscription status — used by AuthContext, TrialBanner and entitlement checks. */
export function getTrialStatus(profile: Pick<UserProfile, 'trial_end' | 'subscription_status'> | null): {
  status: TrialStatusValue;
  daysRemaining: number;
  isActive: boolean;
  isExpired: boolean;
} {
  if (!profile) return { status: 'unknown', daysRemaining: 0, isActive: false, isExpired: false };

  if (profile.subscription_status === 'active' || profile.subscription_status === 'subscribed') {
    return { status: 'subscribed', daysRemaining: 999, isActive: true, isExpired: false };
  }

  if (!profile.trial_end) {
    return { status: 'unknown', daysRemaining: 14, isActive: true, isExpired: false };
  }

  const now = new Date();
  const trialEnd = new Date(profile.trial_end);
  const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft <= 0) return { status: 'expired', daysRemaining: 0, isActive: false, isExpired: true };
  if (daysLeft <= 3) return { status: 'expiring', daysRemaining: daysLeft, isActive: true, isExpired: false };
  return { status: 'active', daysRemaining: daysLeft, isActive: true, isExpired: false };
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  trialStatus: TrialStatusValue;
  trialDaysRemaining: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  // Tracks whose profile is "current" so a slow fetch for a user who has since
  // signed out (or switched accounts) can't land late and resurrect stale data.
  const activeUserIdRef = useRef<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (activeUserIdRef.current !== userId) return;

    if (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      return;
    }
    setProfile(data);
  }, []);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      setSession(session);
      setUser(session?.user ?? null);
      activeUserIdRef.current = session?.user?.id ?? null;
      if (session?.user) {
        // Wait for the profile before clearing `loading`, so the first paint
        // never has to guess at entitlement while it's still in flight.
        await fetchProfile(session.user.id);
      }
      if (!cancelled) setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      activeUserIdRef.current = session?.user?.id ?? null;
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => { cancelled = true; subscription.unsubscribe(); };
  }, [fetchProfile]);

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error as Error | null };
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function updateProfile(patch: Partial<UserProfile>) {
    if (!user) return { error: new Error('Not signed in') };
    const { data, error } = await supabase
      .from('user_profiles')
      .update(patch)
      .eq('id', user.id)
      .select('*')
      .single();
    if (error) return { error: error as Error };
    setProfile(data);
    return { error: null };
  }

  const { status: trialStatus, daysRemaining: trialDaysRemaining } = getTrialStatus(profile);

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    trialStatus,
    trialDaysRemaining,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
