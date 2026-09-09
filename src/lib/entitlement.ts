import { useAuth } from '@/context/AuthContext';

/** True while the user should see PROactive features: still in trial, or actually subscribed. */
export function useEntitlement() {
  const { trialStatus, trialDaysRemaining } = useAuth();
  const isProActive = trialStatus === 'active' || trialStatus === 'expiring' || trialStatus === 'subscribed';
  const isSubscribed = trialStatus === 'subscribed';
  return { isProActive, isSubscribed, trialStatus, trialDaysRemaining };
}
