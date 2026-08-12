'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Plus, X, Loader2, BookUser } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import ContactsModal from '@/components/dashboard/ContactsModal';
import type { NarrativeData } from '@/stores/narrativeStore';

interface EmailExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  narrative: NarrativeData;
  displayFormat: 'block' | 'ccc';
  vehicleInfo: { year: string; make: string; model: string; roNumber: string };
  senderName: string;
  senderShortName?: string;
  storyType?: 'diagnostic_only' | 'repair_complete' | null;
  narrativeStyle?: string | null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_RECIPIENTS = 10;

type AddResult = 'added' | 'invalid' | 'duplicate' | 'full';

/**
 * Pure recipient-add helper. Returns the outcome plus the resulting list so
 * callers can both react to the outcome and use the committed list synchronously
 * (handleSend needs the post-commit list before React has re-rendered).
 */
function tryAddRecipient(list: string[], rawEmail: string): { result: AddResult; list: string[] } {
  const email = rawEmail.trim();
  if (!EMAIL_REGEX.test(email)) return { result: 'invalid', list };
  if (list.some((r) => r.toLowerCase() === email.toLowerCase())) return { result: 'duplicate', list };
  if (list.length >= MAX_RECIPIENTS) return { result: 'full', list };
  return { result: 'added', list: [...list, email] };
}

