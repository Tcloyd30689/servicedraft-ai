'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNarrativeStore } from '@/stores/narrativeStore';

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
        className="w-9 h-9 rounded-full border-2 border-[#a855f7] bg-[#1a0a2e] flex items-center justify-center cursor-pointer transition-all duration-200 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]"
        aria-label="User menu"
      >
        {profile?.profile_picture_url ? (
          <img
            src={profile.profile_picture_url}
            alt="Profile"
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <User size={18} className="text-[#a855f7]" />
        )}
      </button>

      {/* Popup dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-64 bg-[rgba(197,173,229,0.05)] border border-[rgba(168,85,247,0.3)] rounded-xl backdrop-blur-md shadow-[0_0_30px_rgba(73,18,155,0.4)] p-4">
          <div className="mb-3 pb-3 border-b border-[rgba(168,85,247,0.15)]">
            <p className="text-white font-medium text-sm truncate">
              {profile?.username || profile?.email || 'User'}
            </p>
            {profile?.location && (
              <p className="text-[#9ca3af] text-xs mt-1">{profile.location}</p>
            )}
            {profile?.position && (
              <p className="text-[#9ca3af] text-xs">{profile.position}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 text-[#c4b5fd] text-sm px-3 py-2 rounded-md hover:bg-[rgba(168,85,247,0.1)] hover:text-white transition-all"
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
              className="flex items-center gap-2 text-[#c4b5fd] text-sm px-3 py-2 rounded-md hover:bg-[rgba(168,85,247,0.1)] hover:text-white transition-all cursor-pointer w-full text-left"
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
