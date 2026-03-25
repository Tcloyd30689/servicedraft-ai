'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import WaveBackground from '@/components/ui/WaveBackground';
import LiquidCard from '@/components/ui/LiquidCard';
import Logo from '@/components/ui/Logo';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import TermsOfUse from '@/components/layout/TermsOfUse';
import AccentColorPicker from '@/components/ui/AccentColorPicker';
import { POSITION_OPTIONS } from '@/constants/positions';
import { US_STATES } from '@/constants/states';
import { withTimeout } from '@/lib/utils';

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
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // Step 1: Email Verification
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');

  // Step 2: Profile + Password
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [location, setLocation] = useState('');
  const [position, setPosition] = useState('');

  // Step 3: Payment / Access Code
  const [accessCode, setAccessCode] = useState('');
  const [pendingTeamId, setPendingTeamId] = useState<string | null>(null);

  const supabase = createClient();

  // On mount: check auth status and determine the correct step
  useEffect(() => {
    let active = true;

    const checkAuthStatus = async () => {
      // Step 1: Peek at cached session (instant, no network).
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        const fallbackStep = urlStep === '3' ? 3 : urlStep === '2' ? 2 : 1;
        setStep(fallbackStep as Step);
        if (active) setInitializing(false);
        return;
      }

      // Step 2: Decode JWT and check expiry locally.
      // Never call getUser() on the browser singleton — its internal
      // auto-refresh hangs and locks the singleton, blocking all
      // subsequent auth operations (including signInWithPassword).
      try {
        const payload = JSON.parse(atob(session.access_token.split('.')[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          console.log('[signup] Access token expired — using URL step');
          const fallbackStep = urlStep === '3' ? 3 : urlStep === '2' ? 2 : 1;
          setStep(fallbackStep as Step);
          if (active) setInitializing(false);
          return;
        }
      } catch {
        // Can't decode JWT — treat as invalid
        const fallbackStep = urlStep === '3' ? 3 : urlStep === '2' ? 2 : 1;
        setStep(fallbackStep as Step);
        if (active) setInitializing(false);
        return;
      }

      // Step 3: Token looks valid — verify via server-side /api/me.
      // Uses a fresh server-side Supabase client (not the browser singleton).
      try {
        const res = await withTimeout(fetch('/api/me', { credentials: 'include' }), 4000);
        if (!active) return;

        if (res.ok) {
          const profile = await res.json();

          // Pre-fill email from session
          if (session.user?.email) setEmail(session.user.email);

          if (profile) {
            const needsProfile = !profile.username;
            const needsPayment = !needsProfile && (!profile.subscription_status || profile.subscription_status === 'trial');

            if (needsProfile) {
              setStep(2);
            } else if (needsPayment) {
              setStep(3);
            } else {
              router.replace('/main-menu');
              return;
            }
          } else {
            setStep(urlStep === '3' ? 3 : 2);
          }
        } else if (res.status === 401) {
          // Token invalid server-side — show appropriate step
          const fallbackStep = urlStep === '3' ? 3 : urlStep === '2' ? 2 : 1;
          setStep(fallbackStep as Step);
        } else {
          setStep(urlStep === '3' ? 3 : 2);
        }
      } catch {
        console.warn('[signup] /api/me fetch failed or timed out');
        const fallbackStep = urlStep === '3' ? 3 : urlStep === '2' ? 2 : 1;
        setStep(fallbackStep as Step);
      }

      if (active) setInitializing(false);
    };

    checkAuthStatus();

    return () => { active = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Failsafe: if auth check hangs despite individual timeouts, show the form
  useEffect(() => {
    if (!initializing) return;
    const failsafe = setTimeout(() => {
      console.warn('[signup] Auth check failsafe triggered — showing signup form');
      setInitializing(false);
    }, 6000);
    return () => clearTimeout(failsafe);
  }, [initializing]);

  // Step 1: Request access — sends magic link email
  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();

    if (email !== confirmEmail) {
      toast.error('Email addresses do not match');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setEmailSent(true);
  };

  // Step 2: Set password and save profile
  const handleProfileAndPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }
    if (!position) {
      toast.error('Please select a position');
      return;
    }

    setLoading(true);

    try {
      // Set the password — 8s timeout
      const { error: passwordError } = await Promise.race([
        supabase.auth.updateUser({ password }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Password update timed out')), 8000)),
      ]);
      if (passwordError) {
        toast.error(passwordError.message);
        setLoading(false);
        return;
      }

      // Get the current user — 4s timeout
      const { data: { user } } = await Promise.race([
        supabase.auth.getUser(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('getUser timed out')), 4000)),
      ]);
      if (!user) {
        toast.error('Session expired. Please sign in again.');
        setLoading(false);
        router.push('/login');
        return;
      }

      // Update the profile — 8s timeout
      const username = (user.email || email).split('@')[0];
      const { error } = await Promise.race([
        supabase
          .from('users')
          .update({
            username,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            location: location || null,
            position,
          })
          .eq('id', user.id),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Profile update timed out')), 8000)),
      ]);

      if (error) {
        toast.error('Failed to save profile');
        setLoading(false);
        return;
      }

      setLoading(false);
      setStep(3);
    } catch (err) {
      console.error('[signup] Step 2 failed:', err);
      toast.error('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  // Step 3: Verify access code or payment
  const handlePaymentStep = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessCode.trim()) {
      toast.error('Please enter an access code or complete payment');
      return;
    }

    setLoading(true);

    try {
      // Validate access code — server-side route, 8s timeout
      const response = await withTimeout(
        fetch('/api/stripe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessCode: accessCode.trim() }),
        }),
        8000,
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Invalid access code');
        setLoading(false);
        return;
      }

      // Store team_id if the access code belongs to a team
      const teamId = data.team_id || null;
      setPendingTeamId(teamId);

      // Update subscription status — 4s timeout on getUser, 8s on upsert
      const { data: { user } } = await Promise.race([
        supabase.auth.getUser(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('getUser timed out')), 4000)),
      ]);
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const upsertData: any = {
          id: user.id,
          email: user.email || email,
          subscription_status: 'bypass',
        };
        if (teamId) {
          upsertData.team_id = teamId;
        }
        await Promise.race([
          supabase.from('users').upsert(upsertData, { onConflict: 'id' }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Upsert timed out')), 8000)),
        ]);
      }

      toast.success('Account created successfully!');
      setLoading(false);
      window.location.href = '/main-menu';
    } catch (err) {
      console.error('[signup] Step 3 failed:', err);
      toast.error('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const stepTitles: Record<Step, string> = {
    1: 'Request Access',
    2: 'Complete Your Profile',
    3: 'Payment / Access Code',
  };

  // Show loading while determining auth state and correct step
  if (initializing) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">

        <WaveBackground centerYPercent={0.35} />
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
      <WaveBackground centerYPercent={0.35} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-30 w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <div className="scale-[2] origin-bottom translate-y-16">
            <Link href="/">
              <Logo size="large" glow className="max-w-[90vw]" />
            </Link>
          </div>
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

          <h1 className="text-2xl font-semibold text-[var(--text-primary)] text-center mb-6">
            {emailSent ? 'Check Your Email' : stepTitles[step]}
          </h1>

          {loading ? (
            <div className="py-12">
              <LoadingSpinner message="Please wait..." />
            </div>
          ) : (
            <>
              {/* Email confirmation message (shown after step 1 magic link) */}
              {emailSent && (
                <div className="text-center space-y-4">
                  <p className="text-[var(--text-secondary)] text-sm">
                    We&apos;ve sent a sign-up link to{' '}
                    <span className="text-[var(--text-primary)] font-medium">{email}</span>.
                    Please check your inbox and click the link to continue setting up your account.
                  </p>
                  <p className="text-[var(--text-muted)] text-xs mt-4">
                    Didn&apos;t receive it? Check your spam folder or try signing up again.
                  </p>
                </div>
              )}

              {/* Step 1: Request Access */}
              {!emailSent && step === 1 && (
                <form onSubmit={handleRequestAccess} className="space-y-1">
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
                    id="confirmEmail"
                    label="Confirm Email"
                    type="email"
                    placeholder="Confirm your email"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    required
                  />
                  <div className="flex items-start gap-2 pt-2 pb-1">
                    <input
                      type="checkbox"
                      id="termsCheckbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-[var(--accent-border)] accent-[var(--accent-primary)] cursor-pointer"
                    />
                    <label htmlFor="termsCheckbox" className="text-sm text-[var(--text-secondary)] cursor-pointer">
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={() => setShowTerms(true)}
                        className="text-[var(--accent-hover)] hover:text-[var(--accent-bright)] underline transition-colors cursor-pointer"
                      >
                        Privacy Policy &amp; Terms of Use
                      </button>
                    </label>
                  </div>
                  <Button type="submit" size="fullWidth" disabled={!termsAccepted || !email || !confirmEmail || email !== confirmEmail}>
                    SEND SIGN UP LINK
                  </Button>
                </form>
              )}

              {/* Step 2: Complete Your Profile */}
              {step === 2 && !emailSent && (
                <form onSubmit={handleProfileAndPassword} className="space-y-1">
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
                  <Select
                    id="location"
                    label="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    options={[
                      { value: '', label: 'Select Your State' },
                      ...US_STATES.map((state) => ({ value: state, label: state })),
                    ]}
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
                  <div className="mb-5">
                    <label className="block text-[var(--text-secondary)] text-sm font-medium mb-2">
                      Choose Your Accent Color
                    </label>
                    <AccentColorPicker />
                  </div>
                  <Button type="submit" size="fullWidth">
                    CREATE ACCOUNT
                  </Button>
                </form>
              )}

              {/* Step 3: Payment / Access Code */}
              {step === 3 && !emailSent && (
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
      </motion.div>

      {/* Terms of Use Modal */}
      <Modal isOpen={showTerms} onClose={() => setShowTerms(false)} title="Terms of Use">
        <TermsOfUse />
      </Modal>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">

          <WaveBackground centerYPercent={0.35} />
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
