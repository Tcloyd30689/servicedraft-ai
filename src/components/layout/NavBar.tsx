'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Menu, Sun, Moon, Home, Edit3, FileText, LayoutDashboard, Users, Shield, LogOut } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { useAuth } from '@/hooks/useAuth';
import { useNarrativeStore } from '@/stores/narrativeStore';
import { cn } from '@/lib/utils';
import { APP_VERSION } from '@/lib/version';

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { colorMode, toggleColorMode } = useTheme();
  const { profile, signOut } = useAuth();
  const { resetAll } = useNarrativeStore();

  // Prevent hydration mismatch: server always renders 'dark' default,
  // so defer reading the real colorMode until after client-side mount.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);
  const displayMode = isMounted ? colorMode : 'dark';
  const isDark = displayMode === 'dark';

  // Close dropdown on click outside
  useEffect(() => {
    if (!navOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setNavOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [navOpen]);

  // Close dropdown on route change
  useEffect(() => { setNavOpen(false); }, [pathname]);

  const handleLogout = async () => {
    setNavOpen(false);
    resetAll();
    await signOut();
  };

  const getPageName = (path: string) => {
    if (path === '/main-menu') return 'Main Menu';
    if (path === '/input') return 'Input Page';
    if (path === '/narrative') return 'Generated Story';
    if (path === '/dashboard') return 'User Dashboard';
    if (path === '/team-dashboard') return 'Team Dashboard';
    if (path === '/admin') return 'Owner Dashboard';
    return 'Navigate';
  };

  const dropdownItemClasses = cn(
    'nav-item-hover flex items-center gap-2.5 text-sm font-medium px-4 py-2.5 rounded-md w-full text-left',
    'text-[var(--text-secondary)]',
  );

  const isOwnerOrAdmin = profile?.role === 'owner' || profile?.role === 'admin';

  return (
    <nav className="fixed left-0 right-0 h-16 flex items-center px-6 bg-[var(--bg-nav)] backdrop-blur-[8px] border-b border-[var(--accent-20)] z-[100]" style={{ top: '100px' }}>
      {/* LEFT: Back / Forward arrows */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="nav-btn-hover w-8 h-8 flex items-center justify-center rounded-full border border-[var(--accent-border)] bg-[var(--accent-10)] text-[var(--accent-bright)] cursor-pointer"
          aria-label="Go back"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => router.forward()}
          className="nav-btn-hover w-8 h-8 flex items-center justify-center rounded-full border border-[var(--accent-border)] bg-[var(--accent-10)] text-[var(--accent-bright)] cursor-pointer"
          aria-label="Go forward"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* CENTER: App version label */}
      <div className="hidden md:block absolute left-1/2 -translate-x-1/2">
        <span className="text-sm font-medium text-[var(--accent-bright)]">
          {APP_VERSION}
        </span>
      </div>

      {/* RIGHT: Nav dropdown + Theme toggle */}
      <div className="flex items-center gap-1.5 ml-auto">
        {/* Navigation dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setNavOpen(!navOpen)}
            className={cn(
              'nav-trigger-hover inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide uppercase border cursor-pointer',
              'bg-[var(--accent-10)] border-[var(--accent-border)] text-[var(--accent-bright)]',
              navOpen && 'bg-[var(--accent-20)] border-[var(--accent-primary)] shadow-[var(--shadow-glow-sm)]',
            )}
            aria-label="Navigation menu"
          >
            <Menu size={14} />
            <span>{getPageName(pathname)}</span>
          </button>

          {navOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[var(--accent-20)] bg-[var(--bg-nav)] backdrop-blur-[12px] shadow-lg shadow-black/30 overflow-hidden z-[110]">
              <div className="flex flex-col p-2 gap-0.5">
                <Link
                  href="/main-menu"
                  onClick={() => setNavOpen(false)}
                  className={cn(dropdownItemClasses, pathname === '/main-menu' && 'text-[var(--accent-bright)] bg-[var(--accent-10)]')}
                >
                  <Home size={16} />
                  Main Menu
                </Link>

                {profile && (
                  <Link
                    href="/input"
                    onClick={() => setNavOpen(false)}
                    className={cn(dropdownItemClasses, pathname === '/input' && 'text-[var(--accent-bright)] bg-[var(--accent-10)]')}
                  >
                    <Edit3 size={16} />
                    Input Page
                  </Link>
                )}

                {profile && (
                  <Link
                    href="/narrative"
                    onClick={() => setNavOpen(false)}
                    className={cn(dropdownItemClasses, pathname === '/narrative' && 'text-[var(--accent-bright)] bg-[var(--accent-10)]')}
                  >
                    <FileText size={16} />
                    Generated Story
                  </Link>
                )}

                {profile && (
                  <Link
                    href="/dashboard"
                    onClick={() => setNavOpen(false)}
                    className={cn(dropdownItemClasses, pathname === '/dashboard' && 'text-[var(--accent-bright)] bg-[var(--accent-10)]')}
                  >
                    <LayoutDashboard size={16} />
                    User Dashboard
                  </Link>
                )}

                {isOwnerOrAdmin && (
                  <Link
                    href="/team-dashboard"
                    onClick={() => setNavOpen(false)}
                    className={cn(dropdownItemClasses, pathname === '/team-dashboard' && 'text-[var(--accent-bright)] bg-[var(--accent-10)]')}
                  >
                    <Users size={16} />
                    Team Dashboard
                  </Link>
                )}

                {profile?.role === 'owner' && (
                  <Link
                    href="/admin"
                    onClick={() => setNavOpen(false)}
                    className={cn(dropdownItemClasses, pathname === '/admin' && 'text-[var(--accent-bright)] bg-[var(--accent-10)]')}
                  >
                    <Shield size={16} />
                    Owner Dashboard
                  </Link>
                )}

                <div className="border-t border-[var(--accent-15)] my-1" />

                <button
                  onClick={handleLogout}
                  className={cn(dropdownItemClasses)}
                >
                  <LogOut size={16} />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Light/Dark mode toggle pill */}
        <button
          onClick={toggleColorMode}
          className="theme-toggle-pill"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className={`theme-toggle-track ${isDark ? 'is-dark' : 'is-light'}`}>
            <span className="theme-toggle-thumb" />
            <Moon size={13} className="theme-toggle-icon theme-icon-moon" />
            <Sun size={13} className="theme-toggle-icon theme-icon-sun" />
          </span>
        </button>
      </div>
    </nav>
  );
}
