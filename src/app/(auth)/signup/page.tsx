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

  // OTP verification state
  const [otpCode, setOtpCode] = useState('');
  const [otpEmail, setOtpEmail] = useState(''); // Preserves email for verification + resend
  const [resendCooldown, setResendCooldown] = useState(0); // Seconds remaining before resend allowed

  const supabase = createClient();

  // On mount: check auth status and determine the correct step
  useEffect(() => {
    let active = true;

    const checkAuthStatus = async () => {
      // Check session status entirely server-side to avoid browser
      // Supabase client singleton lock issues.
      try {
        const res = await withTimeout(fetch('/api/me', { credentials: 'include' }), 4000);
        if (!active) return;

        if (res.ok) {
          const profile = await res.json();

          if (profile) {
            // Pre-fill email from profile if available
            if (profile.email) setEmail(profile.email);

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
            // Profile returned but empty — go to step 2
            setStep(urlStep === '3' ? 3 : 2);
          }
        } else if (res.status === 401) {
          // No valid session — show appropriate step based on URL
          const fallbackStep = urlStep === '3' ? 3 : urlStep === '2' ? 2 : 1;
          setStep(fallbackStep as Step);
        } else {
          // Server error — show step based on URL
          setStep(urlStep === '3' ? 3 : 2);
        }
      } catch {
        console.warn('[signup] /api/me check failed or timed out');
        const fallbackStep = urlStep === '3' ? 3 : urlStep === '2' ? 2 : 1;
        setStep(fallbackStep as Step);
      }

      if (active) setInitializing(false);

      // Handle error redirects from /auth/callback
      const errorParam = searchParams.get('error');
      if (active && errorParam) {
        // Use setTimeout to ensure toast renders after component mounts
        setTimeout(() => {
          if (errorParam === 'cross-browser') {
            toast.error(
              'The sign-up link was opened in a different browser. Enter your email below and use the 6-digit code instead.',
              { duration: 8000 }
            );
          } else if (errorParam === 'link-expired') {
            toast.error(
              'Your sign-up link has expired or was already used. Please request a new code below.',
              { duration: 6000 }
            );
          }
        }, 500);
        // Clean the URL so the error doesn't re-trigger on refresh
        window.history.replaceState({}, '', '/signup');
      }
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

  // Resend cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Detect current browser for the warning message
  const getBrowserName = (): string => {
    if (typeof navigator === 'undefined') return 'this browser';
    const ua = navigator.userAgent;
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    return 'this browser';
  };

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
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback` },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setOtpEmail(email);
    setResendCooldown(60);
    setLoading(false);
    setEmailSent(true);
  };

  // OTP code verification — server-side, no PKCE cookie dependency
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = otpCode.replace(/\s/g, '');
    if (!/^\d{6,8}$/.test(cleanCode)) {
      toast.error('Please enter the verification code from your email');
      return;
    }

    setLoading(true);

    try {
      const res = await withTimeout(
        fetch('/api/signup/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: otpEmail, token: cleanCode }),
        }),
        10000,
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Verification failed');
        setLoading(false);
        return;
      }

      // Success — session cookies are now set. Advance to step 2.
      toast.success('Email verified!');
      setEmailSent(false);
      setOtpCode('');
      setStep(2);
    } catch {
      toast.error('Request timed out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP code (reuses the same signInWithOtp flow)
  const handleResendCode = async () => {
    if (!otpEmail || resendCooldown > 0) return;
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: otpEmail,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        // Supabase rate limit returns a specific error
        if (error.message.toLowerCase().includes('rate') || error.message.toLowerCase().includes('seconds')) {
          toast.error('Please wait before requesting another code.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('New code sent! Check your email.');
        setOtpCode('');
        setResendCooldown(60);
      }
    } catch {
      toast.error('Failed to resend. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Set password and save profile — via server-side API route
  // The browser Supabase singleton's auto-refresh daemon can lock up after
  // exchangeCodeForSession() runs server-side in the callback route.
  // Routing through a server API avoids the singleton lock entirely.
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
      const res = await withTimeout(
        fetch('/api/signup/complete-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            password,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            location: location || null,
            position,
            accentColor: localStorage.getItem('sd-accent-color') || undefined,
          }),
        }),
        15000, // 15s timeout — generous because this does password update + profile save
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to create profile');
        setLoading(false);
        return;
      }

      setLoading(false);
      setStep(3);
    } catch (err) {
      console.error('[signup] Step 2 failed:', err);
      toast.error('Request timed out. Please try again.');
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

      // Activate account server-side (avoids browser client singleton lock)
      const activateRes = await withTimeout(
        fetch('/api/signup/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ teamId: data.team_id || null }),
        }),
        10000,
      );

      if (!activateRes.ok) {
        const activateData = await activateRes.json();
        console.error('[signup] Activation failed:', activateData.error);
        // Non-fatal — access code was valid, proceed anyway
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
              {/* OTP code entry (shown after step 1 email send) */}
              {emailSent && (
                <div className="space-y-4">
                  <p className="text-[var(--text-secondary)] text-sm text-center">
                    We sent a verification code to{' '}
                    <span className="text-[var(--text-primary)] font-medium">{otpEmail}</span>.
                    Enter it below to continue.
                  </p>

                  <form onSubmit={handleVerifyOtp} className="space-y-3">
                    <div>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={8}
                        placeholder="00000000"
                        value={otpCode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          if (val.length <= 8) setOtpCode(val);
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 8);
                          setOtpCode(pasted);
                        }}
                        className="w-full text-center text-2xl tracking-[0.3em] font-mono py-3 px-4 rounded-lg bg-[var(--bg-input)] border border-[var(--accent-border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
                        autoFocus
                      />
                    </div>

                    <Button type="submit" size="fullWidth" disabled={otpCode.replace(/\s/g, '').length < 6}>
                      VERIFY CODE
                    </Button>
                  </form>

                  <p className="text-[var(--text-muted)] text-xs text-center mt-2">
                    You can also click the link in the email if you&apos;re using {getBrowserName()}.
                  </p>

                  <div className="flex flex-col items-center gap-2 pt-1">
                    <p className="text-[var(--text-muted)] text-xs">
                      Didn&apos;t receive it? Check your spam folder or{' '}
                      {resendCooldown > 0 ? (
                        <span className="text-[var(--text-muted)]">
                          resend in {resendCooldown}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendCode}
                          disabled={loading}
                          className="text-[var(--accent-hover)] hover:text-[var(--accent-bright)] underline transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          resend code
                        </button>
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailSent(false);
                        setOtpCode('');
                        setOtpEmail('');
                        setResendCooldown(0);
                      }}
                      className="text-[var(--text-muted)] text-xs hover:text-[var(--text-secondary)] underline transition-colors cursor-pointer"
                    >
                      Use a different email
                    </button>
                  </div>
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
