'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

const SESSION_KEY = 'sd-login-timestamp';
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

/** Call after successful login or signup completion to start the session timer. */
export function setLoginTimestamp() {
  localStorage.setItem(SESSION_KEY, String(Date.now()));
}

/** Clear the login timestamp (called on explicit sign-out). */
export function clearLoginTimestamp() {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Hook that checks the session age on mount and every 60 seconds.
 * If the session is older than 8 hours, signs the user out and shows a toast.
 */
export function useSessionExpiry() {
  const { user, signOut } = useAuth();
  const signOutRef = useRef(signOut);
  signOutRef.current = signOut;

  useEffect(() => {
    if (!user) return;

    const check = () => {
      const ts = localStorage.getItem(SESSION_KEY);

      if (!ts) {
        // No timestamp stored — set one now for existing sessions
        setLoginTimestamp();
        return;
      }

      const elapsed = Date.now() - Number(ts);
      if (elapsed > SESSION_DURATION) {
        clearLoginTimestamp();
        toast.error('Your session has expired. Please sign in again.');
        signOutRef.current();
      }
    };

    // Check immediately on mount
    check();

    // Then check every 60 seconds
    const interval = setInterval(check, 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);
}
