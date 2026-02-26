'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNarrativeStore } from '@/stores/narrativeStore';
import PositionIcon from '@/components/ui/PositionIcon';

/** Format user name as "T.Cloyd" (first initial + period + last name) */
function formatDisplayName(profile: { first_name?: string | null; last_name?: string | null; username?: string | null; email?: string | null } | null): string {
  if (profile?.first_name && profile?.last_name) {
    return `${profile.first_name.charAt(0)}.${profile.last_name}`;
  }
  if (profile?.last_name) return profile.last_name;
  if (profile?.first_name) return profile.first_name;
  if (profile?.username) return profile.username;
  if (profile?.email) {
    const prefix = profile.email.split('@')[0];
    return `${prefix.charAt(0).toUpperCase()}.${prefix.slice(1)}`;
  }
  return 'User';
}

export default function UserPopup() {
  const { profile, signOut } = useAuth();
  const { resetAll } = useNarrativeStore();
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  const displayName = useMemo(() => formatDisplayName(profile), [profile]);

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
      {/* Combined user button: position icon + T.Cloyd name */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 cursor-pointer rounded-lg px-2.5 py-1.5 transition-all duration-200 hover:bg-[var(--accent-10)] border border-[var(--accent-30)] hover:border-[var(--accent-50)]"
        aria-label="User menu"
      >
        <PositionIcon position={profile?.position ?? null} size="small" className="!w-6 !h-6 !border-0" />
        <span className="hidden sm:inline text-sm font-medium text-[var(--accent-bright)]">
          {displayName}
        </span>
        <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popup dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-64 bg-[var(--bg-elevated)] border border-[var(--accent-40)] rounded-xl backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.6),var(--shadow-glow-sm)] p-4">
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
              Dashboard
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
