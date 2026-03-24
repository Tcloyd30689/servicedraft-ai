'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, LayoutDashboard, LogOut, HelpCircle, MessageSquare, FileText, Shield, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNarrativeStore } from '@/stores/narrativeStore';
import LiquidCard from '@/components/ui/LiquidCard';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import FAQContent from '@/components/layout/FAQContent';
import SupportForm from '@/components/layout/SupportForm';
import TermsOfUse from '@/components/layout/TermsOfUse';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function MainMenuPage() {
  const router = useRouter();
  const { profile, loading, signOut } = useAuth();
  const { resetAll } = useNarrativeStore();
  const [showFAQ, setShowFAQ] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [loadingTooLong, setLoadingTooLong] = useState(false);

  // Guard: redirect to onboarding if profile is incomplete
  useEffect(() => {
    if (loading) return;
    if (!profile) return; // Profile failed to load — show spinner, don't redirect

    const needsProfile = !profile.username;
    const needsPayment = !needsProfile && (!profile.subscription_status || profile.subscription_status === 'trial');

    if (needsProfile) {
      router.replace('/signup?step=2');
    } else if (needsPayment) {
      router.replace('/signup?step=3');
    }
  }, [loading, profile, router]);

  // 8-second timer: if still loading/no profile, show reset button
  useEffect(() => {
    if (!loading && profile) return; // Already loaded fine
    const timer = setTimeout(() => {
      setLoadingTooLong(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [loading, profile]);

  const handleResetSession = () => {
    // Clear all sb- cookies
    document.cookie.split(';').forEach((c) => {
      const name = c.trim().split('=')[0];
      if (name.startsWith('sb-')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });
    // Clear localStorage keys
    localStorage.removeItem('sd-login-timestamp');
    localStorage.removeItem('sd-accent-color');
    localStorage.removeItem('sd-color-mode');
    localStorage.removeItem('sd-bg-animation');
    window.location.href = '/';
  };

  // Show loading spinner while auth is resolving
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-164px)] px-4">
        <LiquidCard size="spacious">
          <div className="py-12 flex flex-col items-center gap-4">
            <LoadingSpinner message="Loading..." />
            {loadingTooLong && (
              <div className="mt-4 text-center">
                <p className="text-[var(--text-muted)] text-sm mb-3">
                  Taking longer than expected. You can reset your session to start fresh.
                </p>
                <button
                  onClick={handleResetSession}
                  className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-[var(--btn-text-on-accent)] text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Reset Session
                </button>
              </div>
            )}
          </div>
        </LiquidCard>
      </div>
    );
  }

  // Auth finished loading but profile is null — show recovery UI
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-164px)] px-4">
        <LiquidCard size="spacious">
          <div className="py-12 flex flex-col items-center gap-4">
            <p className="text-[var(--text-muted)] text-sm text-center">
              Unable to load your profile. This can happen if your session timed out.
            </p>
            <div className="flex gap-3">
              <Button
                variant="primary"
                size="small"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={handleResetSession}
              >
                Re-Login
              </Button>
            </div>
          </div>
        </LiquidCard>
      </div>
    );
  }

  const handleLogout = async () => {
    resetAll();
    await signOut();
  };

  const menuItems = [
    {
      label: 'GENERATE NEW STORY',
      icon: <Sparkles size={20} />,
      onClick: () => router.push('/input'),
      variant: 'primary' as const,
    },
    {
      label: 'USER DASHBOARD',
      icon: <LayoutDashboard size={20} />,
      onClick: () => router.push('/dashboard'),
      variant: 'secondary' as const,
    },
    // Owner-level: Owner Dashboard button
    ...(profile.role === 'owner'
      ? [{
          label: 'OWNER DASHBOARD',
          icon: <Shield size={20} />,
          onClick: () => router.push('/admin'),
          variant: 'secondary' as const,
        }]
      : []),
    // Admin-level: Team Dashboard button
    ...(profile.role === 'admin'
      ? [{
          label: 'TEAM DASHBOARD',
          icon: <Users size={20} />,
          onClick: () => router.push('/team-dashboard'),
          variant: 'secondary' as const,
        }]
      : []),
    {
      label: 'LOG OUT',
      icon: <LogOut size={20} />,
      onClick: handleLogout,
      variant: 'secondary' as const,
    },
  ];

  const bottomItems = [
    {
      label: 'FAQ / INFO',
      icon: <HelpCircle size={16} />,
      onClick: () => setShowFAQ(true),
    },
    {
      label: 'SUPPORT',
      icon: <MessageSquare size={16} />,
      onClick: () => setShowSupport(true),
    },
    {
      label: 'TERMS OF USE',
      icon: <FileText size={16} />,
      onClick: () => setShowTerms(true),
    },
  ];

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-164px)] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-2xl"
      >
        <LiquidCard size="spacious">
          <div className="flex flex-col items-center gap-6">
            {/* Heading — replaces the old logo */}
            <motion.h1
              className="text-2xl sm:text-3xl tracking-wide"
              style={{ color: 'var(--accent-text-emphasis)', fontWeight: 'var(--accent-text-emphasis-weight)' as unknown as number }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Main Menu
            </motion.h1>

            {/* Menu buttons */}
            <div className="flex flex-col gap-3 w-full max-w-md">
              {menuItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                >
                  <Button
                    variant={item.variant}
                    size="fullWidth"
                    onClick={item.onClick}
                    className="flex items-center justify-center gap-2"
                  >
                    {item.icon}
                    {item.label}
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* Bottom links */}
            <motion.div
              className="flex items-center gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              {bottomItems.map((item) => (
                <motion.button
                  key={item.label}
                  onClick={item.onClick}
                  className="flex items-center gap-1.5 text-[var(--text-muted)] text-sm hover:text-[var(--accent-bright)] transition-colors cursor-pointer"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  {item.icon}
                  {item.label}
                </motion.button>
              ))}
            </motion.div>
          </div>
        </LiquidCard>
      </motion.div>

      {/* FAQ Modal */}
      <Modal isOpen={showFAQ} onClose={() => setShowFAQ(false)} title="FAQ & Instructions">
        <FAQContent />
      </Modal>

      {/* Support Modal */}
      <Modal isOpen={showSupport} onClose={() => setShowSupport(false)} title="Contact Support">
        <SupportForm onClose={() => setShowSupport(false)} />
      </Modal>

      {/* Terms of Use Modal */}
      <Modal isOpen={showTerms} onClose={() => setShowTerms(false)} title="Terms of Use">
        <TermsOfUse />
      </Modal>
    </div>
  );
}
