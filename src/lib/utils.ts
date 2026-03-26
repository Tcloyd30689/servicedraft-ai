export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}

/**
 * Wraps a promise with a timeout. Rejects with an Error if the promise
 * does not settle within the given number of milliseconds.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), ms)
    ),
  ]);
}

/**
 * Checks for expired Supabase auth cookies and clears them BEFORE the SDK
 * can trigger its auto-refresh daemon. This prevents an infinite retry loop
 * when refresh tokens have been revoked server-side (e.g., after a DB cleanup).
 *
 * Must be called BEFORE any supabase.auth.getSession() or other SDK auth
 * methods on pages where the user might have stale cookies (login, signup).
 *
 * Returns true if stale cookies were found and cleared.
 */
export function clearExpiredAuthCookies(): boolean {
  if (typeof document === 'undefined') return false;

  try {
    const allCookies = document.cookie.split('; ').filter(Boolean);

    // Find Supabase auth token cookies (may be chunked: sb-xxx-auth-token.0, .1, etc.)
    const authChunks = allCookies
      .filter(c => c.match(/^sb-[^=]+-auth-token/))
      .sort() // ensures .0, .1, .2 order
      .map(c => decodeURIComponent(c.split('=').slice(1).join('=')));

    if (authChunks.length === 0) return false;

    // Reassemble the full cookie value from chunks
    let fullValue = authChunks.join('');

    // @supabase/ssr encodes cookies in base64url format by default (prefix "base64-").
    // Strip the prefix and decode to plain JSON before matching.
    const BASE64_PREFIX = 'base64-';
    if (fullValue.startsWith(BASE64_PREFIX)) {
      const encoded = fullValue.substring(BASE64_PREFIX.length);
      // Convert base64url → standard base64 (- → +, _ → /) and add padding
      const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      fullValue = atob(padded);
    }

    // Extract the access_token JWT from the JSON cookie value
    const tokenMatch = fullValue.match(/"access_token"\s*:\s*"([^"]+)"/);
    if (!tokenMatch || !tokenMatch[1]) return false;

    // Decode the JWT payload (middle segment)
    const jwtParts = tokenMatch[1].split('.');
    if (jwtParts.length !== 3) return false;

    const payload = JSON.parse(atob(jwtParts[1]));
    // 90-second margin matches the SDK's EXPIRY_MARGIN_MS (3 ticks × 30s).
    // Prevents the edge case where we say "valid" but the SDK considers it
    // "near-expiry" and triggers auto-refresh with a revoked refresh token.
    const EXPIRY_MARGIN_S = 90;
    if (!payload.exp || (payload.exp - EXPIRY_MARGIN_S) * 1000 > Date.now()) {
      // Token is still valid (with margin) — don't touch anything
      return false;
    }

    // Token IS expired — nuke all sb- cookies directly (no SDK involvement)
    console.log('[auth] Clearing expired Supabase auth cookies before SDK initialization');
    allCookies.forEach(c => {
      const name = c.split('=')[0].trim();
      if (name.startsWith('sb-')) {
        document.cookie = name + '=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      }
    });

    return true;
  } catch {
    // Any parsing failure — don't block the page, just proceed normally
    return false;
  }
}
