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
import { setLoginTimestamp } from '@/hooks/useSessionExpiry';

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
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!active) return;

        if (user) {
          // Check onboarding status
          const { data: profile } = await supabase
            .from('users')
            .select('subscription_status, username')
            .eq('id', user.id)
            .single();

          if (!active) return;

          if (!profile || !profile.subscription_status || profile.subscription_status === 'trial') {
            router.replace('/signup?step=2');
          } else if (!profile.username) {
            router.replace('/signup?step=3');
          } else {
            router.replace('/main-menu');
          }
          return;
        }
      } catch (err) {
        console.error('Error checking auth:', err);
      }

      if (active) setCheckingAuth(false);
    };

    checkAuth();

    return () => { active = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Check onboarding status before routing
    if (data.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('subscription_status, username')
        .eq('id', data.user.id)
        .single();

      if (!profile || !profile.subscription_status || profile.subscription_status === 'trial') {
        toast.success('Please complete your account setup');
        router.push('/signup?step=2');
        return;
      }

      if (!profile.username) {
        toast.success('Please complete your profile');
        router.push('/signup?step=3');
        return;
      }
    }

    setLoginTimestamp();
    toast.success('Signed in successfully');
    router.push('/main-menu');
  };

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
        <WaveBackground centerYPercent={0.35} />
        <div className="relative z-30 w-full max-w-md">
          <div className="flex justify-center mb-8">
            <div className="scale-[2] origin-bottom">
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
      <WaveBackground centerYPercent={0.35} />

      <motion.div
        className="relative z-30 w-full max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="flex justify-center mb-8">
          <div className="scale-[2] origin-bottom">
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
