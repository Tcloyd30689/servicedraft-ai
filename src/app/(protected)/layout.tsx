'use client';

import HeroArea from '@/components/layout/HeroArea';
import NavBar from '@/components/layout/NavBar';
import WaveBackground from '@/components/ui/WaveBackground';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Full-page sine wave background — z-10, behind all content */}
      <WaveBackground />

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
