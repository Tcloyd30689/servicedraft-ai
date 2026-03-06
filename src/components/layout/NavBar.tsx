'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import UserPopup from '@/components/layout/UserPopup';
import { cn } from '@/lib/utils';

export default function NavBar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { colorMode, toggleColorMode } = useTheme();

  // Prevent hydration mismatch: server always renders 'dark' default,
  // so defer reading the real colorMode until after client-side mount.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);
  const displayMode = isMounted ? colorMode : 'dark';
  const isDark = displayMode === 'dark';

  return (
    <nav className="fixed left-0 right-0 h-16 flex items-center px-6 bg-[var(--bg-nav)] backdrop-blur-[8px] border-b border-[var(--accent-20)] z-[100]" style={{ top: '100px' }}>
      {/* LEFT SECTION: Main Menu button */}
      <div className="flex-shrink-0">
        <Link
          href="/main-menu"
          className={cn(
            'inline-flex items-center justify-center rounded-lg px-4 py-1.5 text-sm font-semibold tracking-wide uppercase transition-all duration-200 border',
            'bg-[var(--accent-10)] border-[var(--accent-border)] text-[var(--text-primary)]',
            'hover:bg-[var(--accent-20)] hover:shadow-[var(--shadow-glow-sm)]',
            pathname === '/main-menu' && 'bg-[var(--accent-20)] shadow-[var(--shadow-glow-sm)]',
          )}
        >
          Main Menu
        </Link>
      </div>

      {/* CENTER SECTION: Vector logo (decorative, not clickable) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <Image
          src="/ServiceDraft-Ai Vector Logo.png"
          alt=""
          width={160}
          height={30}
          priority
          className="object-contain"
          style={{
            height: '30px',
            width: 'auto',
            filter: isDark ? 'brightness(0) invert(1)' : 'brightness(0)',
          }}
          aria-hidden="true"
        />
      </div>

      {/* RIGHT SECTION: Theme toggle, User popup, Mobile menu toggle */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Light/Dark mode toggle */}
        <button
          onClick={toggleColorMode}
          className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-10)] transition-all duration-200 cursor-pointer"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Combined user button (T.Cloyd format) with dropdown */}
        <UserPopup />

        {/* Mobile menu toggle */}
        <button
          className="sm:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-[var(--bg-nav)] backdrop-blur-[8px] border-b border-[var(--accent-20)] sm:hidden">
          <div className="flex flex-col p-4 gap-2">
            <Link
              href="/main-menu"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'text-[var(--text-secondary)] text-sm font-medium px-4 py-3 rounded-md transition-all duration-200',
                'hover:text-[var(--text-primary)] hover:bg-[var(--accent-10)]',
                pathname === '/main-menu' && 'text-[var(--text-primary)] bg-[var(--accent-20)]',
              )}
            >
              Main Menu
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
