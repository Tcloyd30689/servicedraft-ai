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

const supabase = createClient();

function notify() {
  listeners.forEach((fn) => fn());
}

function setAuthState(partial: Partial<AuthState>) {
  authState = { ...authState, ...partial };
  notify();
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
        setAuthState({ profile: null });
        return;
      }

      if (newProfile) {
        setAuthState({ profile: newProfile as UserProfile });
      }
      return;
    }

    if (error) {
      console.error('Failed to fetch user profile:', error.message);
      setAuthState({ profile: null });
      return;
    }

    if (data) {
      setAuthState({ profile: data as UserProfile });
    }
  } catch (err) {
    console.error('Error fetching profile:', err);
    setAuthState({ profile: null });
  }
}

function initializeAuth() {
  if (initialized) return;
  initialized = true;

  // Initial fetch with 5-second timeout on getUser()
  (async () => {
    try {
      const { data: { user: authUser } } = await Promise.race([
        supabase.auth.getUser(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Auth timeout: getUser took longer than 5s')), 5000)
        ),
      ]);
      setAuthState({ user: authUser });

      if (authUser) {
        await fetchProfileForUser(authUser.id, authUser.email || '');
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;

      if (err instanceof Error && err.message.includes('Auth timeout')) {
        console.warn(err.message);
        // Clear stale local session so next load starts fresh
        try {
          supabase.auth.signOut({ scope: 'local' });
        } catch { /* fire-and-forget */ }
      } else {
        console.error('Error getting user:', err);
      }

      setAuthState({ user: null, profile: null });
    } finally {
      setAuthState({ loading: false });
    }
  })();

  // 10-second failsafe: if loading is still true, force it off
  setTimeout(() => {
    if (authState.loading) {
      console.warn('Auth failsafe: forcing loading=false after 10s');
      setAuthState({ user: null, profile: null, loading: false });
    }
  }, 10000);

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
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('Auth state change error:', err);
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
