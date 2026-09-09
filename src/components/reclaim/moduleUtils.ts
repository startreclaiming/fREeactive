import { useState, useEffect } from 'react';

/** Short unique id for locally-stored records. */
export const uid = (): string => Math.random().toString(36).slice(2, 10);

/**
 * useStored — component state that persists to localStorage.
 * Baseline persistence with no backend; easy to swap for Supabase later.
 */
export function useStored<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore quota / private-mode errors */
    }
  }, [key, value]);

  return [value, setValue] as const;
}

/** Read a stored value without writing (for read-only views like the hub). */
export function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
