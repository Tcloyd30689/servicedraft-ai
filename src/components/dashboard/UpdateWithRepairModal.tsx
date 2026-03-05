'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2 } from 'lucide-react';
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

export default function UpdateWithRepairModal({
  isOpen,
  onClose,
  narrative,
}: UpdateWithRepairModalProps) {
  const router = useRouter();
  const { setForRepairUpdate } = useNarrativeStore();

  const [repairPerformed, setRepairPerformed] = useState('');
  const [repairPerformedDropdown, setRepairPerformedDropdown] = useState<DropdownOption>('include');
  const [repairVerification, setRepairVerification] = useState('');
  const [repairVerificationDropdown, setRepairVerificationDropdown] = useState<DropdownOption>('include');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [isConverting, setIsConverting] = useState(false);
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
  const canGenerate =
    (repairPerformedDropdown === 'include' && repairPerformed.trim().length > 0) ||
    repairPerformedDropdown === 'generate';

  // "COMPLETED RECOMMEND REPAIR" button handler
  const handleConvertRecommendation = async () => {
    const correction = narrative.correction;
    if (!correction?.trim()) {
      toast.error('Could not convert recommendation — please enter repair details manually');
      return;
    }

    setIsConverting(true);
    try {
      const res = await fetch('/api/convert-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correction }),
      });

      if (!res.ok) throw new Error('API error');

      const { repairText } = await res.json();
      if (repairText) {
        setRepairPerformed(repairText);
        setRepairPerformedDropdown('include');
        toast.success('Recommendation converted to completed repair');
      } else {
        toast.error('Could not convert recommendation — please enter repair details manually');
      }
    } catch {
      toast.error('Could not convert recommendation — please enter repair details manually');
    } finally {
      setIsConverting(false);
    }
  };

  // "GENERATE NARRATIVE" button handler
  const handleGenerateNarrative = async () => {
    setIsGenerating(true);
    dispatchActivity(0.8);
    try {
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
          repairPerformed,
          repairPerformedDropdown,
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
      setRepairPerformedDropdown('include');
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

      {/* Field 1: Repair Performed */}
      <div className="mb-5">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleConvertRecommendation}
              disabled={isConverting}
              className="text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-md border border-[var(--accent-border)] bg-[var(--accent-10)] text-[var(--accent-bright)] hover:bg-[var(--accent-20)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isConverting ? (
                <Loader2 size={10} className="animate-spin" />
              ) : (
                <Sparkles size={10} />
              )}
              {isConverting ? 'CONVERTING...' : 'COMPLETED RECOMMEND REPAIR'}
            </button>
            <label className="text-[var(--text-secondary)] text-sm font-medium">
              Repair Performed
            </label>
            {repairPerformedDropdown === 'generate' && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-[var(--accent-20)] text-[var(--accent-text-emphasis)] px-1.5 py-0.5 rounded">
                <Sparkles size={10} />
                AI
              </span>
            )}
          </div>
          <select
            value={repairPerformedDropdown}
            onChange={(e) => setRepairPerformedDropdown(e.target.value as DropdownOption)}
            className="text-xs bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-md px-2 py-1.5 text-[var(--text-secondary)] cursor-pointer focus:outline-none focus:border-[var(--accent-hover)] appearance-none"
          >
            {DROPDOWN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {repairPerformedDropdown === 'include' && (
          <textarea
            ref={repairRef}
            rows={2}
            value={repairPerformed}
            onChange={(e) => setRepairPerformed(e.target.value)}
            placeholder="Describe the repair that was performed..."
            className="w-full p-3 leading-relaxed resize-none overflow-hidden font-data bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-hover)] focus:shadow-[0_0_0_3px_var(--accent-20)] hover:border-[var(--accent-primary)] transition-all duration-200"
          />
        )}

        {repairPerformedDropdown === 'generate' && (
          <div className="p-3 bg-[var(--accent-5)] border border-dashed border-[var(--accent-border)] rounded-lg">
            <p className="text-xs text-[var(--text-muted)] italic">
              AI will generate the most probable repair performed based on the original diagnostic recommendation.
            </p>
          </div>
        )}
      </div>

      {/* Field 2: Repair Verification Steps */}
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
