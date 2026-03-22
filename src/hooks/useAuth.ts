'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

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
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// --------------- Module-level shared state ---------------
// Same pattern as narrativeStore — one state, many subscribers.

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

let authState: AuthState = { user: null, profile: null, loading: true };
const listeners = new Set<() => void>();
let initialized = false;
let authSubscription: { unsubscribe: () => void } | null = null;
let appFullyInitialized = false;

const supabase = createClient();

function notify() {
  listeners.forEach((fn) => fn());
}

function setAuthState(partial: Partial<AuthState>) {
  authState = { ...authState, ...partial };
  notify();
}

// FIX 2 — Visibility change guard to prevent concurrent refresh pile-up
let isRefreshing = false;

async function fetchProfileForUser(_userId: string, _userEmail?: string) {
  const doFetch = async (): Promise<void> => {
    const res = await fetch('/api/me', { credentials: 'include' });
    if (!res.ok) {
      if (res.status === 401) {
        setAuthState({ profile: null });
        return;
      }
      throw new Error(`Profile fetch failed: ${res.status}`);
    }
    const data = await res.json();
    setAuthState({ profile: data as UserProfile });
  };

  try {
    await doFetch();
  } catch (err) {
    console.warn('[useAuth] Profile fetch failed, retrying in 500ms...', err);
    // Single retry after 500ms
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      await doFetch();
    } catch (retryErr) {
      console.error('[useAuth] Profile fetch retry failed:', retryErr);
      setAuthState({ profile: null });
    }
  }
}

function initializeAuth() {
  if (initialized) return;
  initialized = true;

  // Initial fetch with 7-second hard timeout on getUser()
  (async () => {
    try {
      const { data: { user: authUser } } = await Promise.race([
        supabase.auth.getUser(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Auth check timed out after 7000ms')), 7000)
        ),
      ]);
      setAuthState({ user: authUser });
      if (authUser) {
        await fetchProfileForUser(authUser.id, authUser.email ?? '');
      }
    } catch (err) {
      console.error('[useAuth] getUser timed out or failed — treating as unauthenticated:', err);
      setAuthState({ user: null, profile: null });
    } finally {
      setAuthState({ loading: false });
      // FIX A — Mark app as fully initialized AFTER initial auth check completes
      appFullyInitialized = true;
    }
  })();

  // Auth state change listener — single global subscription
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (_event: string, session: { user: User } | null) => {
      try {
        const currentUser = session?.user ?? null;
        setAuthState({ user: currentUser });

        if (currentUser) {
          await fetchProfileForUser(currentUser.id, currentUser.email || '');
        } else {
          setAuthState({ profile: null });
        }
        setAuthState({ loading: false });
      } catch (err) {
        console.error('Auth state change error:', err);
      }
    },
  );

  authSubscription = subscription;

  // Visibility change: re-validate profile on tab re-activation
  // Uses getSession() (cache-only) to check if user is still logged in,
  // then refreshes profile from server-side /api/me
  document.addEventListener('visibilitychange', async () => {
    if (!appFullyInitialized) return;
    if (document.visibilityState !== 'visible') return;
    if (isRefreshing) return;
    isRefreshing = true;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Only refresh profile if we don't already have one
        // (prevents unnecessary API calls on every tab switch)
        if (!authState.profile) {
          await fetchProfileForUser(session.user.id, session.user.email ?? '');
        }
      } else {
        setAuthState({ user: null, profile: null, loading: false });
      }
    } catch {
      // Silent — don't break anything on visibility change
    } finally {
      isRefreshing = false;
    }
  });
}

// --------------- Hook ---------------

export function useAuth(): UseAuthReturn {
  const [, forceUpdate] = useState(0);

  // Subscribe to shared state changes
  useEffect(() => {
    const listener = () => forceUpdate((c) => c + 1);
    listeners.add(listener);

    // Initialize on first mount across the entire app
    initializeAuth();

    return () => {
      listeners.delete(listener);
      // Do NOT tear down the global auth subscription here.
      // It must persist across route transitions. The module-level
      // supabase client and auth listener live for the app lifetime.
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (authState.user) {
      await fetchProfileForUser(authState.user.id, authState.user.email || '');
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      // Clear session and theme localStorage so landing page defaults to purple dark
      localStorage.removeItem('sd-login-timestamp');
      localStorage.removeItem('sd-accent-color');
      localStorage.removeItem('sd-color-mode');
      localStorage.removeItem('sd-bg-animation');
      await supabase.auth.signOut({ scope: 'local' });
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
