'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { RefreshCw, Settings, Search, Pencil, Save, Share2, CheckCircle } from 'lucide-react';
import { useNarrativeStore } from '@/stores/narrativeStore';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import LiquidCard from '@/components/ui/LiquidCard';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import NarrativeDisplay from '@/components/narrative/NarrativeDisplay';
import CustomizationPanel from '@/components/narrative/CustomizationPanel';
import ProofreadResults from '@/components/narrative/ProofreadResults';
import EditStoryModal from '@/components/narrative/EditStoryModal';
import ShareExportModal from '@/components/narrative/ShareExportModal';
import type { NarrativeData } from '@/stores/narrativeStore';

interface ProofreadData {
  flagged_issues: string[];
  suggested_edits: string[];
  overall_rating: 'PASS' | 'NEEDS_REVIEW' | 'FAIL';
  summary: string;
}

export default function NarrativePage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    state,
    setNarrative,
    setDisplayFormat,
    resetCustomization,
  } = useNarrativeStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isProofreading, setIsProofreading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isApplyingEdits, setIsApplyingEdits] = useState(false);
  const [animateNarrative, setAnimateNarrative] = useState(false);

  const [showCustomization, setShowCustomization] = useState(false);
  const [proofreadData, setProofreadData] = useState<ProofreadData | null>(null);
  const [animateProofread, setAnimateProofread] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const lastGenerationId = useRef(-1);

  // Generate narrative on mount if we have compiled data but no narrative yet
  const generateNarrative = useCallback(async () => {
    if (!state.compiledDataBlock || !state.storyType) return;

    setIsGenerating(true);
    setProofreadData(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compiledDataBlock: state.compiledDataBlock,
          storyType: state.storyType,
        }),
      });

      if (!res.ok) throw new Error('API error');

      const data: NarrativeData = await res.json();
      setNarrative(data);
      setAnimateNarrative(true);
    } catch {
      toast.error('Failed to generate narrative. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [state.compiledDataBlock, state.storyType, setNarrative]);

  useEffect(() => {
    // Redirect if no data to work with
    if (!state.compiledDataBlock || !state.storyType) {
      router.replace('/input');
      return;
    }

    // Generate when generationId changes (new input submitted) or on first load with no narrative
    if (lastGenerationId.current !== state.generationId) {
      lastGenerationId.current = state.generationId;
      if (!state.narrative) {
        generateNarrative();
      }
    }
  }, [state.compiledDataBlock, state.storyType, state.narrative, state.generationId, router, generateNarrative]);

  // Regenerate — re-runs API with original input
  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setProofreadData(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compiledDataBlock: state.compiledDataBlock,
          storyType: state.storyType,
        }),
      });

      if (!res.ok) throw new Error('API error');

      const data: NarrativeData = await res.json();
      setNarrative(data);
      setAnimateNarrative(true);
      resetCustomization();
      toast.success('Story regenerated');
    } catch {
      toast.error('Failed to regenerate. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Customize — sends current narrative text to customize API
  const handleCustomize = async () => {
    if (!state.narrative) return;

    const { lengthSlider, toneSlider, detailSlider, customInstructions } = state;

    // Check if any customization is actually set
    if (
      lengthSlider === 'standard' &&
      toneSlider === 'standard' &&
      detailSlider === 'standard' &&
      !customInstructions.trim()
    ) {
      toast('Adjust at least one slider or add custom instructions before applying.', {
        icon: '⚙️',
      });
      return;
    }

    setIsCustomizing(true);
    try {
      const res = await fetch('/api/customize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concern: state.narrative.concern,
          cause: state.narrative.cause,
          correction: state.narrative.correction,
          storyType: state.storyType,
          lengthSlider: lengthSlider !== 'standard' ? lengthSlider : undefined,
          toneSlider: toneSlider !== 'standard' ? toneSlider : undefined,
          detailSlider: detailSlider !== 'standard' ? detailSlider : undefined,
          customInstructions: customInstructions.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error('API error');

      const data: NarrativeData = await res.json();
      setNarrative(data);
      setAnimateNarrative(true);
      setProofreadData(null);
      toast.success('Customization applied');
    } catch {
      toast.error('Failed to customize narrative. Please try again.');
    } finally {
      setIsCustomizing(false);
    }
  };

  // Proofread — sends current narrative to audit API
  const handleProofread = async () => {
    if (!state.narrative) return;

    setIsProofreading(true);
    try {
      const res = await fetch('/api/proofread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concern: state.narrative.concern,
          cause: state.narrative.cause,
          correction: state.narrative.correction,
          storyType: state.storyType,
          year: state.fieldValues['year'] || '',
          make: state.fieldValues['make'] || '',
          model: state.fieldValues['model'] || '',
        }),
      });

      if (!res.ok) throw new Error('API error');

      const data: ProofreadData = await res.json();
      setProofreadData(data);
      setAnimateProofread(true);
    } catch {
      toast.error('Failed to proofread. Please try again.');
    } finally {
      setIsProofreading(false);
    }
  };

  // Apply suggested edits from proofread
  const handleApplyEdits = async () => {
    if (!state.narrative || !proofreadData?.suggested_edits?.length) return;

    setIsApplyingEdits(true);
    try {
      const res = await fetch('/api/apply-edits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concern: state.narrative.concern,
          cause: state.narrative.cause,
          correction: state.narrative.correction,
          suggestedEdits: proofreadData.suggested_edits,
        }),
      });

      if (!res.ok) throw new Error('API error');

      const data: NarrativeData = await res.json();
      setNarrative(data);
      setAnimateNarrative(true);
      setProofreadData(null);
      toast.success('Suggested edits applied');
    } catch {
      toast.error('Failed to apply edits. Please try again.');
    } finally {
      setIsApplyingEdits(false);
    }
  };

  // Save to Supabase
  const handleSave = async () => {
    if (!state.narrative || !user) {
      toast.error('Unable to save — please log in');
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('narratives').insert({
        user_id: user.id,
        ro_number: state.roNumber || null,
        vehicle_year: state.fieldValues['year']
          ? parseInt(state.fieldValues['year'], 10) || null
          : null,
        vehicle_make: state.fieldValues['make'] || null,
        vehicle_model: state.fieldValues['model'] || null,
        concern: state.narrative.concern,
        cause: state.narrative.cause,
        correction: state.narrative.correction,
        full_narrative: state.narrative.block_narrative,
        story_type: state.storyType,
      });

      if (error) throw error;
      toast.success('Story saved successfully');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (typeof err === 'object' && err !== null && 'message' in err) ? String((err as { message: unknown }).message) : 'Unknown error';
      console.error('Save story error:', err);
      toast.error(`Failed to save story: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Edit handler
  const handleEditSave = (updated: NarrativeData) => {
    setNarrative(updated);
    setAnimateNarrative(false);
    setProofreadData(null);
    toast.success('Story updated');
  };

  // Format toggle
  const toggleFormat = () => {
    setDisplayFormat(state.displayFormat === 'block' ? 'ccc' : 'block');
    setAnimateNarrative(false);
  };

  // Show loading while generating initially
  if (isGenerating && !state.narrative) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="large" message="Generating your warranty narrative..." />
      </div>
    );
  }

  // Nothing to show
  if (!state.narrative) {
    return null;
  }

  const isAnyLoading = isRegenerating || isCustomizing || isProofreading || isApplyingEdits;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Panel — Controls */}
          <div className="lg:w-[340px] shrink-0 space-y-4">
            {/* Regenerate */}
            <LiquidCard size="compact">
              <Button
                variant="secondary"
                size="fullWidth"
                onClick={handleRegenerate}
                disabled={isAnyLoading}
                className="flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} className={isRegenerating ? 'animate-spin' : ''} />
                {isRegenerating ? 'REGENERATING...' : 'REGENERATE STORY'}
              </Button>
            </LiquidCard>

            {/* Customization */}
            <LiquidCard size="compact">
              <button
                onClick={() => setShowCustomization(!showCustomization)}
                className="w-full flex items-center justify-between text-white font-semibold text-sm cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Settings size={16} className="text-[#a855f7]" />
                  AI OUTPUT CUSTOMIZATION
                </span>
                <span className="text-[#9ca3af] text-xs">
                  {showCustomization ? 'HIDE' : 'SHOW'}
                </span>
              </button>

              {showCustomization && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4"
                >
                  <CustomizationPanel
                    onApply={handleCustomize}
                    isLoading={isCustomizing}
                  />
                </motion.div>
              )}
            </LiquidCard>

            {/* Review & Proofread */}
            <LiquidCard size="compact">
              <Button
                variant="secondary"
                size="fullWidth"
                onClick={handleProofread}
                disabled={isAnyLoading}
                className="flex items-center justify-center gap-2"
              >
                <Search size={16} />
                {isProofreading ? 'REVIEWING...' : 'REVIEW & PROOFREAD STORY'}
              </Button>

              {isProofreading && (
                <div className="mt-4">
                  <LoadingSpinner size="small" message="Reviewing narrative for issues..." />
                </div>
              )}

              {isApplyingEdits && (
                <div className="mt-4">
                  <LoadingSpinner size="small" message="Applying suggested edits..." />
                </div>
              )}

              {proofreadData && !isProofreading && !isApplyingEdits && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4"
                >
                  <ProofreadResults data={proofreadData} animate={animateProofread} />

                  {proofreadData.suggested_edits.length > 0 && (
                    <div className="mt-4">
                      <Button
                        size="fullWidth"
                        onClick={handleApplyEdits}
                        disabled={isAnyLoading}
                        className="flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={16} />
                        APPLY SUGGESTED EDITS
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </LiquidCard>
          </div>

          {/* Right Panel — Narrative Display */}
          <div className="flex-1 min-w-0">
            <LiquidCard size="standard">
              {/* Regenerating overlay */}
              {isRegenerating && (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="medium" message="Regenerating narrative..." />
                </div>
              )}

              {isCustomizing && (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="medium" message="Applying customization settings..." />
                </div>
              )}

              {isApplyingEdits && (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner size="medium" message="Applying suggested edits..." />
                </div>
              )}

              {!isRegenerating && !isCustomizing && !isApplyingEdits && (
                <NarrativeDisplay
                  narrative={state.narrative}
                  displayFormat={state.displayFormat}
                  animate={animateNarrative}
                />
              )}
            </LiquidCard>

            {/* Bottom Action Buttons */}
            <div className="flex flex-wrap gap-3 mt-4">
              <Button
                variant="secondary"
                size="medium"
                onClick={() => setEditModalOpen(true)}
                disabled={isAnyLoading}
                className="flex items-center gap-2"
              >
                <Pencil size={15} />
                EDIT STORY
              </Button>

              <Button
                variant="secondary"
                size="medium"
                onClick={toggleFormat}
                disabled={isAnyLoading}
              >
                {state.displayFormat === 'block' ? 'C/C/C FORMAT' : 'BLOCK FORMATTING'}
              </Button>

              <Button
                size="medium"
                onClick={handleSave}
                disabled={isAnyLoading || isSaving}
                className="flex items-center gap-2"
              >
                <Save size={15} />
                {isSaving ? 'SAVING...' : 'SAVE STORY'}
              </Button>

              <Button
                variant="secondary"
                size="medium"
                onClick={() => setExportModalOpen(true)}
                disabled={isAnyLoading}
                className="flex items-center gap-2"
              >
                <Share2 size={15} />
                SHARE / EXPORT
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modals */}
      <EditStoryModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        narrative={state.narrative}
        displayFormat={state.displayFormat}
        onSave={handleEditSave}
      />

      <ShareExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        narrative={state.narrative}
        displayFormat={state.displayFormat}
        vehicleInfo={{
          year: state.fieldValues['year'] || '',
          make: state.fieldValues['make'] || '',
          model: state.fieldValues['model'] || '',
          roNumber: state.roNumber || '',
        }}
      />
    </div>
  );
}
