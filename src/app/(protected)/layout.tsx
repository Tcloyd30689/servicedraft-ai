'use client';

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
      <WaveBackground />
      <NavBar />
      <main className="relative z-30 pt-16 min-h-screen">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </>
  );
}
