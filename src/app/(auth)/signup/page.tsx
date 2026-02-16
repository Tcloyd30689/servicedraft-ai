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

type Step = 1 | 2 | 3;

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Account
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2: Payment / Access Code
  const [accessCode, setAccessCode] = useState('');

  // Step 3: Profile
  const [location, setLocation] = useState('');
  const [position, setPosition] = useState('');

  const supabase = createClient();

  // Step 1: Create account
  const handleAccountCreation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setStep(2);
  };

  // Step 2: Verify access code or payment
  const handlePaymentStep = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessCode.trim()) {
      toast.error('Please enter an access code or complete payment');
      return;
    }

    setLoading(true);

    // Check access code against environment variable
    const response = await fetch('/api/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessCode: accessCode.trim() }),
    });

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.error || 'Invalid access code');
      setLoading(false);
      return;
    }

    // Update subscription status
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('users')
        .update({ subscription_status: 'bypass' })
        .eq('id', user.id);
    }

    setLoading(false);
    setStep(3);
  };

  // Step 3: Save profile
  const handleProfileCreation = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error('Session expired. Please sign in again.');
      router.push('/login');
      return;
    }

    const { error } = await supabase
      .from('users')
      .update({
        username: email.split('@')[0],
        location: location || null,
        position: position || null,
      })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to save profile');
      setLoading(false);
      return;
    }

    toast.success('Account created successfully!');
    router.push('/main-menu');
  };

  const stepTitles: Record<Step, string> = {
    1: 'Create Account',
    2: 'Payment / Access Code',
    3: 'Complete Your Profile',
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
          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {([1, 2, 3] as Step[]).map((s) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'bg-[#a855f7] shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                    : s < step
                      ? 'bg-[#7c3aed]'
                      : 'bg-[#4b5563]'
                }`}
              />
            ))}
          </div>

          <h1 className="text-2xl font-semibold text-white text-center mb-6">
            {stepTitles[step]}
          </h1>

          {loading ? (
            <div className="py-12">
              <LoadingSpinner message="Please wait..." />
            </div>
          ) : (
            <>
              {/* Step 1: Account Creation */}
              {step === 1 && (
                <form onSubmit={handleAccountCreation} className="space-y-1">
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
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Input
                    id="confirmPassword"
                    label="Confirm Password"
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <Button type="submit" size="fullWidth">
                    CONTINUE
                  </Button>
                </form>
              )}

              {/* Step 2: Payment / Access Code */}
              {step === 2 && (
                <form onSubmit={handlePaymentStep} className="space-y-1">
                  <p className="text-[#c4b5fd] text-sm mb-4 text-center">
                    Enter an access code to activate your account, or proceed with payment.
                  </p>
                  <Input
                    id="accessCode"
                    label="Access Code"
                    type="text"
                    placeholder="Enter your access code"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                  />
                  <Button type="submit" size="fullWidth">
                    VERIFY CODE
                  </Button>
                </form>
              )}

              {/* Step 3: Profile Creation */}
              {step === 3 && (
                <form onSubmit={handleProfileCreation} className="space-y-1">
                  <Input
                    id="location"
                    label="Location"
                    type="text"
                    placeholder="e.g., Rock Springs, WY"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                  <Input
                    id="position"
                    label="Position"
                    type="text"
                    placeholder="e.g., Technician, Service Advisor"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                  />
                  <Button type="submit" size="fullWidth">
                    COMPLETE SETUP
                  </Button>
                </form>
              )}
            </>
          )}

          <p className="text-center text-sm text-[#9ca3af] mt-6">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-[#a855f7] hover:text-[#c084fc] transition-colors"
            >
              Sign In
            </Link>
          </p>
        </LiquidCard>
      </div>
    </div>
  );
}
