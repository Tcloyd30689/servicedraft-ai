import { createBrowserClient } from '@supabase/ssr';
import { clearExpiredAuthCookies } from '@/lib/utils';

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (browserClient) return browserClient;

  // Clear stale auth cookies BEFORE the SDK constructor reads them.
  // createBrowserClient() → _initialize() → _recoverAndRefresh() reads cookies
  // and acquires a 10s lock. If tokens are expired, the auto-refresh loop blocks
  // all subsequent auth calls (getSession, signIn, signOut).
  clearExpiredAuthCookies();

  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  return browserClient;
}
