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
}

export default function EditStoryModal({
  isOpen,
  onClose,
  narrative,
  displayFormat,
  onSave,
}: EditStoryModalProps) {
  const [blockText, setBlockText] = useState(narrative.block_narrative);
  const [concern, setConcern] = useState(narrative.concern);
  const [cause, setCause] = useState(narrative.cause);
  const [correction, setCorrection] = useState(narrative.correction);

  const blockRef = useRef<HTMLTextAreaElement>(null);
  const concernRef = useRef<HTMLTextAreaElement>(null);
  const causeRef = useRef<HTMLTextAreaElement>(null);
  const correctionRef = useRef<HTMLTextAreaElement>(null);

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
    'w-full p-3 leading-relaxed font-mono text-xs',
    'bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg',
    'text-[var(--text-primary)] placeholder-[var(--text-muted)]',
    'focus:outline-none focus:border-[var(--accent-hover)] focus:shadow-[0_0_0_3px_var(--accent-20)]',
    'hover:border-[var(--accent-primary)]',
    'transition-all duration-200',
  ].join(' ');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Story" width="max-w-[700px]">
      {displayFormat === 'block' ? (
        <div className="mb-5">
          <label className="block text-[var(--text-secondary)] text-sm font-medium mb-2">
            Block Narrative
          </label>
          <textarea
            ref={blockRef}
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

      <div className="flex gap-3 mt-4">
        <Button variant="secondary" onClick={onClose} className="flex-1">
          CANCEL
        </Button>
        <Button onClick={handleSave} className="flex-1">
          SAVE CHANGES
        </Button>
      </div>
    </Modal>
  );
}
