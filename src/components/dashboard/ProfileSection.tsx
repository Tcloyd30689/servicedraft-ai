'use client';

import { User } from 'lucide-react';
import LiquidCard from '@/components/ui/LiquidCard';
import Button from '@/components/ui/Button';

interface ProfileData {
  id: string;
  email: string;
  username: string | null;
  location: string | null;
  position: string | null;
  profile_picture_url: string | null;
}

interface ProfileSectionProps {
  profile: ProfileData;
  onUpdate: () => void;
}

export default function ProfileSection({ profile, onUpdate }: ProfileSectionProps) {
  return (
    <LiquidCard size="standard">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-[#0f0520] border-2 border-[#6b21a8] flex items-center justify-center shrink-0 overflow-hidden">
          {profile.profile_picture_url ? (
            <img
              src={profile.profile_picture_url}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={36} className="text-[#a855f7]" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-white truncate">
            {profile.username || profile.email}
          </h2>

          <div className="mt-2 space-y-1 text-sm">
            <p className="text-[#9ca3af]">
              <span className="text-[#c4b5fd]">Email:</span> {profile.email}
            </p>
            <p className="text-[#9ca3af]">
              <span className="text-[#c4b5fd]">ID:</span>{' '}
              <span className="font-mono text-xs">{profile.id.slice(0, 8)}...</span>
            </p>
            {profile.location && (
              <p className="text-[#9ca3af]">
                <span className="text-[#c4b5fd]">Location:</span> {profile.location}
              </p>
            )}
            {profile.position && (
              <p className="text-[#9ca3af]">
                <span className="text-[#c4b5fd]">Position:</span> {profile.position}
              </p>
            )}
          </div>
        </div>

        {/* Update Button */}
        <Button variant="secondary" size="medium" onClick={onUpdate}>
          UPDATE
        </Button>
      </div>
    </LiquidCard>
  );
}
