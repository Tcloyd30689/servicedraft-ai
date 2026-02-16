'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import WaveBackground from '@/components/ui/WaveBackground';
import LiquidCard from '@/components/ui/LiquidCard';
import Logo from '@/components/ui/Logo';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success('Signed in successfully');
    router.push('/main-menu');
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <WaveBackground />

      <div className="relative z-30 w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Logo size="medium" glow />
          </Link>
        </div>

        <LiquidCard size="spacious">
          <h1 className="text-2xl font-semibold text-white text-center mb-6">
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

          <p className="text-center text-sm text-[#9ca3af] mt-6">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="text-[#a855f7] hover:text-[#c084fc] transition-colors"
            >
              Request Access
            </Link>
          </p>
        </LiquidCard>
      </div>
    </div>
  );
}
