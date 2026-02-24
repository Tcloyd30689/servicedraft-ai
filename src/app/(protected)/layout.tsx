'use client';

import HeroArea from '@/components/layout/HeroArea';
import NavBar from '@/components/layout/NavBar';
import ParticleNetwork from '@/components/ui/ParticleNetwork';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { useTheme } from '@/components/ThemeProvider';
import { useSessionExpiry } from '@/hooks/useSessionExpiry';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { backgroundAnimation } = useTheme();
  useSessionExpiry();

  return (
    <>
      {/* Full-page particle network background — z-10, behind all content */}
      {backgroundAnimation && <ParticleNetwork />}

      {/* Hero title area — fixed top, reactive sine wave + large logo */}
      <HeroArea />

      {/* Navigation bar — fixed below hero */}
      <NavBar />

      {/* Page content — pushed below fixed hero (100px) + fixed nav (56px) */}
      <main className="relative z-30 min-h-[calc(100vh-156px)]" style={{ paddingTop: '156px' }}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </>
  );
}
