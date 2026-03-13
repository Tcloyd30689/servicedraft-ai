import { createBrowserClient } from '@supabase/ssr';

/**
 * Validates all Supabase auth cookies (sb-*) and clears any with corrupted
 * base64 data. This prevents the "Invalid UTF-8 sequence" crash inside
 * @supabase/ssr's internal base64url decoder.
 */
function clearCorruptedAuthCookies(): void {
  try {
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      if (name.startsWith('sb-')) {
        const value = cookie.split('=').slice(1).join('=').trim();
        if (value) {
          try {
            const base64Part = value.split('.')[0];
            if (base64Part) {
              atob(base64Part.replace(/-/g, '+').replace(/_/g, '/'));
            }
          } catch {
            console.warn(`Clearing corrupted Supabase cookie: ${name}`);
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
          }
        }
      }
    });
  } catch (err) {
    console.error('Error during cookie validation:', err);
  }
}

export function createClient() {
  // Validate cookies BEFORE creating the Supabase client
  // This prevents the "Invalid UTF-8 sequence" crash inside @supabase/ssr
  if (typeof document !== 'undefined') {
    clearCorruptedAuthCookies();
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
