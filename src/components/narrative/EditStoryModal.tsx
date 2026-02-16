'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Textarea from '@/components/ui/Textarea';
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

  // Reset when modal opens with new narrative
  useEffect(() => {
    if (isOpen) {
      setBlockText(narrative.block_narrative);
      setConcern(narrative.concern);
      setCause(narrative.cause);
      setCorrection(narrative.correction);
    }
  }, [isOpen, narrative]);

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Story" width="max-w-[700px]">
      {displayFormat === 'block' ? (
        <Textarea
          label="Block Narrative"
          value={blockText}
          onChange={(e) => setBlockText(e.target.value)}
          className="min-h-[300px] font-mono text-xs"
        />
      ) : (
        <>
          <Textarea
            label="Concern"
            value={concern}
            onChange={(e) => setConcern(e.target.value)}
            className="min-h-[100px] font-mono text-xs"
          />
          <Textarea
            label="Cause"
            value={cause}
            onChange={(e) => setCause(e.target.value)}
            className="min-h-[100px] font-mono text-xs"
          />
          <Textarea
            label="Correction"
            value={correction}
            onChange={(e) => setCorrection(e.target.value)}
            className="min-h-[100px] font-mono text-xs"
          />
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
