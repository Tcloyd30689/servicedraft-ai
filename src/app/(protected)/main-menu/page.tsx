'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, LayoutDashboard, LogOut, HelpCircle, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNarrativeStore } from '@/stores/narrativeStore';
import LiquidCard from '@/components/ui/LiquidCard';
import Logo from '@/components/ui/Logo';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import FAQContent from '@/components/layout/FAQContent';
import SupportForm from '@/components/layout/SupportForm';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function MainMenuPage() {
  const router = useRouter();
  const { profile, loading, signOut } = useAuth();
  const { resetAll } = useNarrativeStore();
  const [showFAQ, setShowFAQ] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  // Guard: redirect to onboarding if profile is incomplete
  useEffect(() => {
    if (loading) return;

    if (profile) {
      const needsPayment =
        !profile.subscription_status || profile.subscription_status === 'trial';
      const needsProfile = !needsPayment && !profile.username;

      if (needsPayment) {
        router.replace('/signup?step=2');
      } else if (needsProfile) {
        router.replace('/signup?step=3');
      }
    }
  }, [loading, profile, router]);

  // Show loading while checking onboarding status
  if (loading || !profile || !profile.subscription_status ||
      profile.subscription_status === 'trial' || !profile.username) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <LiquidCard size="spacious">
          <div className="py-12">
            <LoadingSpinner message="Loading..." />
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
  ];

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <LiquidCard size="spacious">
          <div className="flex flex-col items-center gap-8">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Logo size="medium" glow />
            </motion.div>

            {/* Menu buttons */}
            <div className="flex flex-col gap-3 w-full">
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
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="flex items-center gap-1.5 text-[#9ca3af] text-sm hover:text-[#c084fc] transition-colors cursor-pointer"
                >
                  {item.icon}
                  {item.label}
                </button>
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
    </div>
  );
}
