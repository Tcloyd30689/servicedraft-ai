'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import WaveBackground from '@/components/ui/WaveBackground';
import LiquidCard from '@/components/ui/LiquidCard';
import Logo from '@/components/ui/Logo';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { logActivity } from '@/lib/activityLogger';
import { withTimeout } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Redirect if already authenticated
  useEffect(() => {
    let active = true;

    const checkAuth = async () => {
      // Check for an existing valid session entirely server-side.
      // The browser Supabase client's auto-refresh daemon can lock the
      // singleton mutex, blocking signInWithPassword(). By only using
      // fetch('/api/me'), we never touch the browser client on mount.
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
          return;
        }
        // Non-OK (401, 500) — no valid session, show login form
      } catch {
        console.warn('[login] /api/me check failed or timed out');
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
      const res = await withTimeout(
        fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        }),
        12000, // 12s timeout
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Sign-in failed');
        setLoading(false);
        return;
      }

      // Fire-and-forget activity log
      if (data.userId) {
        logActivity('login', undefined, data.userId);
      }

      toast.success('Signed in successfully');
      setLoading(false);

      // Use window.location.href for a full page navigation to pick up
      // the new session cookies set by the server-side API route.
      // router.push() does a client-side navigation that won't re-read cookies.
      window.location.href = data.redirectTo || '/main-menu';
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
