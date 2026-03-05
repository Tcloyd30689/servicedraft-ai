'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { dispatchActivity } from '@/hooks/useActivityPulse';
import { useNarrativeStore } from '@/stores/narrativeStore';
import type { Narrative } from '@/types/database';
import type { DropdownOption } from '@/constants/fieldConfig';

interface UpdateWithRepairModalProps {
  isOpen: boolean;
  onClose: () => void;
  narrative: Narrative;
}

const DROPDOWN_OPTIONS: { value: DropdownOption; label: string }[] = [
  { value: 'include', label: 'Include Information' },
  { value: 'dont_include', label: "Don't Include Information" },
  { value: 'generate', label: 'Generate Applicable Info' },
];

const COMPLETED_REPAIR_INSTRUCTION =
  'COMPLETED RECOMMENDED REPAIR: Using the diagnostic narrative\'s recommended repair/correction section, convert the recommendation into a completed repair description in past tense. The repair that was recommended has been performed as described.';

export default function UpdateWithRepairModal({
  isOpen,
  onClose,
  narrative,
}: UpdateWithRepairModalProps) {
  const router = useRouter();
  const { setForRepairUpdate } = useNarrativeStore();

  const [repairPerformed, setRepairPerformed] = useState('');
  const [useRecommendedRepair, setUseRecommendedRepair] = useState(false);
  const [repairVerification, setRepairVerification] = useState('');
  const [repairVerificationDropdown, setRepairVerificationDropdown] = useState<DropdownOption>('include');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);

  const repairRef = useRef<HTMLTextAreaElement>(null);
  const verificationRef = useRef<HTMLTextAreaElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => { autoResize(repairRef.current); }, [repairPerformed, autoResize]);
  useEffect(() => { autoResize(verificationRef.current); }, [repairVerification, autoResize]);
  useEffect(() => { autoResize(notesRef.current); }, [additionalNotes, autoResize]);

  // Determine if Generate button should be enabled
  const canGenerate = useRecommendedRepair || repairPerformed.trim().length > 0;

  // Toggle "COMPLETED RECOMMENDED REPAIR" — no API call, just sets field state
  const handleToggleRecommendedRepair = () => {
    if (useRecommendedRepair) {
      // Toggle OFF — un-collapse and clear
      setUseRecommendedRepair(false);
      setRepairPerformed('');
    } else {
      // Toggle ON — collapse and pre-fill with instruction
      setUseRecommendedRepair(true);
      setRepairPerformed('');
    }
  };

  // "GENERATE NARRATIVE" button handler
  const handleGenerateNarrative = async () => {
    setIsGenerating(true);
    dispatchActivity(0.8);
    try {
      // Build repair performed value: instruction text if toggle is on, user text otherwise
      const repairPerformedValue = useRecommendedRepair
        ? COMPLETED_REPAIR_INSTRUCTION
        : repairPerformed;

      const res = await fetch('/api/update-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalConcern: narrative.concern,
          originalCause: narrative.cause,
          originalCorrection: narrative.correction,
          vehicleYear: narrative.vehicle_year ? String(narrative.vehicle_year) : '',
          vehicleMake: narrative.vehicle_make || '',
          vehicleModel: narrative.vehicle_model || '',
          repairPerformed: repairPerformedValue,
          repairPerformedDropdown: 'include',
          repairVerification,
          repairVerificationDropdown,
          additionalNotes: additionalNotes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        if (res.status === 403) {
          const body = await res.json().catch(() => null);
          toast.error(body?.error || 'Your account has been restricted.');
          return;
        }
        throw new Error('API error');
      }

      const data = await res.json();

      // Set up the narrative store for the narrative page
      setForRepairUpdate({
        narrative: data,
        roNumber: narrative.ro_number || '',
        year: narrative.vehicle_year ? String(narrative.vehicle_year) : '',
        make: narrative.vehicle_make || '',
        model: narrative.vehicle_model || '',
      });

      onClose();
      router.push('/narrative');
    } catch {
      toast.error('Failed to generate updated narrative. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setRepairPerformed('');
      setUseRecommendedRepair(false);
      setRepairVerification('');
      setRepairVerificationDropdown('include');
      setAdditionalNotes('');
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Narrative with Repair" width="max-w-3xl">
      {/* Vehicle Info Badges */}
      <div className="flex flex-wrap gap-2 mb-6">
        {narrative.vehicle_year && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--accent-10)] text-[var(--accent-bright)] border border-[var(--accent-border)]">
            {narrative.vehicle_year}
          </span>
        )}
        {narrative.vehicle_make && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--accent-10)] text-[var(--accent-bright)] border border-[var(--accent-border)]">
            {narrative.vehicle_make}
          </span>
        )}
        {narrative.vehicle_model && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--accent-10)] text-[var(--accent-bright)] border border-[var(--accent-border)]">
            {narrative.vehicle_model}
          </span>
        )}
        {narrative.ro_number && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--accent-10)] text-[var(--accent-bright)] border border-[var(--accent-border)]">
            R.O. # {narrative.ro_number}
          </span>
        )}
      </div>

      {/* Field 1: Repair Performed — NO dropdown, just label + text field */}
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-2">
          <label className="text-[var(--text-secondary)] text-sm font-medium">
            Repair Performed
          </label>
        </div>

        {/* Show text field when NOT using recommended repair */}
        {!useRecommendedRepair && (
          <textarea
            ref={repairRef}
            rows={2}
            value={repairPerformed}
            onChange={(e) => setRepairPerformed(e.target.value)}
            placeholder="Describe the repair that was performed..."
            className="w-full p-3 leading-relaxed resize-none overflow-hidden font-data bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-hover)] focus:shadow-[0_0_0_3px_var(--accent-20)] hover:border-[var(--accent-primary)] transition-all duration-200"
          />
        )}

        {/* Show collapsed instruction when using recommended repair */}
        {useRecommendedRepair && (
          <div className="p-3 bg-[var(--accent-5)] border border-dashed border-[var(--accent-border)] rounded-lg">
            <p className="text-xs text-[var(--accent-bright)] italic flex items-center gap-2">
              <CheckCircle size={14} className="flex-shrink-0" />
              Using the diagnostic narrative&apos;s recommended repair — the AI will convert the recommendation into a completed repair description in past tense.
            </p>
          </div>
        )}
      </div>

      {/* "COMPLETED RECOMMENDED REPAIR" Button — large, prominent, centered */}
      <div className="flex justify-center mb-6">
        <button
          onClick={handleToggleRecommendedRepair}
          className={`
            w-3/4 py-4 rounded-xl text-sm font-bold uppercase tracking-wider
            border-2 transition-all duration-200 cursor-pointer
            flex items-center justify-center gap-2.5
            ${useRecommendedRepair
              ? 'bg-[var(--accent-primary)] text-[var(--btn-text-on-accent,#fff)] border-[var(--accent-hover)] shadow-[var(--shadow-glow-accent)]'
              : 'bg-[var(--accent-10)] text-[var(--accent-bright)] border-[var(--accent-border)] hover:bg-[var(--accent-20)] hover:border-[var(--accent-hover)] hover:shadow-[var(--shadow-glow-sm)]'
            }
          `}
        >
          {useRecommendedRepair ? (
            <CheckCircle size={18} />
          ) : (
            <Sparkles size={18} />
          )}
          COMPLETED RECOMMENDED REPAIR
        </button>
      </div>

      {/* Field 2: Repair Verification Steps — keeps dropdown */}
      <div className="mb-5">
        <div className="flex items-center justify-between gap-3 mb-2">
          <label className="text-[var(--text-secondary)] text-sm font-medium flex items-center gap-1.5">
            Repair Verification Steps
            {repairVerificationDropdown === 'generate' && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-[var(--accent-20)] text-[var(--accent-text-emphasis)] px-1.5 py-0.5 rounded">
                <Sparkles size={10} />
                AI
              </span>
            )}
          </label>
          <select
            value={repairVerificationDropdown}
            onChange={(e) => setRepairVerificationDropdown(e.target.value as DropdownOption)}
            className="text-xs bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-md px-2 py-1.5 text-[var(--text-secondary)] cursor-pointer focus:outline-none focus:border-[var(--accent-hover)] appearance-none"
          >
            {DROPDOWN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {repairVerificationDropdown === 'include' && (
          <textarea
            ref={verificationRef}
            rows={2}
            value={repairVerification}
            onChange={(e) => setRepairVerification(e.target.value)}
            placeholder="Describe how the repair was verified..."
            className="w-full p-3 leading-relaxed resize-none overflow-hidden font-data bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-hover)] focus:shadow-[0_0_0_3px_var(--accent-20)] hover:border-[var(--accent-primary)] transition-all duration-200"
          />
        )}

        {repairVerificationDropdown === 'generate' && (
          <div className="p-3 bg-[var(--accent-5)] border border-dashed border-[var(--accent-border)] rounded-lg">
            <p className="text-xs text-[var(--text-muted)] italic">
              AI will generate the most probable verification steps based on the repair performed.
            </p>
          </div>
        )}
      </div>

      {/* Field 3: Additional Notes (optional) */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <label className="text-[var(--text-secondary)] text-sm font-medium">
            Additional Notes <span className="text-[var(--text-muted)] font-normal">(optional)</span>
          </label>
        </div>
        <textarea
          ref={notesRef}
          rows={2}
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          placeholder="Add any additional context about the completed repair..."
          className="w-full p-3 leading-relaxed resize-none overflow-hidden font-data bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-hover)] focus:shadow-[0_0_0_3px_var(--accent-20)] hover:border-[var(--accent-primary)] transition-all duration-200"
        />
      </div>

      {/* Generate Button */}
      <Button
        size="fullWidth"
        onClick={handleGenerateNarrative}
        disabled={!canGenerate || isGenerating}
        className="flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            GENERATING NARRATIVE...
          </>
        ) : (
          'GENERATE NARRATIVE'
        )}
      </Button>
    </Modal>
  );
}
