'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { POSITION_OPTIONS } from '@/constants/positions';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentFirstName: string;
  currentLastName: string;
  currentLocation: string;
  currentPosition: string;
  onSaved: () => void;
}

type Tab = 'profile' | 'password';

export default function EditProfileModal({
  isOpen,
  onClose,
  userId,
  currentFirstName,
  currentLastName,
  currentLocation,
  currentPosition,
  onSaved,
}: EditProfileModalProps) {
  const [tab, setTab] = useState<Tab>('profile');
  const [firstName, setFirstName] = useState(currentFirstName);
  const [lastName, setLastName] = useState(currentLastName);
  const [location, setLocation] = useState(currentLocation);
  const [position, setPosition] = useState(currentPosition);
  const [saving, setSaving] = useState(false);

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSaveProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }
    if (!position) {
      toast.error('Please select a position');
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('users')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          location,
          position,
        })
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
      <div className="flex gap-1 mb-6 bg-[var(--bg-input)] rounded-lg p-1 border border-[var(--accent-border)]">
        <button
          onClick={() => setTab('profile')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${
            tab === 'profile'
              ? 'bg-[var(--accent-hover)] text-white'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          Profile Info
        </button>
        <button
          onClick={() => setTab('password')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${
            tab === 'password'
              ? 'bg-[var(--accent-hover)] text-white'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          Change Password
        </button>
      </div>

      {tab === 'profile' && (
        <>
          <Input
            label="First Name"
            placeholder="John"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <Input
            label="Last Name"
            placeholder="Doe"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
          <Input
            label="Location"
            placeholder="e.g. Dallas, TX"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <Select
            label="Position"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            options={[
              { value: '', label: 'Select your position...' },
              ...POSITION_OPTIONS.map((p) => ({ value: p.value, label: p.label })),
            ]}
            required
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
