'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import UserPopup from '@/components/layout/UserPopup';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/main-menu', label: 'Main Menu' },
  { href: '/dashboard', label: 'Dashboard' },
];

export default function NavBar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { colorMode, toggleColorMode } = useTheme();

  return (
    <nav className="sticky top-0 w-full h-14 flex items-center justify-between px-6 bg-[var(--bg-nav)] backdrop-blur-[8px] border-b border-[var(--accent-20)] z-[100]">
      {/* Left: Tight icon logo */}
      <Link href="/main-menu" className="flex items-center flex-shrink-0">
        <Image
          src="/ServiceDraft-ai-tight logo.PNG"
          alt="ServiceDraft.AI"
          width={36}
          height={36}
          priority
          className="object-contain"
        />
      </Link>

      {/* Center: Nav links (desktop) */}
      <div className="hidden md:flex items-center gap-1">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'text-[var(--text-secondary)] text-sm font-medium px-4 py-2 rounded-md transition-all duration-200',
              'hover:text-[var(--text-primary)] hover:bg-[var(--accent-10)]',
              pathname === link.href &&
                'text-[var(--text-primary)] bg-[var(--accent-20)]',
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Right: Theme toggle, User popup, Mobile toggle */}
      <div className="flex items-center gap-3">
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
          className="md:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-14 left-0 right-0 bg-[var(--bg-nav)] backdrop-blur-[8px] border-b border-[var(--accent-20)] md:hidden">
          <div className="flex flex-col p-4 gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'text-[var(--text-secondary)] text-sm font-medium px-4 py-3 rounded-md transition-all duration-200',
                  'hover:text-[var(--text-primary)] hover:bg-[var(--accent-10)]',
                  pathname === link.href &&
                    'text-[var(--text-primary)] bg-[var(--accent-20)]',
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
