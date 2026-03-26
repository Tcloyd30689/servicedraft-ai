'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import WaveBackground from '@/components/ui/WaveBackground';
import LiquidCard from '@/components/ui/LiquidCard';
import Logo from '@/components/ui/Logo';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { logActivity } from '@/lib/activityLogger';
import { withTimeout, clearExpiredAuthCookies } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const supabase = createClient();

  // Redirect if already authenticated
  useEffect(() => {
    let active = true;

    const checkAuth = async () => {
      // Step 0: Clear expired auth cookies BEFORE the SDK touches them.
      // Prevents the auto-refresh daemon from entering an infinite retry loop
      // on revoked refresh tokens (e.g., after server-side session cleanup).
      const cookiesCleared = clearExpiredAuthCookies();
      if (cookiesCleared) {
        // Cookies were stale and have been nuked — no valid session exists.
        // Show the login form immediately without touching the SDK.
        if (active) setCheckingAuth(false);
        return;
      }

      // Step 1: Peek at cached session (instant, no network call).
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        if (active) setCheckingAuth(false);
        return;
      }

      // Step 2: Decode JWT and check expiry locally.
      // If expired, show the form immediately — never call getUser() on the
      // browser singleton because the SDK's internal auto-refresh hangs when
      // the refresh token is also expired, AND it locks the singleton so
      // subsequent signInWithPassword() calls also hang.
      try {
        const payload = JSON.parse(atob(session.access_token.split('.')[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          console.log('[login] Access token expired — clearing stale session');
          // Clear the stale session to release the singleton's auth mutex.
          // Without this, the SDK's internal auto-refresh (triggered by
          // getSession) permanently locks the mutex when the refresh token
          // is also expired, causing signInWithPassword() to hang.
          await supabase.auth.signOut({ scope: 'local' });
          if (active) setCheckingAuth(false);
          return;
        }
      } catch {
        // Can't decode JWT — treat as invalid, clear stale state and show form
        await supabase.auth.signOut({ scope: 'local' });
        if (active) setCheckingAuth(false);
        return;
      }

      // Step 3: Token looks valid — verify via server-side /api/me.
      // This uses a fresh server-side Supabase client (not the browser singleton)
      // so it can't lock up the browser client that signInWithPassword() needs.
      try {
        const res = await withTimeout(fetch('/api/me', { credentials: 'include' }), 4000);
        if (!active) return;

        if (res.ok) {
          const profile = await res.json();

          if (!profile || !profile.username) {
            router.replace('/signup?step=2');
          } else if (!profile.subscription_status || profile.subscription_status === 'trial') {
            router.replace('/signup?step=3');
          } else {
            router.replace('/main-menu');
          }
          if (active) setCheckingAuth(false);
          return;
        }
        // Non-OK response (401 = invalid token, 500 = server error) — show form
      } catch {
        console.warn('[login] /api/me fetch failed or timed out');
      }

      if (active) setCheckingAuth(false);
    };

    checkAuth();

    return () => { active = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Failsafe: if auth check hangs despite individual timeouts, show the form
  useEffect(() => {
    if (!checkingAuth) return;
    const failsafe = setTimeout(() => {
      console.warn('[login] Auth check failsafe triggered — showing login form');
      setCheckingAuth(false);
    }, 6000);
    return () => clearTimeout(failsafe);
  }, [checkingAuth]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Sign-in timed out')), 8000)),
      ]);

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      // Check onboarding status before routing (server-side via /api/me)
      if (data.user) {
        try {
          const res = await withTimeout(fetch('/api/me', { credentials: 'include' }), 4000);
          if (res.ok) {
            const profile = await res.json();

            if (!profile || !profile.username) {
              toast.success('Please complete your profile setup');
              setLoading(false);
              router.push('/signup?step=2');
              return;
            }

            if (!profile.subscription_status || profile.subscription_status === 'trial') {
              toast.success('Please complete your account setup');
              setLoading(false);
              router.push('/signup?step=3');
              return;
            }
          }
        } catch {
          // /api/me failed — fall through to main-menu (session is valid, useAuth will re-validate)
          console.warn('[login] Post-login profile check failed — proceeding to main-menu');
        }

        // Fire-and-forget — don't let logActivity block navigation
        logActivity('login', undefined, data.user.id);
      }

      toast.success('Signed in successfully');
      setLoading(false);
      router.push('/main-menu');
    } catch (err) {
      console.error('[login] Sign-in failed:', err);
      toast.error('Sign-in timed out. Please try again.');
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
        <WaveBackground centerYPercent={0.40} />
        <div className="relative z-30 w-full max-w-md">
          <div className="flex justify-center mb-8">
            <div className="scale-[2] origin-bottom translate-y-16">
              <Logo size="large" glow className="max-w-[90vw]" />
            </div>
          </div>
          <LiquidCard size="spacious">
            <div className="py-12">
              <LoadingSpinner message="Loading..." />
            </div>
          </LiquidCard>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <WaveBackground centerYPercent={0.40} />

      <motion.div
        className="relative z-30 w-full max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="flex justify-center mb-8">
          <div className="scale-[2] origin-bottom translate-y-16">
            <Link href="/">
              <Logo size="large" glow className="max-w-[90vw]" />
            </Link>
          </div>
        </div>

        <LiquidCard size="spacious">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] text-center mb-6">
            Sign In
          </h1>

          {loading ? (
            <div className="py-12">
              <LoadingSpinner message="Signing in..." />
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-1">
              <Input
                id="email"
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                id="password"
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" size="fullWidth">
                LOGIN
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-[var(--text-muted)] mt-6">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="text-[var(--accent-hover)] hover:text-[var(--accent-bright)] transition-colors"
            >
              Request Access
            </Link>
          </p>
        </LiquidCard>
      </motion.div>
    </div>
  );
}
