'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import type { NarrativeData } from '@/stores/narrativeStore';

interface EditStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  narrative: NarrativeData;
  displayFormat: 'block' | 'ccc';
  onSave: (updated: NarrativeData) => void;
  onAutoSave?: (updated: NarrativeData) => void;
}

export default function EditStoryModal({
  isOpen,
  onClose,
  narrative,
  displayFormat,
  onSave,
  onAutoSave,
}: EditStoryModalProps) {
  const [blockText, setBlockText] = useState(narrative.block_narrative);
  const [concern, setConcern] = useState(narrative.concern);
  const [cause, setCause] = useState(narrative.cause);
  const [correction, setCorrection] = useState(narrative.correction);
  const [autoSavedAt, setAutoSavedAt] = useState<string | null>(null);

  const blockRef = useRef<HTMLTextAreaElement>(null);
  const concernRef = useRef<HTMLTextAreaElement>(null);
  const causeRef = useRef<HTMLTextAreaElement>(null);
  const correctionRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-resize a textarea to fit its content, switching overflow when it hits max-height
  const autoResize = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    // Temporarily collapse to measure true scrollHeight
    el.style.height = 'auto';
    el.style.overflow = 'hidden';
    const scrollH = el.scrollHeight;
    const maxH = window.innerHeight * 0.6; // 60vh
    if (scrollH > maxH) {
      el.style.height = `${maxH}px`;
      el.style.overflow = 'auto';
    } else {
      el.style.height = `${scrollH}px`;
      el.style.overflow = 'hidden';
    }
  }, []);

  // Reset when modal opens with new narrative
  useEffect(() => {
    if (isOpen) {
      setBlockText(narrative.block_narrative);
      setConcern(narrative.concern);
      setCause(narrative.cause);
      setCorrection(narrative.correction);
      setAutoSavedAt(null);
    }
  }, [isOpen, narrative]);

  // Auto-size all textareas when modal opens or content resets
  useEffect(() => {
    if (!isOpen) return;
    // Small delay to ensure DOM has rendered with new values
    const timer = setTimeout(() => {
      if (displayFormat === 'block') {
        autoResize(blockRef.current);
      } else {
        autoResize(concernRef.current);
        autoResize(causeRef.current);
        autoResize(correctionRef.current);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen, displayFormat, narrative, autoResize]);

  // Debounced auto-save: fires 2s after last keystroke if content differs from original
  useEffect(() => {
    if (!isOpen || !onAutoSave) return;

    // Check if content has changed from the original narrative
    const hasBlockChanged = blockText !== narrative.block_narrative;
    const hasConcernChanged = concern !== narrative.concern;
    const hasCauseChanged = cause !== narrative.cause;
    const hasCorrectionChanged = correction !== narrative.correction;

    const hasChanged = displayFormat === 'block'
      ? hasBlockChanged
      : (hasConcernChanged || hasCauseChanged || hasCorrectionChanged);

    if (!hasChanged) return;

    // Clear previous timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      let updated: NarrativeData;
      if (displayFormat === 'block') {
        updated = {
          block_narrative: blockText,
          concern: narrative.concern,
          cause: narrative.cause,
          correction: narrative.correction,
        };
      } else {
        updated = {
          block_narrative: `${concern} ${cause} ${correction}`,
          concern,
          cause,
          correction,
        };
      }
      onAutoSave(updated);
      const now = new Date();
      const hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const h12 = hours % 12 || 12;
      setAutoSavedAt(`${h12}:${minutes} ${ampm}`);
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [isOpen, onAutoSave, blockText, concern, cause, correction, narrative, displayFormat]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const handleSave = () => {
    if (displayFormat === 'block') {
      onSave({
        block_narrative: blockText,
        concern: narrative.concern,
        cause: narrative.cause,
        correction: narrative.correction,
      });
    } else {
      // In C/C/C mode, recalculate block_narrative from the three fields
      const combinedBlock = `${concern} ${cause} ${correction}`;
      onSave({
        block_narrative: combinedBlock,
        concern,
        cause,
        correction,
      });
    }
    onClose();
  };

  const textareaBaseClass = [
    'w-full p-3 leading-relaxed font-data text-sm',
    'bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg',
    'text-[var(--text-primary)] placeholder-[var(--text-muted)]',
    'focus:outline-none focus:border-[var(--accent-hover)] focus:shadow-[0_0_0_3px_var(--accent-20)]',
    'hover:border-[var(--accent-primary)]',
    'transition-all duration-200',
  ].join(' ');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Story">
      {displayFormat === 'block' ? (
        <div className="mb-5">
          <label className="block text-[var(--text-secondary)] text-sm font-medium mb-2">
            Block Narrative
          </label>
          <textarea
            ref={blockRef}
            spellCheck={true}
            value={blockText}
            onChange={(e) => {
              setBlockText(e.target.value);
              autoResize(e.target);
            }}
            className={textareaBaseClass}
            style={{ minHeight: '300px', maxHeight: '60vh', resize: 'none' }}
          />
        </div>
      ) : (
        <>
          <div className="mb-5">
            <label className="block text-[var(--text-secondary)] text-sm font-medium mb-2">
              Concern
            </label>
            <textarea
              ref={concernRef}
              spellCheck={true}
              value={concern}
              onChange={(e) => {
                setConcern(e.target.value);
                autoResize(e.target);
              }}
              className={textareaBaseClass}
              style={{ minHeight: '150px', maxHeight: '60vh', resize: 'none' }}
            />
          </div>
          <div className="mb-5">
            <label className="block text-[var(--text-secondary)] text-sm font-medium mb-2">
              Cause
            </label>
            <textarea
              ref={causeRef}
              spellCheck={true}
              value={cause}
              onChange={(e) => {
                setCause(e.target.value);
                autoResize(e.target);
              }}
              className={textareaBaseClass}
              style={{ minHeight: '150px', maxHeight: '60vh', resize: 'none' }}
            />
          </div>
          <div className="mb-5">
            <label className="block text-[var(--text-secondary)] text-sm font-medium mb-2">
              Correction
            </label>
            <textarea
              ref={correctionRef}
              spellCheck={true}
              value={correction}
              onChange={(e) => {
                setCorrection(e.target.value);
                autoResize(e.target);
              }}
              className={textareaBaseClass}
              style={{ minHeight: '150px', maxHeight: '60vh', resize: 'none' }}
            />
          </div>
        </>
      )}

      <div className="flex items-center gap-3 mt-4">
        <Button variant="secondary" onClick={onClose} className="flex-1">
          CANCEL
        </Button>
        <Button onClick={handleSave} className="flex-1">
          SAVE CHANGES
        </Button>
        {autoSavedAt && (
          <span className="text-[10px] text-[var(--text-muted)] whitespace-nowrap">
            Auto-saved at {autoSavedAt}
          </span>
        )}
      </div>
    </Modal>
  );
}
