'use client';

import { useEffect, useState, useCallback } from 'react';

interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  location: string | null;
  position: string | null;
  profile_picture_url: string | null;
  subscription_status: string;
  role: 'user' | 'admin' | 'owner';
  is_restricted: boolean;
  team_id?: string | null;
}

interface UseAuthReturn {
  user: { id: string; email: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// --------------- Module-level shared state ---------------
interface AuthState {
  user: { id: string; email: string } | null;
  profile: UserProfile | null;
  loading: boolean;
}

let authState: AuthState = { user: null, profile: null, loading: true };
const listeners = new Set<() => void>();
let initialized = false;
let appFullyInitialized = false;

function notify() {
  listeners.forEach((fn) => fn());
}

function setAuthState(partial: Partial<AuthState>) {
  authState = { ...authState, ...partial };
  notify();
}

// Visibility change guard to prevent concurrent refresh pile-up
let isRefreshing = false;

async function fetchProfile(): Promise<void> {
  const doFetch = async (): Promise<void> => {
    const res = await fetch('/api/me', { credentials: 'include' });
    if (!res.ok) {
      if (res.status === 401) {
        setAuthState({ user: null, profile: null });
        return;
      }
      throw new Error(`Profile fetch failed: ${res.status}`);
    }
    const data = await res.json();
    if (data && data.id) {
      setAuthState({
        user: { id: data.id, email: data.email },
        profile: data as UserProfile,
      });
    } else {
      setAuthState({ user: null, profile: null });
    }
  };

  try {
    await doFetch();
  } catch (err) {
    console.warn('[useAuth] Profile fetch failed, retrying in 500ms...', err);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      await doFetch();
    } catch (retryErr) {
      console.error('[useAuth] Profile fetch retry failed:', retryErr);
      setAuthState({ user: null, profile: null });
    }
  }
}

function initializeAuth() {
  if (initialized) return;
  initialized = true;

  // Fetch profile entirely via server-side /api/me.
  // NO browser Supabase client is used — avoids singleton mutex lock.
  (async () => {
    try {
      await fetchProfile();
    } catch (err) {
      console.error('[useAuth] Initialization failed:', err);
      setAuthState({ user: null, profile: null });
    } finally {
      setAuthState({ loading: false });
      appFullyInitialized = true;
    }
  })();

  // Visibility change: re-validate profile on tab re-activation
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', async () => {
      if (!appFullyInitialized) return;
      if (document.visibilityState !== 'visible') return;
      if (isRefreshing) return;
      isRefreshing = true;
      try {
        if (!authState.profile) {
          await fetchProfile();
        }
      } catch {
        // Silent — don't break anything on visibility change
      } finally {
        isRefreshing = false;
      }
    });
  }
}

// --------------- Hook ---------------
export function useAuth(): UseAuthReturn {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate((c) => c + 1);
    listeners.add(listener);
    initializeAuth();
    return () => { listeners.delete(listener); };
  }, []);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, []);

  const signOut = useCallback(async () => {
    try {
      localStorage.removeItem('sd-accent-color');
      localStorage.removeItem('sd-color-mode');
      localStorage.removeItem('sd-bg-animation');

      // Server-side sign-out — clears session cookies and revokes tokens
      await Promise.race([
        fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }),
        new Promise(resolve => setTimeout(resolve, 3000)),
      ]);

      setAuthState({ user: null, profile: null });
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      window.location.href = '/';
    }
  }, []);

  return {
    user: authState.user,
    profile: authState.profile,
    loading: authState.loading,
    signOut,
    refreshProfile,
  };
}
