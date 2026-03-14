import { createBrowserClient } from '@supabase/ssr';

/**
 * Checks for clearly corrupted Supabase auth cookies and removes them.
 *
 * IMPORTANT: This must be very conservative. Supabase SSR uses a custom
 * chunked base64 encoding that does NOT pass standard atob() tests.
 * Only clear cookies that are obviously broken — empty values, null bytes,
 * or truncated to just a few characters (indicating a failed write).
 */
function clearCorruptedAuthCookies(): void {
  try {
    document.cookie.split(';').forEach(cookie => {
      const eqIndex = cookie.indexOf('=');
      if (eqIndex === -1) return;

      const name = cookie.substring(0, eqIndex).trim();
      if (!name.startsWith('sb-')) return;

      const value = cookie.substring(eqIndex + 1).trim();

      // Only clear if the cookie is clearly broken:
      // 1. Empty value
      // 2. Contains null bytes
      // 3. Value is suspiciously short (< 10 chars) for an auth token
      const isClearlyCorrupted =
        !value ||
        value.length < 10 ||
        value.includes('\0') ||
        value === 'undefined' ||
        value === 'null';

      if (isClearlyCorrupted) {
        console.warn(`Clearing corrupted Supabase cookie: ${name} (reason: ${!value ? 'empty' : value.length < 10 ? 'too short' : 'invalid content'})`);
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
      }
    });
  } catch (err) {
    console.error('Error during cookie validation:', err);
  }
}

export function createClient() {
  if (typeof document !== 'undefined') {
    clearCorruptedAuthCookies();
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
