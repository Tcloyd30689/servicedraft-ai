'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProfileSection from '@/components/dashboard/ProfileSection';
import EditProfileModal from '@/components/dashboard/EditProfileModal';
import NarrativeHistory from '@/components/dashboard/NarrativeHistory';
import PreferencesPanel from '@/components/dashboard/PreferencesPanel';

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="large" message="Loading dashboard..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!profile) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="text-center py-12 text-[var(--text-muted)]">
          <p>Unable to load profile data. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">User Dashboard</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPreferences(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--accent-vivid)',
                color: 'var(--accent-vivid)',
                fontWeight: 600,
              }}
            >
              <Settings size={16} />
              Preferences
            </button>
            <Button
              variant="secondary"
              size="medium"
              onClick={() => router.push('/main-menu')}
            >
              MAIN MENU
            </Button>
          </div>
        </div>

        {/* Profile Section */}
        <ProfileSection
          profile={profile}
          onUpdate={() => setEditProfileOpen(true)}
        />

        {/* Narrative History */}
        <NarrativeHistory userId={user.id} senderName={[profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.username || ''} />
      </motion.div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        userId={user.id}
        currentFirstName={profile.first_name || ''}
        currentLastName={profile.last_name || ''}
        currentLocation={profile.location || ''}
        currentPosition={profile.position || ''}
        onSaved={refreshProfile}
      />

      {/* Preferences Panel */}
      <PreferencesPanel
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
      />
    </div>
  );
}
