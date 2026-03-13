'use client';

import { useEffect } from 'react';

/**
 * Global error handler that catches unhandled "Invalid UTF-8 sequence" errors
 * from corrupted Supabase auth cookies. When detected, clears all auth cookies
 * and reloads the page to break the crash loop.
 *
 * This is a last-resort safety net — the primary defense is cookie validation
 * in client.ts and middleware.ts.
 */
export default function AuthErrorRecovery() {
  useEffect(() => {
    let recovering = false;

    const handleError = (event: ErrorEvent | PromiseRejectionEvent) => {
      if (recovering) return;

      const errorMessage =
        event instanceof ErrorEvent
          ? event.message
          : event.reason?.message || String(event.reason);

      if (
        errorMessage?.includes('Invalid UTF-8 sequence') ||
        errorMessage?.includes('invalid base64')
      ) {
        recovering = true;
        console.warn('Auth cookie corruption detected — clearing cookies and recovering');

        // Clear all Supabase cookies
        document.cookie.split(';').forEach(cookie => {
          const name = cookie.split('=')[0].trim();
          if (name.startsWith('sb-')) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          }
        });

        // Clear auth-related localStorage
        localStorage.removeItem('sd-login-timestamp');

        // Prevent the error from showing the Next.js error overlay
        event.preventDefault();

        // Redirect to login after a brief delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    };

    window.addEventListener('error', handleError as EventListener);
    window.addEventListener('unhandledrejection', handleError as EventListener);

    return () => {
      window.removeEventListener('error', handleError as EventListener);
      window.removeEventListener('unhandledrejection', handleError as EventListener);
    };
  }, []);

  return null;
}
