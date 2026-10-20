'use client';

import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

/** Matches MAX_COMMENT_LENGTH in /api/proofread-feedback. */
export const MAX_PROOFREAD_COMMENT_LENGTH = 5000;

interface ProofreadFeedbackModalProps {
  isOpen: boolean;
  /** 0-based index of the suggestion being rated (null when closed). */
  suggestionIndex: number | null;
  suggestionText: string;
  isSaving?: boolean;
  /** Re-POSTs the thumbs-down with the comment; the parent closes on success. */
  onSubmit: (comment: string) => void | Promise<void>;
  /** SKIP / X / Escape / backdrop — the thumbs-down itself is already recorded. */
  onClose: () => void;
}

/**
 * "What was wrong with this suggestion?" prompt shown right after a thumbs-down
 * on a Review & Proofread suggestion. Built on ui/Modal so it joins the shared
 * overlay stack (Escape closes only the frontmost overlay, z-index stacks by
 * depth, body scroll lock is ref-counted) exactly like EmailExportModal.
 */
export default function ProofreadFeedbackModal({
  isOpen,
  suggestionIndex,
  suggestionText,
  isSaving = false,
  onSubmit,
  onClose,
}: ProofreadFeedbackModalProps) {
  const [comment, setComment] = useState('');

  // Fresh textarea every time the modal opens for a (possibly different)
  // suggestion. "Adjust state when a prop changes" pattern — a setState in an
  // effect trips react-hooks/set-state-in-effect.
  const openKey = isOpen ? `open:${suggestionIndex ?? 'none'}` : 'closed';
  const [lastOpenKey, setLastOpenKey] = useState(openKey);
  if (openKey !== lastOpenKey) {
    setLastOpenKey(openKey);
    if (isOpen) setComment('');
  }

  const trimmed = comment.trim();
  const canSubmit = trimmed.length > 0 && trimmed.length <= MAX_PROOFREAD_COMMENT_LENGTH && !isSaving;

  const handleSubmit = () => {
    if (!canSubmit) return;
    void onSubmit(trimmed);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Suggestion Feedback" width="max-w-[600px]">
      <div className="space-y-4">
        {suggestionIndex !== null && (
          <div className="bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg p-3">
            <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-1">
              Suggestion {suggestionIndex + 1}
            </p>
            <p className="text-[var(--text-primary)] text-sm leading-relaxed">{suggestionText}</p>
          </div>
        )}

        <div>
          <label
            htmlFor="proofread-feedback-comment"
            className="block text-[var(--text-secondary)] text-sm font-medium mb-2"
          >
            What was wrong with this suggestion?
          </label>
          <textarea
            id="proofread-feedback-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={MAX_PROOFREAD_COMMENT_LENGTH}
            rows={5}
            autoFocus
            disabled={isSaving}
            placeholder="Tell us what missed the mark — wrong fact, awkward wording, didn't fit the story..."
            className="w-full p-3 min-h-[120px] resize-vertical leading-relaxed text-sm
              bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg
              text-[var(--text-primary)] placeholder-[var(--text-muted)]
              focus:outline-none focus:border-[var(--accent-hover)] focus:shadow-[0_0_0_3px_var(--accent-20)]
              hover:border-[var(--accent-primary)] transition-all duration-200
              disabled:opacity-50"
          />
          <div className="flex items-center justify-end mt-1.5">
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {comment.length}/{MAX_PROOFREAD_COMMENT_LENGTH}
            </span>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <Button
            variant="primary"
            size="fullWidth"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                SAVING...
              </>
            ) : (
              <>
                <Send size={16} />
                SUBMIT
              </>
            )}
          </Button>
          <Button variant="secondary" size="medium" onClick={onClose} disabled={isSaving}>
            SKIP
          </Button>
        </div>
      </div>
    </Modal>
  );
}
