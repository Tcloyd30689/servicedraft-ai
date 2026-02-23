'use client';

import HeroArea from '@/components/layout/HeroArea';
import NavBar from '@/components/layout/NavBar';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Hero title area — full width, reactive sine wave + large logo */}
      <HeroArea />

      {/* Navigation bar — sits directly below hero */}
      <NavBar />

      {/* Page content */}
      <main className="relative z-30 min-h-[calc(100vh-146px)]">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
    </>
  );
}
