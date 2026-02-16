'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentLocation: string;
  currentPosition: string;
  onSaved: () => void;
}

type Tab = 'profile' | 'password';

export default function EditProfileModal({
  isOpen,
  onClose,
  userId,
  currentLocation,
  currentPosition,
  onSaved,
}: EditProfileModalProps) {
  const [tab, setTab] = useState<Tab>('profile');
  const [location, setLocation] = useState(currentLocation);
  const [position, setPosition] = useState(currentPosition);
  const [saving, setSaving] = useState(false);

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('users')
        .update({ location, position })
        .eq('id', userId);

      if (error) throw error;
      toast.success('Profile updated');
      onSaved();
      onClose();
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password changed successfully');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch {
      toast.error('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile">
      {/* Tab Switcher */}
      <div className="flex gap-1 mb-6 bg-[#0f0520] rounded-lg p-1 border border-[#6b21a8]">
        <button
          onClick={() => setTab('profile')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${
            tab === 'profile'
              ? 'bg-[#a855f7] text-white'
              : 'text-[#9ca3af] hover:text-white'
          }`}
        >
          Profile Info
        </button>
        <button
          onClick={() => setTab('password')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${
            tab === 'password'
              ? 'bg-[#a855f7] text-white'
              : 'text-[#9ca3af] hover:text-white'
          }`}
        >
          Change Password
        </button>
      </div>

      {tab === 'profile' && (
        <>
          <Input
            label="Location"
            placeholder="e.g. Dallas, TX"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <Input
            label="Position"
            placeholder="e.g. Service Advisor"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />
          <Button
            size="fullWidth"
            onClick={handleSaveProfile}
            disabled={saving}
          >
            {saving ? 'SAVING...' : 'SAVE CHANGES'}
          </Button>
        </>
      )}

      {tab === 'password' && (
        <>
          <Input
            label="New Password"
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button
            size="fullWidth"
            onClick={handleChangePassword}
            disabled={saving}
          >
            {saving ? 'CHANGING...' : 'CHANGE PASSWORD'}
          </Button>
        </>
      )}
    </Modal>
  );
}
