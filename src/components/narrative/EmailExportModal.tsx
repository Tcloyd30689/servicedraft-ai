'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Mail, Plus, X, Loader2, BookUser, Check } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import type { NarrativeData } from '@/stores/narrativeStore';

interface EmailExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  narrative: NarrativeData;
  displayFormat: 'block' | 'ccc';
  vehicleInfo: { year: string; make: string; model: string; roNumber: string };
  senderName: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STORAGE_KEY = 'sd-last-export-email';
const MAX_RECIPIENTS = 10;

export default function EmailExportModal({
  isOpen,
  onClose,
  narrative,
  displayFormat,
  vehicleInfo,
  senderName,
}: EmailExportModalProps) {
  const [emails, setEmails] = useState<string[]>(['']);
  const [isSending, setIsSending] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Contacts picker state
  const [showContactsPicker, setShowContactsPicker] = useState(false);
  const [contactsList, setContactsList] = useState<{ id: string; contact_name: string; contact_email: string }[]>([]);
  const [selectedContactEmails, setSelectedContactEmails] = useState<Set<string>>(new Set());
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  // Inline new-contact form state (inside picker)
  const [showNewContactForm, setShowNewContactForm] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactNotes, setNewContactNotes] = useState('');
  const [newContactEmailError, setNewContactEmailError] = useState('');
  const [isSavingNewContact, setIsSavingNewContact] = useState(false);

  // Load last-used email from localStorage on mount
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setEmails([saved]);
      } else {
        setEmails(['']);
      }
      setErrors([]);
    }
  }, [isOpen]);

  async function openContactsPicker() {
    setShowContactsPicker(true);
    setSelectedContactEmails(new Set());
    setShowNewContactForm(false);
    setNewContactName('');
    setNewContactEmail('');
    setNewContactNotes('');
    setNewContactEmailError('');
    setIsLoadingContacts(true);
    try {
      const res = await fetch('/api/contacts');
      if (!res.ok) throw new Error('Failed to fetch contacts');
      const data = await res.json();
      setContactsList(data.contacts || []);
    } catch {
      toast.error('Failed to load contacts');
      setShowContactsPicker(false);
    } finally {
      setIsLoadingContacts(false);
    }
  }

  async function handleSaveNewContact() {
    if (!newContactName.trim()) {
      toast.error('Contact name is required');
      return;
    }
    if (!newContactEmail.trim()) {
      setNewContactEmailError('Email is required');
      return;
    }
    if (!EMAIL_REGEX.test(newContactEmail.trim())) {
      setNewContactEmailError('Invalid email address');
      return;
    }

    setIsSavingNewContact(true);
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_name: newContactName.trim(),
          contact_email: newContactEmail.trim(),
          notes: newContactNotes.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save contact');
      }

      const { contact } = await res.json();
      // Add to local list so it appears immediately
      setContactsList((prev) => [...prev, contact].sort((a, b) => a.contact_name.localeCompare(b.contact_name)));
      toast.success('Contact saved');
      setShowNewContactForm(false);
      setNewContactName('');
      setNewContactEmail('');
      setNewContactNotes('');
      setNewContactEmailError('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save contact');
    } finally {
      setIsSavingNewContact(false);
    }
  }

  function toggleContactSelection(email: string) {
    setSelectedContactEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
  }

  function handleAddSelectedContacts() {
    const currentEmails = emails.map((e) => e.trim().toLowerCase()).filter(Boolean);
    const toAdd: string[] = [];

    for (const email of selectedContactEmails) {
      if (currentEmails.includes(email.toLowerCase())) continue; // skip duplicates
      toAdd.push(email);
    }

    const totalAfterAdd = currentEmails.length + toAdd.length;
    // Account for empty first slot
    const hasEmptyFirst = emails.length === 1 && !emails[0].trim();

    if (totalAfterAdd > MAX_RECIPIENTS && !hasEmptyFirst) {
      toast.error(`Maximum ${MAX_RECIPIENTS} recipients allowed`);
      // Add as many as we can
      const slotsAvailable = MAX_RECIPIENTS - currentEmails.length;
      const trimmedToAdd = toAdd.slice(0, slotsAvailable);
      if (trimmedToAdd.length > 0) {
        setEmails([...emails.filter((e) => e.trim()), ...trimmedToAdd]);
      }
    } else if (hasEmptyFirst) {
      // Replace the empty first slot
      const capped = toAdd.slice(0, MAX_RECIPIENTS);
      setEmails(capped.length > 0 ? capped : ['']);
    } else {
      setEmails([...emails.filter((e) => e.trim()), ...toAdd]);
    }

    setShowContactsPicker(false);
    if (toAdd.length > 0) {
      toast.success(`Added ${Math.min(toAdd.length, MAX_RECIPIENTS)} contact${toAdd.length === 1 ? '' : 's'}`);
    } else if (selectedContactEmails.size > 0) {
      toast.error('Selected contacts are already in the recipient list');
    }
  }

  const subjectPreview = buildSubjectPreview(vehicleInfo);

  function buildSubjectPreview(info: EmailExportModalProps['vehicleInfo']): string {
    const parts: string[] = [];
    if (info.year) parts.push(info.year);
    if (info.make) parts.push(info.make);
    if (info.model) parts.push(info.model);
    const vehicle = parts.join(' ');
    const ro = info.roNumber ? `R.O. #${info.roNumber}` : '';
    const segments = [vehicle, ro].filter(Boolean);
    return segments.length > 0
      ? `Repair Narrative — ${segments.join(' — ')}`
      : 'Repair Narrative — ServiceDraft.AI';
  }

  function handleEmailChange(index: number, value: string) {
    const updated = [...emails];
    updated[index] = value;
    setEmails(updated);

    // Clear error for this field on change
    if (errors[index]) {
      const updatedErrors = [...errors];
      updatedErrors[index] = '';
      setErrors(updatedErrors);
    }
  }

  function handleAddRecipient() {
    if (emails.length < MAX_RECIPIENTS) {
      setEmails([...emails, '']);
      setErrors([...errors, '']);
    }
  }

  function handleRemoveRecipient(index: number) {
    if (emails.length > 1) {
      setEmails(emails.filter((_, i) => i !== index));
      setErrors(errors.filter((_, i) => i !== index));
    }
  }

  function validateEmails(): boolean {
    const newErrors = emails.map((email) => {
      const trimmed = email.trim();
      if (!trimmed) return 'Email address is required';
      if (!EMAIL_REGEX.test(trimmed)) return 'Invalid email address';
      return '';
    });
    setErrors(newErrors);
    return newErrors.every((e) => e === '');
  }

  async function handleSend() {
    if (!validateEmails()) return;

    setIsSending(true);
    try {
      const validEmails = emails.map((e) => e.trim()).filter(Boolean);

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: validEmails,
          narrative,
          displayFormat,
          vehicleInfo,
          senderName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      // Save first email to localStorage for next time
      localStorage.setItem(STORAGE_KEY, validEmails[0]);

      const recipientList = validEmails.join(', ');
      toast.success(`Narrative sent to ${recipientList}`);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send email';
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Email Narrative">
      <div className="space-y-4">
        {/* Email inputs */}
        <div className="space-y-3">
          {emails.map((email, index) => (
            <div key={index}>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => handleEmailChange(index, e.target.value)}
                      placeholder={index === 0 ? 'recipient@example.com' : 'Additional recipient'}
                      disabled={isSending}
                      className="w-full pl-10 pr-3 py-2.5 rounded-lg border text-sm font-data
                        bg-[var(--bg-input)] border-[var(--accent-border)] text-[var(--text-primary)]
                        placeholder:text-[var(--text-muted)]
                        focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]
                        disabled:opacity-50"
                    />
                  </div>
                  {errors[index] && (
                    <p className="text-red-400 text-xs mt-1">{errors[index]}</p>
                  )}
                </div>
                {emails.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRecipient(index)}
                    disabled={isSending}
                    className="p-1.5 rounded text-[var(--text-muted)] hover:text-red-400
                      hover:bg-red-400/10 transition-colors disabled:opacity-50"
                    aria-label="Remove recipient"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add recipient / Select from contacts row */}
        <div className="flex items-center gap-3">
          {emails.length < MAX_RECIPIENTS && (
            <button
              type="button"
              onClick={handleAddRecipient}
              disabled={isSending}
              className="flex items-center gap-1.5 text-xs text-[var(--accent-bright)]
                hover:text-[var(--accent-hover)] transition-colors disabled:opacity-50"
            >
              <Plus size={14} />
              ADD ANOTHER RECIPIENT
            </button>
          )}
          <button
            type="button"
            onClick={openContactsPicker}
            disabled={isSending}
            className="flex items-center gap-1.5 text-xs text-[var(--accent-bright)]
              hover:text-[var(--accent-hover)] transition-colors disabled:opacity-50 ml-auto"
          >
            <BookUser size={14} />
            SELECT FROM CONTACTS
          </button>
        </div>

        {/* Contacts Picker Panel */}
        {showContactsPicker && (
          <div className="rounded-lg border border-[var(--accent-border)] bg-[var(--bg-input)] p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                Select Contacts
              </span>
              <button
                type="button"
                onClick={() => setShowContactsPicker(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-0.5"
              >
                <X size={14} />
              </button>
            </div>

            {/* Inline New Contact Form */}
            {showNewContactForm ? (
              <div className="rounded-lg border border-[var(--accent-vivid)] bg-[var(--bg-card)] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--text-primary)]">New Contact</span>
                  <button
                    type="button"
                    onClick={() => { setShowNewContactForm(false); setNewContactEmailError(''); }}
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-0.5"
                  >
                    <X size={12} />
                  </button>
                </div>
                <input
                  type="text"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="Name *"
                  className="w-full px-3 py-1.5 text-xs font-data bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-hover)] transition-colors"
                />
                <div>
                  <input
                    type="email"
                    value={newContactEmail}
                    onChange={(e) => { setNewContactEmail(e.target.value); setNewContactEmailError(''); }}
                    placeholder="Email *"
                    className="w-full px-3 py-1.5 text-xs font-data bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-hover)] transition-colors"
                  />
                  {newContactEmailError && (
                    <p className="text-red-400 text-[10px] mt-0.5">{newContactEmailError}</p>
                  )}
                </div>
                <input
                  type="text"
                  value={newContactNotes}
                  onChange={(e) => setNewContactNotes(e.target.value)}
                  placeholder="Notes (optional)"
                  className="w-full px-3 py-1.5 text-xs font-data bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-hover)] transition-colors"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowNewContactForm(false); setNewContactEmailError(''); }}
                    className="flex-1 px-2 py-1 text-[10px] font-semibold rounded-md transition-colors cursor-pointer"
                    style={{ color: 'var(--text-secondary)', border: '1px solid var(--accent-border)' }}
                  >
                    CANCEL
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNewContact}
                    disabled={!newContactName.trim() || !newContactEmail.trim() || isSavingNewContact}
                    className="flex-1 px-2 py-1 text-[10px] font-semibold rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                    style={{ backgroundColor: 'var(--accent-primary)', color: 'var(--btn-text-on-accent)' }}
                  >
                    {isSavingNewContact ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
                    {isSavingNewContact ? 'SAVING...' : 'SAVE CONTACT'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowNewContactForm(true)}
                className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--accent-bright)] hover:text-[var(--accent-hover)] transition-colors cursor-pointer"
              >
                <Plus size={12} />
                NEW CONTACT
              </button>
            )}

            {isLoadingContacts ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={18} className="animate-spin text-[var(--accent-bright)]" />
                <span className="ml-2 text-xs text-[var(--text-muted)]">Loading contacts...</span>
              </div>
            ) : contactsList.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-4">
                No saved contacts yet. Click &ldquo;New Contact&rdquo; above to add one.
              </p>
            ) : (
              <>
                <div className="max-h-[200px] overflow-y-auto space-y-1">
                  {contactsList.map((contact) => {
                    const isSelected = selectedContactEmails.has(contact.contact_email);
                    const alreadyAdded = emails.map((e) => e.trim().toLowerCase()).includes(contact.contact_email.toLowerCase());
                    return (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => !alreadyAdded && toggleContactSelection(contact.contact_email)}
                        disabled={alreadyAdded}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          alreadyAdded
                            ? 'opacity-40 cursor-not-allowed'
                            : isSelected
                              ? 'bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]'
                              : 'hover:bg-[var(--accent-8)] cursor-pointer'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)]'
                            : 'border-[var(--accent-border)]'
                        }`}>
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-data text-[var(--text-primary)] block truncate">
                            {contact.contact_name}
                          </span>
                          <span className="text-xs text-[var(--text-muted)] block truncate">
                            {contact.contact_email}
                            {alreadyAdded && ' (already added)'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowContactsPicker(false)}
                    className="flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    style={{
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--accent-border)',
                    }}
                  >
                    CANCEL
                  </button>
                  <button
                    type="button"
                    onClick={handleAddSelectedContacts}
                    disabled={selectedContactEmails.size === 0}
                    className="flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: 'var(--accent-primary)',
                      color: 'var(--btn-text-on-accent)',
                    }}
                  >
                    ADD SELECTED ({selectedContactEmails.size})
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Subject preview */}
        <div className="bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1">
            SUBJECT LINE
          </p>
          <p className="text-sm font-data text-[var(--text-secondary)] break-words">{subjectPreview}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button
            variant="primary"
            size="fullWidth"
            onClick={handleSend}
            disabled={isSending}
            className="flex items-center justify-center gap-2"
          >
            {isSending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                SENDING...
              </>
            ) : (
              <>
                <Mail size={16} />
                SEND EMAIL
              </>
            )}
          </Button>
          <Button
            variant="secondary"
            size="medium"
            onClick={onClose}
            disabled={isSending}
          >
            CANCEL
          </Button>
        </div>
      </div>
    </Modal>
  );
}
