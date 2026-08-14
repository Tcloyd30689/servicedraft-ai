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
  /** Hides the UPDATE button (which opens profile edit + password change). Used for the read-only qa_tester role (Sprint G-4b). */
  hideUpdate?: boolean;
}

export default function ProfileSection({ profile, onUpdate, hideUpdate }: ProfileSectionProps) {
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
            <p className="text-[var(--text-muted)] [html[data-accent=black]_&]:text-white">
              <span className="text-[var(--text-secondary)] [html[data-accent=black]_&]:text-white">Email:</span> <span className="font-data">{profile.email}</span>
            </p>
            <p className="text-[var(--text-muted)] [html[data-accent=black]_&]:text-white">
              <span className="text-[var(--text-secondary)] [html[data-accent=black]_&]:text-white">ID:</span>{' '}
              <span className="font-data text-xs">{profile.id.slice(0, 8)}...</span>
            </p>
            {profile.location && (
              <p className="text-[var(--text-muted)] [html[data-accent=black]_&]:text-white">
                <span className="text-[var(--text-secondary)] [html[data-accent=black]_&]:text-white">Location:</span> <span className="font-data">{profile.location}</span>
              </p>
            )}
            {profile.position && (
              <p className="text-[var(--text-muted)] [html[data-accent=black]_&]:text-white">
                <span className="text-[var(--text-secondary)] [html[data-accent=black]_&]:text-white">Position:</span> <span className="font-data">{profile.position}</span>
              </p>
            )}
          </div>
        </div>

        {/* Update Button — hidden for the read-only qa_tester role (it opens password change) */}
        {!hideUpdate && (
          <Button variant="secondary" size="medium" onClick={onUpdate}>
            UPDATE
          </Button>
        )}
      </div>
    </LiquidCard>
  );
}
