'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Mail, Plus, X, Loader2 } from 'lucide-react';
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
const MAX_RECIPIENTS = 3;

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
                      className="w-full pl-10 pr-3 py-2.5 rounded-lg border text-sm
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

        {/* Add recipient link */}
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

        {/* Subject preview */}
        <div className="bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1">
            SUBJECT LINE
          </p>
          <p className="text-sm text-[var(--text-secondary)] break-words">{subjectPreview}</p>
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
