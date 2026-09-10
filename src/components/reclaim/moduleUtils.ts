import { useState, useEffect } from 'react';
import { useEntitlement } from '@/lib/entitlement';

/** Short unique id for locally-stored records. */
export const uid = (): string => Math.random().toString(36).slice(2, 10);

/**
 * useStored — component state that persists to localStorage, but ONLY for
 * PROactive users (subscribed or still in trial). FREEactive is meant to be a
 * stateless, single-shot instant-analysis tier — it must not build up a durable
 * appliance/bill/case history on the device for anonymous or trial-expired users.
 *
 * Entitlement isn't known synchronously on first render (it depends on an async
 * session/profile fetch), so this never reads localStorage in the initializer —
 * state always starts at `initial`, then an effect decides once entitlement
 * settles: PROactive hydrates from storage, everyone else gets that key wiped
 * (so no stale pre-fix or post-downgrade data lingers) and never persisted to.
 */
export function useStored<T>(key: string, initial: T) {
  const { isProActive, loading } = useEntitlement();
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (isProActive) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) setValue(JSON.parse(raw) as T);
      } catch {
        /* ignore corrupt storage */
      }
    } else {
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    }
    setHydrated(true);
  }, [key, loading, isProActive]);

  useEffect(() => {
    if (!hydrated || !isProActive) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore quota / private-mode errors */
    }
  }, [key, value, hydrated, isProActive]);

  return [value, setValue] as const;
}

/**
 * Read a stored value without writing (for read-only views like the hub).
 * Gated on the same PROactive entitlement as useStored — callers must pass the
 * caller's own `useEntitlement().isProActive` since this isn't itself a hook.
 */
export function readStored<T>(key: string, fallback: T, isProActive: boolean): T {
  if (!isProActive) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
