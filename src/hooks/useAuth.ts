'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  location: string | null;
  position: string | null;
  profile_picture_url: string | null;
  subscription_status: string;
}

interface UseAuthReturn {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const fetchProfile = useCallback(async (userId: string, userEmail?: string) => {
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
          // Still set a minimal profile so the app doesn't break
          setProfile({
            id: userId,
            email: userEmail || '',
            username: null,
            location: null,
            position: null,
            profile_picture_url: null,
            subscription_status: 'trial',
          });
          return;
        }

        if (newProfile) {
          setProfile(newProfile as UserProfile);
        }
        return;
      }

      if (error) {
        console.error('Failed to fetch user profile:', error.message);
        // Set a minimal profile so the dashboard still renders
        setProfile({
          id: userId,
          email: userEmail || '',
          username: null,
          location: null,
          position: null,
          profile_picture_url: null,
          subscription_status: 'trial',
        });
        return;
      }

      if (data) {
        setProfile(data as UserProfile);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      // Fallback profile so the app doesn't get stuck
      setProfile({
        id: userId,
        email: userEmail || '',
        username: null,
        location: null,
        position: null,
        profile_picture_url: null,
        subscription_status: 'trial',
      });
    }
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    let active = true;

    const getUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!active) return;

        setUser(authUser);

        if (authUser) {
          await fetchProfile(authUser.id, authUser.email || '');
        }
      } catch (err) {
        // Ignore AbortError — happens during React strict mode remount
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (!active) return;
        console.error('Error getting user:', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!active) return;

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchProfile(currentUser.id, currentUser.email || '');
        } else {
          setProfile(null);
        }
        if (active) setLoading(false);
      },
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      // Hard redirect clears all client state and forces middleware to re-evaluate
      // router.push() is client-side only and doesn't clear server session cookies
      window.location.href = '/';
    } catch (err) {
      console.error('Sign out error:', err);
      // Force redirect even if signOut errors
      window.location.href = '/';
    }
  }, [supabase]);

  return { user, profile, loading, signOut, refreshProfile };
}
