'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Palette, Wrench, Trash2, AlertTriangle, Shield, Users, BookUser } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import LiquidCard from '@/components/ui/LiquidCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProfileSection from '@/components/dashboard/ProfileSection';
import EditProfileModal from '@/components/dashboard/EditProfileModal';
import NarrativeHistory from '@/components/dashboard/NarrativeHistory';
import AppearanceModal from '@/components/dashboard/AppearanceModal';
import SavedRepairsModal from '@/components/dashboard/SavedRepairsModal';
import ContactsModal from '@/components/dashboard/ContactsModal';

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading, refreshProfile } = useAuth();
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);
  const [showSavedRepairs, setShowSavedRepairs] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <LiquidCard size="spacious">
          <div className="py-12 flex flex-col items-center gap-4">
            <p className="text-[var(--text-muted)] text-sm text-center">
              Unable to load your profile. This can happen if your session timed out.
            </p>
            <div className="flex gap-3">
              <Button
                variant="primary"
                size="small"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={() => {
                  document.cookie.split(';').forEach((c) => {
                    const name = c.trim().split('=')[0];
                    if (name.startsWith('sb-')) {
                      document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                    }
                  });
                  localStorage.removeItem('sd-login-timestamp');
                  window.location.href = '/login';
                }}
              >
                Re-Login
              </Button>
            </div>
          </div>
        </LiquidCard>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
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
            {profile.role === 'owner' && (
              <motion.button
                onClick={() => router.push('/admin')}
                whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(245,158,11,0.4), 0 0 30px rgba(245,158,11,0.2)' }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid #f59e0b',
                  color: '#f59e0b',
                }}
              >
                <Shield size={16} />
                OWNER DASHBOARD
              </motion.button>
            )}
            {profile.role === 'owner' && (
              <motion.button
                onClick={() => router.push('/team-dashboard')}
                whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(59,130,246,0.4), 0 0 30px rgba(59,130,246,0.2)' }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid #3b82f6',
                  color: '#3b82f6',
                }}
              >
                <Users size={16} />
                TEAM DASHBOARD
              </motion.button>
            )}
          </div>
        </div>

        {/* Profile Section */}
        <ProfileSection
          profile={profile}
          onUpdate={() => setEditProfileOpen(true)}
        />

        {/* Appearance & Saved Repairs Buttons */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="medium"
            onClick={() => setShowAppearance(true)}
            className="flex items-center gap-2"
          >
            <Palette size={16} />
            APP APPEARANCE
          </Button>
          <Button
            variant="secondary"
            size="medium"
            onClick={() => setShowSavedRepairs(true)}
            className="flex items-center gap-2"
          >
            <Wrench size={16} />
            MY SAVED REPAIRS
          </Button>
          <Button
            variant="secondary"
            size="medium"
            onClick={() => setShowContacts(true)}
            className="flex items-center gap-2"
          >
            <BookUser size={16} />
            EMAIL CONTACT LIST
          </Button>
        </div>

        {/* Narrative History */}
        <NarrativeHistory userId={user.id} senderName={[profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.username || ''} />

        {/* Delete Account */}
        <div className="flex justify-center pt-4 pb-2">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 text-[var(--text-muted)] text-sm hover:text-red-400 transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
            Delete Account
          </button>
        </div>
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

      {/* Appearance Modal */}
      <AppearanceModal
        isOpen={showAppearance}
        onClose={() => setShowAppearance(false)}
      />

      {/* Saved Repairs Modal */}
      <SavedRepairsModal
        isOpen={showSavedRepairs}
        onClose={() => setShowSavedRepairs(false)}
      />

      {/* Contacts Modal */}
      <ContactsModal
        isOpen={showContacts}
        onClose={() => setShowContacts(false)}
      />

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => !deleting && setShowDeleteConfirm(false)}
        title="Delete Account"
        width="max-w-[480px]"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <AlertTriangle size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-300 leading-relaxed">
              <p className="font-semibold mb-1">This action is permanent and cannot be undone.</p>
              <p>Deleting your account will permanently remove:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-red-300/80">
                <li>Your profile and account credentials</li>
                <li>All saved narratives and repair history</li>
                <li>All saved repair templates</li>
                <li>Your subscription and access</li>
              </ul>
            </div>
          </div>

          <p className="text-[var(--text-secondary)] text-sm">
            Are you sure you want to permanently delete your account?
          </p>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              size="fullWidth"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
            >
              CANCEL
            </Button>
            <button
              onClick={async () => {
                setDeleting(true);
                try {
                  const res = await fetch('/api/delete-account', { method: 'POST' });
                  const data = await res.json();
                  if (!res.ok) {
                    toast.error(data.error || 'Failed to delete account');
                    setDeleting(false);
                    return;
                  }
                  // Clear local storage and redirect
                  localStorage.removeItem('sd-login-timestamp');
                  localStorage.removeItem('sd-accent-color');
                  localStorage.removeItem('sd-color-mode');
                  localStorage.removeItem('sd-bg-animation');
                  toast.success('Account deleted successfully');
                  window.location.href = '/';
                } catch {
                  toast.error('An error occurred. Please try again.');
                  setDeleting(false);
                }
              }}
              disabled={deleting}
              className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors cursor-pointer
                bg-red-600 hover:bg-red-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? 'DELETING...' : 'DELETE MY ACCOUNT'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
