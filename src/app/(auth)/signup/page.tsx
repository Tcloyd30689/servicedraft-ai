'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import WaveBackground from '@/components/ui/WaveBackground';
import LiquidCard from '@/components/ui/LiquidCard';
import Logo from '@/components/ui/Logo';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { POSITION_OPTIONS } from '@/constants/positions';

type Step = 1 | 2 | 3;

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlStep = searchParams.get('step');

  const [step, setStep] = useState<Step>(() => {
    if (urlStep === '2') return 2;
    if (urlStep === '3') return 3;
    return 1;
  });
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [emailSent, setEmailSent] = useState(false);

  // Step 1: Account
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 2: Payment / Access Code
  const [accessCode, setAccessCode] = useState('');

  // Step 3: Profile
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [location, setLocation] = useState('');
  const [position, setPosition] = useState('');

  const supabase = createClient();

  // On mount: check auth status and determine the correct step
  useEffect(() => {
    let active = true;

    const checkAuthStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!active) return;

        if (user) {
          // User is authenticated — determine which step they need
          if (user.email) setEmail(user.email);

          const { data: profile } = await supabase
            .from('users')
            .select('subscription_status, username')
            .eq('id', user.id)
            .single();

          if (!active) return;

          if (profile) {
            const needsPayment =
              !profile.subscription_status || profile.subscription_status === 'trial';
            const needsProfile = !needsPayment && !profile.username;

            if (needsPayment) {
              setStep(2);
            } else if (needsProfile) {
              setStep(3);
            } else {
              // Onboarding complete — redirect to main menu
              router.replace('/main-menu');
              return;
            }
          } else {
            // No profile row yet — they need step 2 (payment/access code)
            setStep(urlStep === '3' ? 3 : 2);
          }
        } else {
          // Not authenticated — must start at step 1
          setStep(1);
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
        setStep(1);
      }

      if (active) setInitializing(false);
    };

    checkAuthStatus();

    return () => { active = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Step 1: Create account — sends confirmation email
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
    setEmailSent(true);
  };

  // Step 2: Verify access code or payment
  const handlePaymentStep = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessCode.trim()) {
      toast.error('Please enter an access code or complete payment');
      return;
    }

    setLoading(true);

    // Validate access code
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

    // Update subscription status — upsert to handle missing profile row
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('users')
        .upsert(
          {
            id: user.id,
            email: user.email || email,
            subscription_status: 'bypass',
          },
          { onConflict: 'id' },
        );
    }

    setLoading(false);
    setStep(3);
  };

  // Step 3: Save profile
  const handleProfileCreation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }

    if (!position) {
      toast.error('Please select a position');
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error('Session expired. Please sign in again.');
      router.push('/login');
      return;
    }

    const username = (user.email || email).split('@')[0];

    const { error } = await supabase
      .from('users')
      .update({
        username,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        location: location || null,
        position,
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

  // Show loading while determining auth state and correct step
  if (initializing) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
        <WaveBackground />
        <div className="relative z-30 w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Logo size="medium" glow />
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
                    ? 'bg-[var(--accent-hover)] shadow-[0_0_10px_var(--accent-50)]'
                    : s < step
                      ? 'bg-[var(--accent-primary)]'
                      : 'bg-[#4b5563]'
                }`}
              />
            ))}
          </div>

          <h1 className="text-2xl font-semibold text-white text-center mb-6">
            {emailSent ? 'Check Your Email' : stepTitles[step]}
          </h1>

          {loading ? (
            <div className="py-12">
              <LoadingSpinner message="Please wait..." />
            </div>
          ) : (
            <>
              {/* Email confirmation message (shown after step 1 signUp) */}
              {emailSent && (
                <div className="text-center space-y-4">
                  <p className="text-[var(--text-secondary)] text-sm">
                    We&apos;ve sent a confirmation link to{' '}
                    <span className="text-[var(--text-primary)] font-medium">{email}</span>.
                  </p>
                  <p className="text-[var(--text-secondary)] text-sm">
                    Please check your inbox and click the link to confirm your email,
                    then{' '}
                    <Link
                      href="/login"
                      className="text-[var(--accent-hover)] hover:text-[var(--accent-bright)] underline transition-colors"
                    >
                      sign in
                    </Link>{' '}
                    to continue setting up your account.
                  </p>
                  <p className="text-[var(--text-muted)] text-xs mt-4">
                    Didn&apos;t receive it? Check your spam folder or try signing up again.
                  </p>
                </div>
              )}

              {/* Step 1: Account Creation */}
              {!emailSent && step === 1 && (
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
              {step === 2 && !emailSent && (
                <form onSubmit={handlePaymentStep} className="space-y-1">
                  <p className="text-[var(--text-secondary)] text-sm mb-4 text-center">
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
              {step === 3 && !emailSent && (
                <form onSubmit={handleProfileCreation} className="space-y-1">
                  <Input
                    id="firstName"
                    label="First Name"
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                  <Input
                    id="lastName"
                    label="Last Name"
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                  <Input
                    id="location"
                    label="Location"
                    type="text"
                    placeholder="e.g., Rock Springs, WY"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                  <Select
                    id="position"
                    label="Position"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    options={[
                      { value: '', label: 'Select your position...' },
                      ...POSITION_OPTIONS.map((p) => ({ value: p.value, label: p.label })),
                    ]}
                    required
                  />
                  <Button type="submit" size="fullWidth">
                    COMPLETE SETUP
                  </Button>
                </form>
              )}
            </>
          )}

          <p className="text-center text-sm text-[var(--text-muted)] mt-6">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-[var(--accent-hover)] hover:text-[var(--accent-bright)] transition-colors"
            >
              Sign In
            </Link>
          </p>
        </LiquidCard>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
          <WaveBackground />
          <div className="relative z-30 w-full max-w-md">
            <div className="flex justify-center mb-8">
              <Logo size="medium" glow />
            </div>
            <LiquidCard size="spacious">
              <div className="py-12">
                <LoadingSpinner message="Loading..." />
              </div>
            </LiquidCard>
          </div>
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}
