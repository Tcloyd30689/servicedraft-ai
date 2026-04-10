'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Sun, Moon, LayoutDashboard, Shield, Users, LogOut } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { useAuth } from '@/hooks/useAuth';
import { useNarrativeStore } from '@/stores/narrativeStore';
import { cn } from '@/lib/utils';
import { APP_VERSION } from '@/lib/version';

export default function NavBar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { colorMode, toggleColorMode } = useTheme();
  const { profile, signOut } = useAuth();
  const { resetAll } = useNarrativeStore();

  // Prevent hydration mismatch: server always renders 'dark' default,
  // so defer reading the real colorMode until after client-side mount.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);
  const displayMode = isMounted ? colorMode : 'dark';
  const isDark = displayMode === 'dark';

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    resetAll();
    await signOut();
  };

  const navBtnClasses = cn(
    'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide uppercase transition-all duration-300 border cursor-pointer',
    'bg-[var(--accent-10)] border-[var(--accent-border)] text-[var(--accent-bright)]',
    'hover:bg-[var(--accent-20)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:shadow-[var(--shadow-glow-btn)]',
  );

  return (
    <nav className="fixed left-0 right-0 h-16 flex items-center px-6 bg-[var(--bg-nav)] backdrop-blur-[8px] border-b border-[var(--accent-20)] z-[100]" style={{ top: '100px' }}>
      {/* LEFT SECTION: Main Menu button */}
      <div className="flex-shrink-0">
        <Link
          href="/main-menu"
          className={cn(
            'inline-flex items-center justify-center rounded-lg px-4 py-1.5 text-sm font-semibold tracking-wide uppercase transition-all duration-300 border',
            'bg-[var(--accent-10)] border-[var(--accent-border)] text-[var(--text-primary)]',
            'hover:bg-[var(--accent-20)] hover:text-white hover:border-[var(--accent-primary)] hover:shadow-[var(--shadow-glow-btn)]',
            pathname === '/main-menu' && 'bg-[var(--accent-20)] shadow-[var(--shadow-glow-sm)]',
          )}
        >
          Main Menu
        </Link>
      </div>

      {/* CENTER SECTION: App version label */}
      <div className="hidden md:block absolute left-1/2 -translate-x-1/2">
        <span className="text-sm font-medium text-[var(--accent-bright)]">
          {APP_VERSION}
        </span>
      </div>

      {/* RIGHT SECTION: Nav buttons (desktop), Theme toggle, Mobile hamburger */}
      <div className="flex items-center gap-1.5 ml-auto">
        {/* Desktop nav buttons — hidden on mobile */}
        <div className="hidden sm:flex items-center gap-1.5">
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className={cn(navBtnClasses, pathname === '/dashboard' && 'bg-[var(--accent-20)] shadow-[var(--shadow-glow-sm)]')}
          >
            <LayoutDashboard size={14} />
            <span className="hidden lg:inline">Dashboard</span>
          </Link>

          {profile?.role === 'owner' && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(navBtnClasses, pathname === '/admin' && 'bg-[var(--accent-20)] shadow-[var(--shadow-glow-sm)]')}
            >
              <Shield size={14} />
              <span className="hidden lg:inline">Owner</span>
            </Link>
          )}

          {profile?.role === 'admin' && (
            <Link
              href="/team-dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(navBtnClasses, pathname === '/team-dashboard' && 'bg-[var(--accent-20)] shadow-[var(--shadow-glow-sm)]')}
            >
              <Users size={14} />
              <span className="hidden lg:inline">Team</span>
            </Link>
          )}

          <button
            onClick={handleLogout}
            className={navBtnClasses}
          >
            <LogOut size={14} />
            <span className="hidden lg:inline">Log Out</span>
          </button>
        </div>

        {/* Light/Dark mode toggle */}
        <button
          onClick={toggleColorMode}
          className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-white hover:bg-[var(--accent-10)] hover:shadow-[var(--shadow-glow-sm)] transition-all duration-300 cursor-pointer"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

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
        <div className="absolute top-16 left-0 right-0 bg-[var(--bg-nav)] backdrop-blur-[8px] border-b border-[var(--accent-20)] sm:hidden z-[100]">
          <div className="flex flex-col p-4 gap-1">
            <Link
              href="/main-menu"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-2 text-[var(--text-secondary)] text-sm font-medium px-4 py-3 rounded-md transition-all duration-200',
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
                'flex items-center gap-2 text-[var(--text-secondary)] text-sm font-medium px-4 py-3 rounded-md transition-all duration-200',
                'hover:text-[var(--text-primary)] hover:bg-[var(--accent-10)]',
                pathname === '/dashboard' && 'text-[var(--text-primary)] bg-[var(--accent-20)]',
              )}
            >
              <LayoutDashboard size={16} />
              User Dashboard
            </Link>

            {profile?.role === 'owner' && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-2 text-[var(--text-secondary)] text-sm font-medium px-4 py-3 rounded-md transition-all duration-200',
                  'hover:text-[var(--text-primary)] hover:bg-[var(--accent-10)]',
                  pathname === '/admin' && 'text-[var(--text-primary)] bg-[var(--accent-20)]',
                )}
              >
                <Shield size={16} />
                Owner Dashboard
              </Link>
            )}

            {profile?.role === 'admin' && (
              <Link
                href="/team-dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-2 text-[var(--text-secondary)] text-sm font-medium px-4 py-3 rounded-md transition-all duration-200',
                  'hover:text-[var(--text-primary)] hover:bg-[var(--accent-10)]',
                  pathname === '/team-dashboard' && 'text-[var(--text-primary)] bg-[var(--accent-20)]',
                )}
              >
                <Users size={16} />
                Team Dashboard
              </Link>
            )}

            <div className="border-t border-[var(--accent-15)] my-1" />

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-[var(--text-secondary)] text-sm font-medium px-4 py-3 rounded-md transition-all duration-200 hover:text-[var(--text-primary)] hover:bg-[var(--accent-10)] cursor-pointer w-full text-left"
            >
              <LogOut size={16} />
              Log Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
