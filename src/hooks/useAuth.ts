'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getUserWithTimeout, forceSessionReset } from '@/lib/supabase/authWithTimeout';
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
  forceReset: () => void;
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

const supabase = createClient();

function notify() {
  listeners.forEach((fn) => fn());
}

function setAuthState(partial: Partial<AuthState>) {
  authState = { ...authState, ...partial };
  notify();
}

function buildFallbackProfile(userId: string, email: string): UserProfile {
  return {
    id: userId,
    email,
    username: null,
    first_name: null,
    last_name: null,
    location: null,
    position: null,
    profile_picture_url: null,
    subscription_status: 'trial',
    role: 'user',
    is_restricted: false,
  };
}

async function fetchProfileForUser(userId: string, userEmail?: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No profile row exists — create one
      console.warn('No profile found, creating one for user:', userId);
      const { data: newProfile, error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: userEmail || '',
          subscription_status: 'trial',
        })
        .select()
        .single();

      if (insertError) {
        console.error('Failed to create user profile:', insertError.message);
        setAuthState({ profile: buildFallbackProfile(userId, userEmail || '') });
        return;
      }

      if (newProfile) {
        setAuthState({ profile: newProfile as UserProfile });
      }
      return;
    }

    if (error) {
      console.error('Failed to fetch user profile:', error.message);
      setAuthState({ profile: buildFallbackProfile(userId, userEmail || '') });
      return;
    }

    if (data) {
      setAuthState({ profile: data as UserProfile });
    }
  } catch (err) {
    console.error('Error fetching profile:', err);
    setAuthState({ profile: buildFallbackProfile(userId, userEmail || '') });
  }
}

function initializeAuth() {
  if (initialized) return;
  initialized = true;

  // FAILSAFE: If loading is still true after 10 seconds, force recovery
  const failsafeTimer = setTimeout(() => {
    if (authState.loading) {
      console.warn('Auth initialization stuck for 10s — forcing recovery');
      setAuthState({ user: null, profile: null, loading: false });
    }
  }, 10000);

  // Initial fetch — uses timeout wrapper to prevent hanging
  (async () => {
    try {
      const { user: authUser } = await getUserWithTimeout();
      setAuthState({ user: authUser });

      if (authUser) {
        await fetchProfileForUser(authUser.id, authUser.email || '');
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error('Error getting user:', err);
    } finally {
      clearTimeout(failsafeTimer);
      setAuthState({ loading: false });
    }
  })();

  // Auth state change listener — single global subscription
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      try {
        const currentUser = session?.user ?? null;
        setAuthState({ user: currentUser });

        if (currentUser) {
          await fetchProfileForUser(currentUser.id, currentUser.email || '');
        } else {
          setAuthState({ profile: null });
        }
        setAuthState({ loading: false });

        // Dispatch custom event for ThemeProvider and other listeners
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sd-auth-change', {
            detail: { user: currentUser, event: _event }
          }));
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('Auth state change error:', err);
        setAuthState({ loading: false });
      }
    },
  );

  authSubscription = subscription;
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
      await supabase.auth.signOut();
      setAuthState({ user: null, profile: null });
      window.location.href = '/';
    } catch (err) {
      console.error('Sign out error:', err);
      window.location.href = '/';
    }
  }, []);

  const forceReset = useCallback(() => {
    forceSessionReset();
  }, []);

  return {
    user: authState.user,
    profile: authState.profile,
    loading: authState.loading,
    signOut,
    refreshProfile,
    forceReset,
  };
}
