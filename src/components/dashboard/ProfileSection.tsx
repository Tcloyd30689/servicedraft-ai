'use client';

import LiquidCard from '@/components/ui/LiquidCard';
import Button from '@/components/ui/Button';
import PositionIcon from '@/components/ui/PositionIcon';

interface ProfileData {
  id: string;
  email: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  location: string | null;
  position: string | null;
}

interface ProfileSectionProps {
  profile: ProfileData;
  onUpdate: () => void;
}

export default function ProfileSection({ profile, onUpdate }: ProfileSectionProps) {
  const fullName =
    profile.first_name || profile.last_name
      ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
      : null;

  return (
    <LiquidCard size="standard">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Position Icon */}
        <PositionIcon position={profile.position} size="large" />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] truncate">
            {fullName || profile.username || profile.email}
          </h2>

          <div className="mt-2 space-y-1 text-sm">
            <p className="text-[var(--text-muted)]">
              <span className="text-[var(--text-secondary)]">Email:</span> {profile.email}
            </p>
            <p className="text-[var(--text-muted)]">
              <span className="text-[var(--text-secondary)]">ID:</span>{' '}
              <span className="font-mono text-xs">{profile.id.slice(0, 8)}...</span>
            </p>
            {profile.location && (
              <p className="text-[var(--text-muted)]">
                <span className="text-[var(--text-secondary)]">Location:</span> {profile.location}
              </p>
            )}
            {profile.position && (
              <p className="text-[var(--text-muted)]">
                <span className="text-[var(--text-secondary)]">Position:</span> {profile.position}
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
