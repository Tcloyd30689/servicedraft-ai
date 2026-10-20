'use client';

import { useState } from 'react';
import { useNarrativeStore } from '@/stores/narrativeStore';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';

const BLOCKED_PATTERNS = [
  /ignore (previous|prior|all) instructions/i,
  /you are now/i,
  /system\s*:/i,
  /assistant\s*:/i,
  /disregard/i,
  /forget (your|all|previous)/i,
  /new (instructions|persona|role)/i,
  /act as/i,
  /pretend (to be|you are)/i,
];

function hasBlockedContent(text: string): boolean {
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(text));
}

// Quick-refine keys accepted by /api/refine. The legacy keys (less_detail,
// simplify, expand) stay in the type so nothing downstream breaks, but the UI
// now surfaces four DISTINCT actions: more_detail, condense, plain_language, justify.
export type RefineAction =
  | 'more_detail'
  | 'less_detail'
  | 'simplify'
  | 'expand'
  | 'condense'
  | 'plain_language'
  | 'justify'
  | 'custom';

interface CustomizationPanelProps {
  onRefine: (action: RefineAction) => void;
  isLoading: boolean;
}

interface RefineActionOption {
  action: Exclude<RefineAction, 'custom'>;
  label: string;
  /** One-line caption shown under the button so the four actions read differently at a glance. */
  caption: string;
}

const REFINE_ACTIONS: RefineActionOption[] = [
  {
    action: 'more_detail',
    label: 'MORE DETAIL',
    caption: 'Add technical specifics: readings, test steps, part names, verification.',
  },
  {
    action: 'condense',
    label: 'CONDENSE',
    caption: 'Same facts, fewer words. Cuts repetition and filler; keeps every technical fact.',
  },
  {
    action: 'plain_language',
    label: 'PLAIN LANGUAGE',
    caption: 'Swap jargon for terms a customer understands. Facts and accuracy stay intact.',
  },
  {
    action: 'justify',
    label: 'STRENGTHEN JUSTIFICATION',
    caption: 'Make the cause-to-correction link explicit for a warranty approver: why and how confirmed.',
  },
];

export default function CustomizationPanel({
  onRefine,
  isLoading,
}: CustomizationPanelProps) {
  const { state, setCustomInstructions } = useNarrativeStore();

  const [instructionsError, setInstructionsError] = useState('');

  const handleCustomApply = () => {
    if (!state.customInstructions.trim()) {
      setInstructionsError('Enter a custom instruction first.');
      return;
    }
    // First-line client-side filter against obvious prompt-injection attempts.
    // The /api/refine route enforces the same blocklist + a model scope contract.
    if (hasBlockedContent(state.customInstructions)) {
      setInstructionsError('This input contains restricted content. Please rephrase your instruction.');
      return;
    }
    setInstructionsError('');
    onRefine('custom');
  };

  return (
    <div className="space-y-4">
      {/* One-tap refine actions */}
      <div>
        <label className="block text-[var(--text-secondary)] text-sm font-medium mb-2">
          Quick Refine
        </label>
        <div className="grid grid-cols-1 gap-3">
          {REFINE_ACTIONS.map(({ action, label, caption }) => (
            <div key={action}>
              <Button
                variant="secondary"
                size="small"
                className="w-full"
                onClick={() => onRefine(action)}
                disabled={isLoading}
              >
                {label}
              </Button>
              <p className="text-[var(--text-muted)] text-[11px] leading-snug mt-1 px-1">
                {caption}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Guarded custom instructions */}
      <div>
        <Textarea
          label="Custom Instructions"
          placeholder="Add a specific instruction for refining the narrative..."
          value={state.customInstructions}
          onChange={(e) => { setCustomInstructions(e.target.value); if (instructionsError) setInstructionsError(''); }}
          maxLength={100}
          className="min-h-[80px]"
        />
        <p className="text-[var(--text-muted)] text-xs text-right -mt-4 mr-1">
          {state.customInstructions.length} / 100
        </p>
        {instructionsError && (
          <p className="text-red-500 text-xs mt-1">{instructionsError}</p>
        )}

        <Button
          size="fullWidth"
          onClick={handleCustomApply}
          disabled={isLoading}
          className="mt-2"
        >
          {isLoading ? 'REFINING...' : 'APPLY CUSTOM INSTRUCTION'}
        </Button>
      </div>
    </div>
  );
}
