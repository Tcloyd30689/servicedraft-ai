'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNarrativeStore } from '@/stores/narrativeStore';
import PositionIcon from '@/components/ui/PositionIcon';

export default function UserPopup() {
  const { profile, signOut } = useAuth();
  const { resetAll } = useNarrativeStore();
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={popupRef}>
      {/* Avatar trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer transition-all duration-200 hover:shadow-[0_0_15px_var(--accent-40)] rounded-full"
        aria-label="User menu"
      >
        <PositionIcon position={profile?.position ?? null} size="small" />
      </button>

      {/* Popup dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-64 bg-[var(--bg-card)] border border-[var(--accent-30)] rounded-xl backdrop-blur-md shadow-[var(--shadow-glow-md)] p-4">
          <div className="mb-3 pb-3 border-b border-[var(--accent-15)]">
            <p className="text-[var(--text-primary)] font-medium text-sm truncate">
              {profile?.first_name || profile?.last_name
                ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                : profile?.username || profile?.email || 'User'}
            </p>
            {profile?.location && (
              <p className="text-[var(--text-muted)] text-xs mt-1">{profile.location}</p>
            )}
            {profile?.position && (
              <p className="text-[var(--text-muted)] text-xs">{profile.position}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 text-[var(--text-secondary)] text-sm px-3 py-2 rounded-md hover:bg-[var(--accent-10)] hover:text-[var(--text-primary)] transition-all"
            >
              <LayoutDashboard size={16} />
              User Dashboard
            </Link>
            <button
              onClick={async () => {
                setIsOpen(false);
                resetAll();
                await signOut();
              }}
              className="flex items-center gap-2 text-[var(--text-secondary)] text-sm px-3 py-2 rounded-md hover:bg-[var(--accent-10)] hover:text-[var(--text-primary)] transition-all cursor-pointer w-full text-left"
            >
              <LogOut size={16} />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
