'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import UserPopup from '@/components/layout/UserPopup';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/main-menu', label: 'Main Menu' },
  { href: '/dashboard', label: 'Dashboard' },
];

export default function NavBar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-6 bg-black/80 backdrop-blur-[8px] border-b border-[rgba(168,85,247,0.2)] z-[100]">
      {/* Left: Logo */}
      <Link href="/main-menu" className="flex items-center">
        <Logo size="small" />
      </Link>

      {/* Center: Nav links (desktop) */}
      <div className="hidden md:flex items-center gap-1">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'text-[#c4b5fd] text-sm font-medium px-4 py-2 rounded-md transition-all duration-200',
              'hover:text-white hover:bg-[rgba(168,85,247,0.1)]',
              pathname === link.href &&
                'text-white bg-[rgba(168,85,247,0.2)]',
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Right: User popup */}
      <div className="flex items-center gap-3">
        <UserPopup />

        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-[#c4b5fd] hover:text-white transition-colors cursor-pointer"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-black/95 backdrop-blur-[8px] border-b border-[rgba(168,85,247,0.2)] md:hidden">
          <div className="flex flex-col p-4 gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'text-[#c4b5fd] text-sm font-medium px-4 py-3 rounded-md transition-all duration-200',
                  'hover:text-white hover:bg-[rgba(168,85,247,0.1)]',
                  pathname === link.href &&
                    'text-white bg-[rgba(168,85,247,0.2)]',
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
