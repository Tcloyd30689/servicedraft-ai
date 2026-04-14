'use client';

import { useState, useEffect, useCallback } from 'react';
import { BookUser, Plus, Pencil, Trash2, Save, X, Loader2, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface Contact {
  id: string;
  contact_name: string;
  contact_email: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactsModal({ isOpen, onClose }: ContactsModalProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // New contact form state
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newEmailError, setNewEmailError] = useState('');
  const [isSavingNew, setIsSavingNew] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editEmailError, setEditEmailError] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/contacts');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch {
      toast.error('Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchContacts();
      setShowNewForm(false);
      setEditingId(null);
      setDeleteConfirmId(null);
    }
  }, [isOpen, fetchContacts]);

  // --- New Contact ---
  const handleCreateNew = async () => {
    if (!newName.trim()) {
      toast.error('Contact name is required');
      return;
    }
    if (!newEmail.trim()) {
      setNewEmailError('Email is required');
      return;
    }
    if (!EMAIL_REGEX.test(newEmail.trim())) {
      setNewEmailError('Invalid email address');
      return;
    }

    setIsSavingNew(true);
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_name: newName.trim(),
          contact_email: newEmail.trim(),
          notes: newNotes.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create contact');
      }

      toast.success('Contact saved');
      setShowNewForm(false);
      setNewName('');
      setNewEmail('');
      setNewNotes('');
      setNewEmailError('');
      fetchContacts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create contact');
    } finally {
      setIsSavingNew(false);
    }
  };

  // --- Edit Contact ---
  const startEdit = (contact: Contact) => {
    setEditingId(contact.id);
    setEditName(contact.contact_name);
    setEditEmail(contact.contact_email);
    setEditNotes(contact.notes || '');
    setEditEmailError('');
    setDeleteConfirmId(null);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) {
      toast.error('Contact name is required');
      return;
    }
    if (!editEmail.trim()) {
      setEditEmailError('Email is required');
      return;
    }
    if (!EMAIL_REGEX.test(editEmail.trim())) {
      setEditEmailError('Invalid email address');
      return;
    }

    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_name: editName.trim(),
          contact_email: editEmail.trim(),
          notes: editNotes.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update contact');
      }

      toast.success('Contact updated');
      setEditingId(null);
      fetchContacts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update contact');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // --- Delete Contact ---
  const handleDelete = async (id: string) => {
    setIsDeletingId(id);
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setContacts((prev) => prev.filter((c) => c.id !== id));
      setDeleteConfirmId(null);
      toast.success('Contact deleted');
    } catch {
      toast.error('Failed to delete contact');
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Email Contact List">
      <div className="space-y-4">
        {/* New Contact Button */}
        {!showNewForm && (
          <button
            onClick={() => { setShowNewForm(true); setEditingId(null); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold w-full justify-center transition-all duration-200 cursor-pointer"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--btn-text-on-accent)',
              border: '1px solid var(--accent-primary)',
            }}
          >
            <Plus size={16} />
            ADD NEW CONTACT
          </button>
        )}

        {/* New Contact Form */}
        <AnimatePresence>
          {showNewForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div
                className="rounded-xl p-4 space-y-3 border"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--accent-vivid)',
                }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">New Contact</h3>
                  <button
                    onClick={() => { setShowNewForm(false); setNewEmailError(''); }}
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer p-1"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Name *</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. John Smith"
                    className="w-full px-3 py-2 text-sm font-data bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-hover)] transition-colors"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Email *</label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    />
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => { setNewEmail(e.target.value); setNewEmailError(''); }}
                      placeholder="email@example.com"
                      className="w-full pl-10 pr-3 py-2 text-sm font-data bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-hover)] transition-colors"
                    />
                  </div>
                  {newEmailError && (
                    <p className="text-red-400 text-xs mt-1">{newEmailError}</p>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Notes</label>
                  <textarea
                    spellCheck={true}
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    rows={2}
                    placeholder="Optional notes..."
                    className="w-full px-3 py-2 text-sm font-data resize-none bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-hover)] transition-colors"
                  />
                </div>

                {/* Save / Cancel */}
                <div className="flex gap-2 pt-1">
                  <Button variant="secondary" size="medium" onClick={() => { setShowNewForm(false); setNewEmailError(''); }} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    size="medium"
                    disabled={!newName.trim() || !newEmail.trim() || isSavingNew}
                    onClick={handleCreateNew}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    {isSavingNew ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {isSavingNew ? 'Saving...' : 'Save Contact'}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contacts List */}
        <div className="max-h-[55vh] overflow-y-auto space-y-3 pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[var(--accent-bright)]" />
              <span className="ml-3 text-[var(--text-muted)] text-sm">Loading contacts...</span>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-10">
              <BookUser size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
              <p className="text-sm text-[var(--text-muted)]">
                No saved contacts yet &mdash; add your first contact to streamline email exports.
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {contacts.map((contact) => {
                const isEditing = editingId === contact.id;
                const isDeleting = isDeletingId === contact.id;

                return (
                  <motion.div
                    key={contact.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-xl border backdrop-blur-sm"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: isEditing ? 'var(--accent-vivid)' : 'var(--card-border)',
                    }}
                  >
                    <div className="p-4">
                      {isEditing ? (
                        /* Edit Form */
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Name</label>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full px-3 py-2 text-sm font-data bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-hover)] transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Email</label>
                            <input
                              type="email"
                              value={editEmail}
                              onChange={(e) => { setEditEmail(e.target.value); setEditEmailError(''); }}
                              className="w-full px-3 py-2 text-sm font-data bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-hover)] transition-colors"
                            />
                            {editEmailError && (
                              <p className="text-red-400 text-xs mt-1">{editEmailError}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Notes</label>
                            <textarea
                              spellCheck={true}
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 text-sm font-data resize-none bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-hover)] transition-colors"
                            />
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Button variant="secondary" size="small" onClick={() => { setEditingId(null); setEditEmailError(''); }}>
                              Cancel
                            </Button>
                            <Button
                              size="small"
                              disabled={!editName.trim() || !editEmail.trim() || isSavingEdit}
                              onClick={() => handleSaveEdit(contact.id)}
                              className="flex items-center gap-1.5"
                            >
                              {isSavingEdit ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                              {isSavingEdit ? 'Saving...' : 'Save'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* Read-only view */
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-sm text-[var(--text-primary)] truncate">
                              {contact.contact_name}
                            </h3>
                            <p className="text-xs text-[var(--accent-bright)] font-data mt-0.5 truncate">
                              {contact.contact_email}
                            </p>
                            {contact.notes && (
                              <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-1">
                                {contact.notes}
                              </p>
                            )}
                          </div>

                          {/* Action Buttons */}
                          {deleteConfirmId === contact.id ? (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex items-center gap-2 shrink-0 ml-3"
                            >
                              <span className="text-xs text-red-400">Delete?</span>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-1 text-xs rounded-md cursor-pointer transition-colors"
                                style={{ color: 'var(--text-secondary)', border: '1px solid var(--accent-border)' }}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleDelete(contact.id)}
                                disabled={isDeleting}
                                className="px-2 py-1 text-xs rounded-md bg-red-600 text-white cursor-pointer hover:bg-red-500 transition-colors disabled:opacity-50"
                              >
                                {isDeleting ? 'Deleting...' : 'Confirm'}
                              </button>
                            </motion.div>
                          ) : (
                            <div className="flex items-center gap-1.5 shrink-0 ml-3">
                              <button
                                onClick={() => startEdit(contact)}
                                className="p-1.5 rounded-md cursor-pointer transition-all duration-200 hover:shadow-[0_0_8px_rgba(168,85,247,0.3)]"
                                style={{ color: 'var(--accent-vivid)', backgroundColor: 'var(--accent-8)' }}
                                title="Edit"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(contact.id)}
                                className="p-1.5 rounded-md cursor-pointer transition-all duration-200 hover:shadow-[0_0_8px_rgba(239,68,68,0.3)]"
                                style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)' }}
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </Modal>
  );
}
