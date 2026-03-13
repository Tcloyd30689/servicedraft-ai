import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

const AUTH_TIMEOUT_MS = 5000; // 5 seconds max for any auth call

/**
 * Calls supabase.auth.getUser() with a timeout.
 * If the call takes longer than AUTH_TIMEOUT_MS, returns { user: null }.
 * This prevents the UI from hanging indefinitely on stale/corrupted sessions.
 */
export async function getUserWithTimeout(): Promise<{ user: User | null }> {
  const supabase = createClient();

  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Auth timeout')), AUTH_TIMEOUT_MS)
      ),
    ]);
    return { user: result.data.user };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown auth error';
    if (msg === 'Auth timeout') {
      console.warn('supabase.auth.getUser() timed out after 5s — treating as no session');
      // Auto-clear corrupted auth state
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {
        // Ignore signout errors during recovery
      }
    } else {
      console.error('Auth error in getUserWithTimeout:', msg);
    }
    return { user: null };
  }
}

/**
 * Detects if the Supabase session cookies appear corrupted/stale.
 * Checks if auth cookies exist but getUser() returns no user.
 */
export async function isSessionCorrupted(): Promise<boolean> {
  // Check if Supabase auth cookies exist in the browser
  const hasCookies = document.cookie.split(';').some(c =>
    c.trim().startsWith('sb-') && c.includes('auth-token')
  );

  if (!hasCookies) return false;

  const { user } = await getUserWithTimeout();
  return hasCookies && !user;
}

/**
 * Force-clear all Supabase auth state and reload.
 * This is the nuclear option when session is corrupted.
 */
export function forceSessionReset(): void {
  // Clear all Supabase auth cookies
  document.cookie.split(';').forEach(cookie => {
    const name = cookie.split('=')[0].trim();
    if (name.startsWith('sb-')) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  });

  // Clear localStorage auth-related items
  localStorage.removeItem('sd-login-timestamp');
  localStorage.removeItem('sd-accent-color');
  localStorage.removeItem('sd-color-mode');
  localStorage.removeItem('sd-bg-animation');

  // Hard reload to clean state
  window.location.href = '/';
}