export default function EmailExportModal({
  isOpen,
  onClose,
  narrative,
  displayFormat,
  vehicleInfo,
  senderName,
  senderShortName,
  storyType,
  narrativeStyle,
}: EmailExportModalProps) {
  const { year, make, model, roNumber } = vehicleInfo;

  // Recipients: the committed list + the single always-present manual input
  const [recipients, setRecipients] = useState<string[]>([]);
  const [manualEntry, setManualEntry] = useState('');
  const [manualError, setManualError] = useState('');

  const [subject, setSubject] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Saved contacts (always visible)
  const [contactsList, setContactsList] = useState<{ id: string; contact_name: string; contact_email: string }[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  // Inline new-contact form state (inside the Saved Contacts card)
  const [showNewContactForm, setShowNewContactForm] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactNotes, setNewContactNotes] = useState('');
  const [newContactEmailError, setNewContactEmailError] = useState('');
  const [isSavingNewContact, setIsSavingNewContact] = useState(false);

  // Full manage-contacts CRUD modal
  const [showContactsManager, setShowContactsManager] = useState(false);

  /**
   * Subject prefill: hyphen separators only, empty segments dropped cleanly.
   * `Repair Narrative From {F. Lastname} - R.O.# {roNumber} - {YEAR MAKE MODEL}`
   */
  const buildDefaultSubject = useCallback((): string => {
    const sender = (senderShortName || '').trim();
    const ro = (roNumber || '').trim();
    const vehicle = [year, make, model].filter(Boolean).join(' ').trim();

    const segments: string[] = [sender ? `Repair Narrative From ${sender}` : 'Repair Narrative'];
    if (ro) segments.push(`R.O.# ${ro}`);
    if (vehicle) segments.push(vehicle);

    return segments.join(' - ');
  }, [senderShortName, roNumber, year, make, model]);

  const loadContacts = useCallback(async () => {
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
    } finally {
      setIsLoadingContacts(false);
    }
  }, []);

  // Reset recipients / subject + load contacts when the modal opens
  useEffect(() => {
    if (isOpen) {
      setRecipients([]);
      setManualEntry('');
      setManualError('');
      setSubject(buildDefaultSubject());
      void loadContacts();
    }
  }, [isOpen, buildDefaultSubject, loadContacts]);

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

  function commitManualEntry() {
    const email = manualEntry.trim();
    if (!email) {
      setManualError('Email address is required');
      return;
    }

    const { result, list } = tryAddRecipient(recipients, email);
    if (result === 'invalid') {
      setManualError('Invalid email address');
      return;
    }
    if (result === 'duplicate') {
      toast.error(`${email} is already in the list`);
      return;
    }
    if (result === 'full') {
      toast.error(`Maximum ${MAX_RECIPIENTS} recipients allowed`);
      return;
    }

    setRecipients(list);
    setManualEntry('');
    setManualError('');
  }

  function handleAddContactEmail(email: string) {
    const { result, list } = tryAddRecipient(recipients, email);
    if (result === 'invalid') {
      toast.error('Invalid email address');
      return;
    }
    if (result === 'duplicate') {
      toast.error(`${email} is already in the list`);
      return;
    }
    if (result === 'full') {
      toast.error(`Maximum ${MAX_RECIPIENTS} recipients allowed`);
      return;
    }
    setRecipients(list);
  }

  function handleRemoveRecipient(email: string) {
    setRecipients((prev) => prev.filter((r) => r !== email));
  }

  async function handleSend() {
    // Never silently drop a pending manual entry — commit it first.
    let finalRecipients = recipients;
    const pending = manualEntry.trim();

    if (pending) {
      const { result, list } = tryAddRecipient(recipients, pending);
      if (result === 'invalid') {
        setManualError('Invalid email address');
        return;
      }
      if (result === 'full') {
        toast.error(`Maximum ${MAX_RECIPIENTS} recipients allowed`);
        return;
      }
      // 'added' -> list grew; 'duplicate' -> already present, list unchanged
      finalRecipients = list;
      setRecipients(list);
      setManualEntry('');
      setManualError('');
    }

    if (finalRecipients.length === 0) {
      toast.error('Add at least one recipient');
      return;
    }

    const finalSubject = subject.trim() || buildDefaultSubject();

    setIsSending(true);
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: finalRecipients,
          narrative,
          displayFormat,
          vehicleInfo,
          senderName: senderShortName || senderName || '',
          subject: finalSubject,
          narrative_style: narrativeStyle ?? null,
          story_type: storyType ?? null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      const recipientList = finalRecipients.join(', ');
      toast.success(`Narrative sent to ${recipientList}`);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send email';
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  }

  // While the contacts manager is stacked on top, Escape / backdrop dismiss
  // belongs to the manager alone — swallow the close for this modal.
  const handleModalClose = useCallback(() => {
    if (showContactsManager) return;
    onClose();
  }, [showContactsManager, onClose]);

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleModalClose}>
        <div className={`space-y-4 ${showContactsManager ? 'pointer-events-none' : ''}`}>
          {/* Title */}
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] text-center -mt-2">
            Email Narrative
          </h2>

          {/* Added recipients — bare on the modal background, no card */}
          {recipients.length > 0 && (
            <div className="space-y-1">
              <AnimatePresence mode="popLayout">
                {recipients.map((email) => (
                  <motion.div
                    key={email}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-sm font-data text-[var(--text-primary)] truncate">
                      {email}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRecipient(email)}
                      disabled={isSending}
                      className="p-1.5 rounded text-[var(--text-muted)] hover:text-red-400
                        hover:bg-red-400/10 transition-colors disabled:opacity-50 shrink-0"
                      aria-label="Remove recipient"
                    >
                      <X size={16} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Single manual recipient input */}
          <div>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type="email"
                value={manualEntry}
                onChange={(e) => {
                  setManualEntry(e.target.value);
                  if (manualError) setManualError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitManualEntry();
                  }
                }}
                placeholder="recipient@example.com"
                disabled={isSending}
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border text-sm font-data
                  bg-[var(--bg-input)] border-[var(--accent-border)] text-[var(--text-primary)]
                  placeholder:text-[var(--text-muted)]
                  focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]
                  disabled:opacity-50"
              />
            </div>
            {manualError && <p className="text-red-400 text-xs mt-1">{manualError}</p>}
          </div>

          {/* Saved Contacts */}
          <div className="rounded-lg border border-[var(--accent-border)] bg-[var(--bg-input)] p-3 space-y-3">
            <p className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
              Saved Contacts
            </p>

            {/* Inline New Contact Form */}
            <AnimatePresence>
              {showNewContactForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
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
                      onChange={(e) => setNewContactName(e.target.value.toUpperCase())}
                      placeholder="Name *"
                      style={{ textTransform: 'uppercase' }}
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
                      onChange={(e) => setNewContactNotes(e.target.value.toUpperCase())}
                      placeholder="Notes (optional)"
                      style={{ textTransform: 'uppercase' }}
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
                </motion.div>
              )}
            </AnimatePresence>

            {isLoadingContacts ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={18} className="animate-spin text-[var(--accent-bright)]" />
                <span className="ml-2 text-xs text-[var(--text-muted)]">Loading contacts...</span>
              </div>
            ) : contactsList.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-4">
                No saved contacts yet. Use &ldquo;+ New Contact&rdquo; below to add one.
              </p>
            ) : (
              <div className="max-h-[200px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                <AnimatePresence mode="popLayout">
                  {contactsList.map((contact) => {
                    const alreadyAdded = recipients.some(
                      (r) => r.toLowerCase() === contact.contact_email.toLowerCase(),
                    );
                    return (
                      <motion.button
                        key={contact.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.2 }}
                        type="button"
                        onClick={() => handleAddContactEmail(contact.contact_email)}
                        disabled={alreadyAdded || isSending}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          alreadyAdded
                            ? 'opacity-40 cursor-not-allowed'
                            : 'hover:bg-[var(--accent-8)] cursor-pointer'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-data text-[var(--text-primary)] block truncate">
                            {contact.contact_name}
                          </span>
                          <span className="text-xs text-[var(--text-muted)] block truncate">
                            {contact.contact_email}
                            {alreadyAdded && ' (already added)'}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {/* Always available — with zero contacts, NEW CONTACT is the only way forward */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="secondary"
                size="small"
                onClick={() => setShowNewContactForm(true)}
                disabled={isSending}
                className="flex-1 flex items-center justify-center gap-1.5"
              >
                <Plus size={14} />
                NEW CONTACT
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={() => setShowContactsManager(true)}
                disabled={isSending}
                className="flex-1 flex items-center justify-center gap-1.5"
              >
                <BookUser size={14} />
                EDIT SAVED CONTACTS
              </Button>
            </div>
          </div>

          {/* Subject line */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
              Subject Line
            </p>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={buildDefaultSubject()}
              disabled={isSending}
              className="w-full px-3 py-2.5 text-sm font-data bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition-colors disabled:opacity-50"
            />
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

      {/* Rendered AFTER the modal above so it paints on top at the shared z-index.
          Closing it re-fetches contacts so edits/deletions show up immediately. */}
      <ContactsModal
        isOpen={showContactsManager}
        onClose={() => {
          setShowContactsManager(false);
          void loadContacts();
        }}
      />
    </>
  );
}
