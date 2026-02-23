'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { useAuth } from '@/hooks/useAuth';
import UserPopup from '@/components/layout/UserPopup';
import PositionIcon from '@/components/ui/PositionIcon';
import { cn } from '@/lib/utils';

export default function NavBar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { colorMode, toggleColorMode } = useTheme();
  const { profile } = useAuth();

  return (
    <nav className="fixed left-0 right-0 h-14 flex items-center justify-between px-6 bg-[var(--bg-nav)] backdrop-blur-[8px] border-b border-[var(--accent-20)] z-[100]" style={{ top: '200px' }}>
      {/* Left: SD icon + "Main Menu" label */}
      <Link
        href="/main-menu"
        className={cn(
          'flex items-center gap-2 flex-shrink-0 rounded-md px-2 py-1.5 transition-all duration-200',
          'hover:bg-[var(--accent-10)]',
          pathname === '/main-menu' && 'bg-[var(--accent-20)]',
        )}
      >
        <Image
          src="/ServiceDraft-ai-tight logo.PNG"
          alt="ServiceDraft.AI"
          width={32}
          height={32}
          priority
          className="object-contain"
        />
        <span className={cn(
          'hidden sm:inline text-sm font-medium transition-colors duration-200',
          pathname === '/main-menu'
            ? 'text-[var(--text-primary)]'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
        )}>
          Main Menu
        </span>
      </Link>

      {/* Right: Dashboard link, Theme toggle, User popup, Mobile toggle */}
      <div className="flex items-center gap-2">
        {/* Dashboard: Position icon + label */}
        <Link
          href="/dashboard"
          className={cn(
            'flex items-center gap-2 rounded-md px-2 py-1.5 transition-all duration-200',
            'hover:bg-[var(--accent-10)]',
            pathname === '/dashboard' && 'bg-[var(--accent-20)]',
          )}
        >
          <PositionIcon position={profile?.position ?? null} size="small" className="!w-7 !h-7 !border" />
          <span className={cn(
            'hidden sm:inline text-sm font-medium transition-colors duration-200',
            pathname === '/dashboard'
              ? 'text-[var(--text-primary)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
          )}>
            Dashboard
          </span>
        </Link>

        {/* Light/Dark mode toggle */}
        <button
          onClick={toggleColorMode}
          className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-10)] transition-all duration-200 cursor-pointer"
          aria-label={colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {colorMode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

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
        <div className="absolute top-14 left-0 right-0 bg-[var(--bg-nav)] backdrop-blur-[8px] border-b border-[var(--accent-20)] sm:hidden">
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
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'text-[var(--text-secondary)] text-sm font-medium px-4 py-3 rounded-md transition-all duration-200',
                'hover:text-[var(--text-primary)] hover:bg-[var(--accent-10)]',
                pathname === '/dashboard' && 'text-[var(--text-primary)] bg-[var(--accent-20)]',
              )}
            >
              Dashboard
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
