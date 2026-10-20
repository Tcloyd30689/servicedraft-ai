'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { RefreshCw, Settings, Search, Pencil, Save, Share2, CheckCircle, RotateCcw, AlertTriangle, SlidersHorizontal, Star } from 'lucide-react';
import { logActivity } from '@/lib/activityLogger';
import { createTrackerEntry, updateTrackerAction } from '@/lib/narrativeTracker';
import { findHighlightRanges, type HighlightRange } from '@/lib/highlightUtils';
import { formatUserName } from '@/lib/formatUserName';
import { dispatchActivity } from '@/hooks/useActivityPulse';
import { useNarrativeStore } from '@/stores/narrativeStore';
import { useAuth } from '@/hooks/useAuth';
import LiquidCard from '@/components/ui/LiquidCard';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import NarrativeDisplay from '@/components/narrative/NarrativeDisplay';
import CustomizationPanel, { type RefineAction } from '@/components/narrative/CustomizationPanel';
import ProofreadResults from '@/components/narrative/ProofreadResults';
import EditStoryModal from '@/components/narrative/EditStoryModal';
import ShareExportModal from '@/components/narrative/ShareExportModal';
import { NarrativeFeedback } from '@/components/narrative/NarrativeFeedback';
import SurveyPopup, { type SurveyQuestion } from '@/components/narrative/SurveyPopup';
import Modal from '@/components/ui/Modal';
import type { NarrativeData, NarrativeState } from '@/stores/narrativeStore';

// Narrative style options for the on-page style switcher (STEP 8).
const STYLE_SWITCHER_OPTIONS: { value: NarrativeState['narrativeStyle']; label: string }[] = [
  { value: 'customer_pay', label: 'Customer Pay' },
  { value: 'extended_warranty', label: 'Extended Warranty' },
  { value: 'manufacturer_warranty', label: 'Manufacturer Warranty' },
];

interface ParsedIssue {
  issue: string;
  snippet: string;
}

interface ProofreadData {
  flagged_issues: ParsedIssue[];
  suggested_edits: string[];
  /** Fixed-list category key per issue, same index as suggested_edits. Optional for old payloads. */
  issue_categories?: string[];
  overall_rating: 'PASS' | 'NEEDS_REVIEW' | 'FAIL';
  summary: string;
}

export default function NarrativePage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const {
    state,
    setNarrative,
    setDisplayFormat,
    setNarrativeStyle,
    resetCustomization,
    resetAll,
    markSaved,
    setTrackerId,
  } = useNarrativeStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isProofreading, setIsProofreading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isApplyingEdits, setIsApplyingEdits] = useState(false);
  const [animateNarrative, setAnimateNarrative] = useState(false);

  const [showCustomization, setShowCustomization] = useState(false);
  const [proofreadData, setProofreadData] = useState<ProofreadData | null>(null);
  const [animateProofread, setAnimateProofread] = useState(false);

  // Highlight state
  const [highlightRanges, setHighlightRanges] = useState<HighlightRange[]>([]);
  const [highlightActive, setHighlightActive] = useState(false);
  const [issueDescriptions, setIssueDescriptions] = useState<string[]>([]);

  const [generationError, setGenerationError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [selectedEditIndices, setSelectedEditIndices] = useState<number[]>([]);

  // Pending micro-survey question (null = nothing to show). Set only by the
  // fire-and-forget trigger below, which runs at most once per page session.
  const [surveyQuestion, setSurveyQuestion] = useState<SurveyQuestion | null>(null);

  const lastGenerationId = useRef(-1);

  // One survey attempt per page session, even if SAVE STORY is clicked repeatedly.
  const hasAttemptedSurveyRef = useRef(false);

  // Ref to track savedNarrativeId without stale closures
  const savedIdRef = useRef(state.savedNarrativeId);
  useEffect(() => { savedIdRef.current = state.savedNarrativeId; }, [state.savedNarrativeId]);

  // Unified auto-save: INSERT on first save, PATCH on subsequent saves.
  // Accepts narrativeData directly to avoid stale closure issues when called
  // immediately after setNarrative() within the same async handler.
  // styleOverride lets a caller record a freshly-chosen style whose store snapshot
  // hasn't refreshed yet (see handleStyleChange -> handleRegenerate). When omitted,
  // the store's current style is recorded, so every call site gets a style for free.
  const autoSaveNarrative = useCallback(async (
    actionType: string,
    narrativeData?: NarrativeData,
    styleOverride?: NarrativeState['narrativeStyle'],
  ): Promise<string | null> => {
    const nd = narrativeData || state.narrative;
    if (!nd || !user) return null;

    const effectiveStyle = styleOverride ?? state.narrativeStyle;
    const currentSavedId = savedIdRef.current;

    if (!currentSavedId) {
      // First save — INSERT a new row
      const res = await fetch('/api/narratives/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ro_number: state.roNumber || null,
          vehicle_year: state.fieldValues['year']
            ? parseInt(state.fieldValues['year'], 10) || null
            : null,
          vehicle_make: state.fieldValues['make'] || null,
          vehicle_model: state.fieldValues['model'] || null,
          concern: nd.concern,
          cause: nd.cause,
          correction: nd.correction,
          full_narrative: nd.block_narrative,
          story_type: state.storyType,
          narrative_style: effectiveStyle,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to save narrative');
      }

      const { id } = await res.json();
      if (id) {
        markSaved(id);
        savedIdRef.current = id;
      }
      return id;
    } else {
      // Subsequent save — PATCH existing row
      const res = await fetch(`/api/narratives/${currentSavedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_type: actionType,
          narrative: {
            block_narrative: nd.block_narrative,
            concern: nd.concern,
            cause: nd.cause,
            correction: nd.correction,
          },
          narrative_style: effectiveStyle,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to update narrative');
      }

      // Re-mark as saved to flip the dirty flag
      markSaved(currentSavedId);
      return currentSavedId;
    }
  }, [state.narrative, state.roNumber, state.fieldValues, state.storyType, state.narrativeStyle, user, markSaved]);

  // Generate narrative on mount if we have compiled data but no narrative yet
  const generateNarrative = useCallback(async () => {
    if (!state.compiledDataBlock || !state.storyType) return;

    setIsGenerating(true);
    setProofreadData(null);
    setGenerationError(null);
    dispatchActivity(0.8);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compiledDataBlock: state.compiledDataBlock,
          storyType: state.storyType,
          narrativeStyle: state.narrativeStyle,
        }),
      });

      if (!res.ok) {
        if (res.status === 403) {
          const body = await res.json().catch(() => null);
          toast.error(body?.error || 'Your account has been restricted. Contact support for assistance.');
          return;
        }
        throw new Error('API error');
      }

      const data: NarrativeData = await res.json();
      setNarrative(data);
      setAnimateNarrative(true);
      setRetryCount(0);

      // Auto-save the initial generation (silent — no toast except first time)
      autoSaveNarrative('initial_save', data)
        .then(() => toast.success('Saved automatically', { id: 'auto-save-once' }))
        .catch((err) => console.error('Auto-save on generate error:', err));

      // Create tracker entry — awaited because we need the ID back
      const trackerId = await createTrackerEntry({
        ro_number: state.roNumber || undefined,
        vehicle_year: state.fieldValues['year'] || undefined,
        vehicle_make: state.fieldValues['make'] || undefined,
        vehicle_model: state.fieldValues['model'] || undefined,
        story_type: state.storyType || undefined,
        full_narrative: data.block_narrative,
        concern: data.concern,
        cause: data.cause,
        correction: data.correction,
        raw_input: state.compiledDataBlock,
        narrative_style: state.narrativeStyle,
        customization: {
          narrative_style: state.narrativeStyle,
          custom_instructions: state.customInstructions || '',
        },
      });
      if (trackerId) setTrackerId(trackerId);

      logActivity('generate', { story_type: state.storyType || undefined });
    } catch {
      setGenerationError('Failed to generate narrative. Please try again.');
      setRetryCount(prev => prev + 1);
      toast.error('Failed to generate narrative. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [state.compiledDataBlock, state.storyType, state.roNumber, state.fieldValues, state.narrativeStyle, state.customInstructions, setNarrative, setTrackerId, autoSaveNarrative]);

  useEffect(() => {
    // Redirect if no data to work with — allow through if narrative already exists (repair update flow)
    if (!state.storyType || (!state.compiledDataBlock && !state.narrative)) {
      router.replace('/input');
      return;
    }

    // Generate when generationId changes (new input submitted) or on first load with no narrative
    if (lastGenerationId.current !== state.generationId) {
      lastGenerationId.current = state.generationId;
      if (!state.narrative && state.compiledDataBlock) {
        generateNarrative();
      }
    }
  }, [state.compiledDataBlock, state.storyType, state.narrative, state.generationId, router, generateNarrative]);

  // Navigation guard: browser close / back button
  useEffect(() => {
    if (state.isSaved) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.isSaved]);

  // Navigation guard: intercept in-app link clicks
  useEffect(() => {
    if (state.isSaved) return;

    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return;

      // Internal navigation — intercept and show warning
      e.preventDefault();
      e.stopPropagation();
      setPendingNavigation(href);
      setShowUnsavedModal(true);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [state.isSaved]);

  // Handle confirmed leave (from unsaved modal)
  const handleConfirmLeave = () => {
    setShowUnsavedModal(false);
    if (pendingNavigation) {
      router.push(pendingNavigation);
    }
  };

  // Clear all highlights (used when narrative text changes)
  const clearHighlights = useCallback(() => {
    setHighlightActive(false);
    setHighlightRanges([]);
    setIssueDescriptions([]);
  }, []);

  // Regenerate — re-runs API with original input.
  // Accepts an optional style override so the on-page style switcher (STEP 8) can
  // regenerate at a freshly-chosen style without waiting for the store snapshot to refresh.
  const handleRegenerate = async (styleOverride?: NarrativeState['narrativeStyle']) => {
    const styleForBody = styleOverride ?? state.narrativeStyle;
    setIsRegenerating(true);
    setProofreadData(null);
    setGenerationError(null);
    clearHighlights();
    dispatchActivity(0.8);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compiledDataBlock: state.compiledDataBlock,
          storyType: state.storyType,
          narrativeStyle: styleForBody,
        }),
      });

      if (!res.ok) {
        if (res.status === 403) {
          const body = await res.json().catch(() => null);
          toast.error(body?.error || 'Your account has been restricted. Contact support for assistance.');
          return;
        }
        throw new Error('API error');
      }

      const data: NarrativeData = await res.json();
      setNarrative(data);
      setAnimateNarrative(true);
      setRetryCount(0);
      resetCustomization();

      // Fire-and-forget tracker update
      if (state.trackerId) {
        updateTrackerAction(state.trackerId, 'regenerate', {
          narrative_text: data.block_narrative,
          concern: data.concern,
          cause: data.cause,
          correction: data.correction,
          customization: {
            narrative_style: styleForBody,
            custom_instructions: state.customInstructions || '',
          },
        });
      }

      logActivity('regenerate', { story_type: state.storyType || undefined });

      // Auto-save after regeneration (silent). Pass styleForBody, not the store
      // value — on a style-switch regeneration the store snapshot is still stale.
      autoSaveNarrative('regenerate', data, styleForBody)
        .catch((err) => console.error('Auto-save on regenerate error:', err));

      toast.success('Story regenerated');
    } catch {
      setGenerationError('Failed to regenerate narrative. Please try again.');
      setRetryCount(prev => prev + 1);
      toast.error('Failed to regenerate. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Refine — sends the CURRENTLY DISPLAYED narrative to the refine API for a
  // single light-touch adjustment. For any non-custom RefineAction (more_detail,
  // condense, plain_language, justify, plus the legacy keys) refineAction is sent
  // as-is; for 'custom' the guarded custom instruction is sent instead. Nothing
  // here is hardcoded to a specific action list. The chosen narrativeStyle is
  // always included.
  const handleRefine = async (action: RefineAction) => {
    if (!state.narrative) return;

    setIsRefining(true);
    clearHighlights();
    dispatchActivity(0.7);
    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concern: state.narrative.concern,
          cause: state.narrative.cause,
          correction: state.narrative.correction,
          storyType: state.storyType,
          narrativeStyle: state.narrativeStyle,
          refineAction: action !== 'custom' ? action : undefined,
          customInstructions: action === 'custom' ? state.customInstructions.trim() : undefined,
          originalInputContext: state.compiledDataBlock || undefined,
        }),
      });

      if (!res.ok) throw new Error('API error');

      const data = await res.json();
      const refined: NarrativeData = {
        block_narrative: data.block_narrative,
        concern: data.concern,
        cause: data.cause,
        correction: data.correction,
      };
      setNarrative(refined);
      setAnimateNarrative(true);
      setProofreadData(null);

      // Fire-and-forget tracker update (keeps the existing 'customize' action for analytics continuity)
      if (state.trackerId) {
        updateTrackerAction(state.trackerId, 'customize', {
          narrative_text: refined.block_narrative,
          concern: refined.concern,
          cause: refined.cause,
          correction: refined.correction,
          customization: {
            narrative_style: state.narrativeStyle,
            custom_instructions: state.customInstructions || '',
          },
        });
      }

      logActivity('customize', { story_type: state.storyType || undefined });

      // Auto-save after refine (silent)
      autoSaveNarrative('customize', refined)
        .catch((err) => console.error('Auto-save on refine error:', err));

      if (data.instructionRejected === true) {
        toast('Custom instruction outside professional scope and was ignored.', { icon: '⚠️' });
      } else {
        toast.success('Story refined');
      }
    } catch {
      toast.error('Failed to refine narrative. Please try again.');
    } finally {
      setIsRefining(false);
    }
  };

  // Narrative style switcher (STEP 8) — the ONLY place a style change is allowed.
  // Changing the style re-runs the normal generate flow at the new style. The
  // Refine panel never changes the style on its own.
  const handleStyleChange = (newStyle: NarrativeState['narrativeStyle']) => {
    if (newStyle === state.narrativeStyle) return;
    setNarrativeStyle(newStyle);
    if (state.compiledDataBlock) {
      // Regenerate at the new style (pass override — store snapshot hasn't refreshed yet)
      handleRegenerate(newStyle);
    } else {
      // No original input to regenerate from (e.g. repair-update flow) — just record the choice
      toast.success('Narrative style updated');
    }
  };

  // Proofread — sends current narrative to audit API
  const handleProofread = async () => {
    if (!state.narrative) return;

    setIsProofreading(true);
    clearHighlights();
    dispatchActivity(0.6);
    try {
      const res = await fetch('/api/proofread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concern: state.narrative.concern,
          cause: state.narrative.cause,
          correction: state.narrative.correction,
          storyType: state.storyType,
          narrativeStyle: state.narrativeStyle,
          year: state.fieldValues['year'] || '',
          make: state.fieldValues['make'] || '',
          model: state.fieldValues['model'] || '',
          originalInputContext: state.compiledDataBlock || undefined,
        }),
      });

      if (!res.ok) throw new Error('API error');

      const data: ProofreadData = await res.json();
      setProofreadData(data);
      setAnimateProofread(true);

      // Extract snippets and compute highlight ranges
      const snippets = data.flagged_issues.map((item) => item.snippet);
      const descriptions = data.flagged_issues.map((item) => item.issue);
      const ranges = findHighlightRanges(state.narrative.block_narrative, snippets);

      setHighlightRanges(ranges);
      setIssueDescriptions(descriptions);
      if (ranges.length > 0) {
        setHighlightActive(true);
      }

      // Fire-and-forget tracker update — proofread audit complete
      if (state.trackerId) {
        updateTrackerAction(state.trackerId, 'proofread');
      }

      logActivity('proofread', { story_type: state.storyType || undefined });
    } catch {
      toast.error('Failed to proofread. Please try again.');
    } finally {
      setIsProofreading(false);
    }
  };

  // Apply only selected suggested edits from proofread
  const handleApplyEdits = async () => {
    if (!state.narrative || !proofreadData?.suggested_edits?.length) return;

    if (selectedEditIndices.length === 0) {
      toast.error('Select at least one suggested edit to apply');
      return;
    }

    const selectedEdits = selectedEditIndices.map(i => proofreadData.suggested_edits[i]);

    setIsApplyingEdits(true);
    clearHighlights();
    dispatchActivity(0.7);
    try {
      const res = await fetch('/api/apply-edits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concern: state.narrative.concern,
          cause: state.narrative.cause,
          correction: state.narrative.correction,
          suggestedEdits: selectedEdits,
          storyType: state.storyType,
        }),
      });

      if (!res.ok) throw new Error('API error');

      const data: NarrativeData = await res.json();
      setNarrative(data);
      setAnimateNarrative(true);
      setProofreadData(null);
      setSelectedEditIndices([]);

      // Fire-and-forget tracker update — proofread edits applied
      if (state.trackerId) {
        updateTrackerAction(state.trackerId, 'proofread_apply', {
          narrative_text: data.block_narrative,
          concern: data.concern,
          cause: data.cause,
          correction: data.correction,
        });
      }

      // Auto-save after applying edits (silent)
      autoSaveNarrative('proofread_apply', data)
        .catch((err) => console.error('Auto-save on apply-edits error:', err));

      toast.success('Selected edits applied');
    } catch {
      toast.error('Failed to apply edits. Please try again.');
    } finally {
      setIsApplyingEdits(false);
    }
  };

  // Micro-survey trigger — FIRE-AND-FORGET. It can never throw into handleSave
  // and never blocks it: everything after the guard runs inside a detached async
  // IIFE whose body is fully try/caught. Every failure path is silent (no toast,
  // no error UI) — console.error only, and only for a thrown error.
  //
  // Attempts AT MOST ONCE per page session: the ref flips before the first await,
  // so repeat SAVE STORY clicks (the button is not disabled after a save) cannot
  // queue a second request.
  //
  // Deliberately wired to handleSave only — NOT to autoSaveNarrative, which is the
  // shared save primitive behind eight paths (including debounced keystroke
  // auto-saves) and would fire this constantly.
  const maybeShowSurvey = useCallback(() => {
    if (hasAttemptedSurveyRef.current) return;
    hasAttemptedSurveyRef.current = true;

    void (async () => {
      try {
        const response = await fetch('/api/surveys');
        if (!response.ok) return;

        const payload = (await response.json()) as {
          data?: (SurveyQuestion & { display_chance?: number }) | null;
        } | null;
        const question = payload?.data;
        if (!question) return;

        // The server deliberately does NOT apply display_chance — we roll it here.
        if (Math.random() * 100 >= (question.display_chance ?? 0)) return;

        setSurveyQuestion({
          id: question.id,
          question_text: question.question_text,
          input_type: question.input_type,
          options: question.options ?? null,
        });
      } catch (err) {
        console.error('Survey fetch failed:', err);
      }
    })();
  }, []);

  // Manual save handler
  const handleSave = async () => {
    if (!state.narrative || !user) {
      toast.error('Unable to save — please log in');
      return;
    }

    setIsSaving(true);
    dispatchActivity(0.5);
    try {
      await autoSaveNarrative('manual_save');

      // Fire-and-forget tracker update
      if (state.trackerId) {
        updateTrackerAction(state.trackerId, 'save');
      }

      logActivity('save', { story_type: state.storyType || undefined });
      toast.success('Story saved successfully');

      // Fire-and-forget micro-survey — synchronous, never awaited, never throws.
      maybeShowSurvey();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Save story error:', err);
      toast.error(`Failed to save story: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save before export — fire-and-forget, NEVER blocks the export
  const handleBeforeExport = useCallback(async () => {
    if (!state.narrative || !user) return;

    dispatchActivity(0.5);
    if (!state.isSaved) {
      autoSaveNarrative('auto_save')
        .then(() => toast.success('Narrative auto-saved to your history', { id: 'auto-save' }))
        .catch((err) => console.error('Auto-save on export error:', err));
    }
  }, [state.narrative, state.isSaved, user, autoSaveNarrative]);

  // Edit handler
  const handleEditSave = (updated: NarrativeData) => {
    setNarrative(updated);
    setAnimateNarrative(false);
    setProofreadData(null);
    clearHighlights();

    // Auto-save after manual edit (silent)
    autoSaveNarrative('manual_edit', updated)
      .catch((err) => console.error('Auto-save on edit error:', err));

    toast.success('Story updated');
  };

  // Format toggle
  const toggleFormat = () => {
    setDisplayFormat(state.displayFormat === 'block' ? 'ccc' : 'block');
    setAnimateNarrative(false);
  };

  // Start over — reset all state and return to main menu
  const handleStartOver = () => {
    resetAll();
    router.push('/main-menu');
  };

  // Show loading while generating initially
  if (isGenerating && !state.narrative) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <LoadingSpinner size="xlarge" message="GENERATING NARRATIVE..." />
      </div>
    );
  }

  // Generation failed — show retry UI
  if (!state.narrative && generationError && !isGenerating) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <LiquidCard size="compact">
          <div className="flex flex-col items-center text-center py-6 px-4 max-w-md mx-auto">
            <AlertTriangle size={40} className="text-[var(--accent-hover)] mb-4" />
            <p className="text-[var(--text-primary)] font-semibold text-sm mb-2">
              GENERATION FAILED
            </p>
            <p className="text-[var(--text-secondary)] text-sm mb-6">
              {generationError}
            </p>
            {retryCount < 3 ? (
              <Button
                variant="primary"
                size="medium"
                onClick={() => generateNarrative()}
                className="flex items-center gap-2"
              >
                <RefreshCw size={16} />
                RETRY GENERATION
              </Button>
            ) : (
              <Button
                variant="primary"
                size="medium"
                onClick={() => {
                  setGenerationError(null);
                  router.push('/input');
                }}
                className="flex items-center gap-2"
              >
                RETURN TO INPUT
              </Button>
            )}
          </div>
        </LiquidCard>
      </div>
    );
  }

  // Nothing to show
  if (!state.narrative) {
    return null;
  }

  const isAnyLoading = isRegenerating || isRefining || isProofreading || isApplyingEdits;

  // Proofread rating presentation — drives the result stamp and the container's pulsing glow.
  // Set only once results are displayed (not while reviewing), so the glow appears only after a review.
  const proofreadRating = proofreadData && !isProofreading ? proofreadData.overall_rating : null;
  const ratingBorder =
    proofreadRating === 'PASS' ? '#16a34a' : proofreadRating === 'NEEDS_REVIEW' ? '#ca8a04' : '#dc2626';
  const ratingStampBg =
    proofreadRating === 'PASS'
      ? 'rgba(22, 163, 74, 0.8)'
      : proofreadRating === 'NEEDS_REVIEW'
        ? 'rgba(202, 138, 4, 0.82)'
        : 'rgba(220, 38, 38, 0.8)';
  const ratingGlow =
    proofreadRating === 'PASS'
      ? 'rgba(22, 163, 74, 0.65)'
      : proofreadRating === 'NEEDS_REVIEW'
        ? 'rgba(202, 138, 4, 0.65)'
        : 'rgba(220, 38, 38, 0.65)';
  const ratingStampLabel =
    proofreadRating === 'PASS' ? 'PASS' : proofreadRating === 'NEEDS_REVIEW' ? 'NEEDS REVIEW' : 'FAIL';

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
                onClick={() => handleRegenerate()}
                disabled={isAnyLoading}
                className="flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} className={isRegenerating ? 'animate-spin' : ''} />
                {isRegenerating ? 'REGENERATING...' : 'REGENERATE STORY'}
              </Button>
            </LiquidCard>

            {/* Narrative Style switcher — separate from the Refine panel.
                Changing the style regenerates the story at the new style
                (handleStyleChange is the ONLY place a style change is allowed). */}
            <LiquidCard size="compact">
              <div className="flex items-center gap-2 text-[var(--text-primary)] font-semibold text-sm mb-3">
                <SlidersHorizontal size={16} className="text-[var(--accent-hover)]" />
                NARRATIVE STYLE
              </div>
              <div className="flex bg-[var(--bg-input)] rounded-lg border border-[var(--accent-border)] overflow-hidden">
                {STYLE_SWITCHER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleStyleChange(opt.value)}
                    disabled={isAnyLoading || isSaving}
                    aria-pressed={state.narrativeStyle === opt.value}
                    className={`flex-1 py-2 px-1.5 text-[11px] leading-tight text-center font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      state.narrativeStyle === opt.value
                        ? 'bg-[var(--accent-hover)] text-white shadow-[0_0_10px_var(--accent-30)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-10)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </LiquidCard>

            {/* Customization */}
            <LiquidCard size="compact">
              <button
                onClick={() => setShowCustomization(!showCustomization)}
                className="w-full flex items-center justify-between text-[var(--text-primary)] font-semibold text-sm cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Settings size={16} className="text-[var(--accent-hover)]" />
                  REFINE STORY
                </span>
                <span className="text-[var(--text-muted)] text-xs">
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
                    onRefine={handleRefine}
                    isLoading={isRefining}
                  />
                </motion.div>
              )}
            </LiquidCard>

            {/* Review & Proofread — wrapped so the container can pulse-glow in the rating color */}
            <motion.div
              className="rounded-[23px]"
              animate={
                proofreadRating
                  ? {
                      boxShadow: [
                        `0 0 16px 2px ${ratingGlow}`,
                        `0 0 34px 9px ${ratingGlow}`,
                        `0 0 16px 2px ${ratingGlow}`,
                      ],
                    }
                  : { boxShadow: '0 0 0px 0px rgba(0,0,0,0)' }
              }
              transition={
                proofreadRating
                  ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: 0.3 }
              }
            >
            <LiquidCard size="compact" className={proofreadRating ? 'shadow-none hover:shadow-none' : ''}>
              <div className="relative">
                {proofreadRating ? (
                  // After a review: the button becomes a translucent rating stamp with a re-run icon beside it
                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 rounded-[14px] py-1.5 px-4 text-center select-none backdrop-blur-sm border"
                      style={{ backgroundColor: ratingStampBg, borderColor: ratingBorder }}
                    >
                      <span className="text-2xl font-extrabold text-black tracking-[0.15em]">
                        {ratingStampLabel}
                      </span>
                    </div>
                    <motion.button
                      type="button"
                      onClick={handleProofread}
                      disabled={isAnyLoading}
                      title="Re-run review"
                      aria-label="Re-run review"
                      whileHover={{ scale: 1.12, boxShadow: '0 0 14px 2px var(--accent-bright)' }}
                      whileTap={{ scale: 1.04 }}
                      className="shrink-0 flex items-center justify-center h-10 w-10 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ color: 'var(--accent-bright)', backgroundColor: 'var(--accent-10)' }}
                    >
                      <RefreshCw size={18} />
                    </motion.button>
                  </div>
                ) : (
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
                )}
              </div>

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
                  <ProofreadResults
                    data={proofreadData}
                    animate={animateProofread}
                    onSelectionChange={setSelectedEditIndices}
                  />

                  {proofreadData.suggested_edits.length > 0 && (
                    <div className="mt-4">
                      <Button
                        size="fullWidth"
                        onClick={handleApplyEdits}
                        disabled={isAnyLoading}
                        className="flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={16} />
                        APPLY SELECTED EDITS
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </LiquidCard>
            </motion.div>
          </div>

          {/* Right Panel — Narrative Display */}
          <div className="flex-1 min-w-0">
            {/* Narrative card + rating card. Desktop (lg+): side by side, the
                narrative takes the remaining width and the rating card is a fixed
                narrow column pinned to the TOP of the row that hugs its own
                content (items-start), so a long narrative never leaves a tall
                empty card under the thumbs.
                Mobile: the rating card stacks BELOW the narrative, full width. */}
            <div className="flex flex-col lg:flex-row gap-4 lg:items-start">
              <div className="flex-1 min-w-0">
                <LiquidCard size="standard" className="h-full">
                  {/* Regenerating overlay */}
                  {isRegenerating && (
                    <div className="flex items-center justify-center py-12">
                      <LoadingSpinner size="medium" message="Regenerating narrative..." />
                    </div>
                  )}

                  {isRefining && (
                    <div className="flex items-center justify-center py-12">
                      <LoadingSpinner size="medium" message="Refining narrative..." />
                    </div>
                  )}

                  {isApplyingEdits && (
                    <div className="flex items-center justify-center py-12">
                      <LoadingSpinner size="medium" message="Applying suggested edits..." />
                    </div>
                  )}

                  {!isRegenerating && !isRefining && !isApplyingEdits && (
                    <NarrativeDisplay
                      narrative={state.narrative}
                      displayFormat={state.displayFormat}
                      animate={animateNarrative}
                      highlights={highlightRanges}
                      highlightActive={highlightActive}
                      issueDescriptions={issueDescriptions}
                    />
                  )}
                </LiquidCard>
              </div>

              {/* Rating card — same gating as before: only when a narrative exists
                  and no regenerate / refine / apply-edits is in flight. */}
              {state.narrative && !isRegenerating && !isRefining && !isApplyingEdits && (
                <LiquidCard size="compact" className="w-full lg:w-[240px] shrink-0">
                  <div className="flex items-center gap-2 text-[var(--text-primary)] font-semibold text-sm mb-3">
                    <Star size={16} className="text-[var(--accent-hover)]" />
                    RATE THIS STORY
                  </div>
                  <NarrativeFeedback
                    trackerId={state.trackerId}
                    storyType={state.storyType}
                    narrativeStyle={state.narrativeStyle}
                  />
                </LiquidCard>
              )}
            </div>

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
                {isSaving ? 'SAVING...' : state.isSaved ? '✓ SAVED' : 'SAVE STORY'}
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

              <Button
                variant="ghost"
                size="medium"
                onClick={() => setShowResetConfirm(true)}
                disabled={isAnyLoading}
                className="flex items-center gap-2"
              >
                <RotateCcw size={15} />
                NEW STORY
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
        onAutoSave={(updated) => {
          setNarrative(updated);
          autoSaveNarrative('auto_save', updated)
            .catch((err) => console.error('Auto-save from edit modal error:', err));
        }}
      />

      <ShareExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        narrative={state.narrative}
        displayFormat={state.displayFormat}
        trackerId={state.trackerId}
        vehicleInfo={{
          year: state.fieldValues['year'] || '',
          make: state.fieldValues['make'] || '',
          model: state.fieldValues['model'] || '',
          roNumber: state.roNumber || '',
        }}
        senderName={[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || profile?.username || ''}
        senderShortName={formatUserName(profile?.first_name, profile?.last_name)}
        storyType={state.storyType}
        narrativeStyle={state.narrativeStyle}
        onBeforeExport={handleBeforeExport}
      />

      {/* Start Over Confirmation */}
      <Modal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="Start Over?"
        width="max-w-[420px]"
      >
        <p className="text-[var(--text-secondary)] mb-6">
          Are you sure? All unsaved data will be lost.
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            size="medium"
            onClick={() => setShowResetConfirm(false)}
          >
            CANCEL
          </Button>
          <Button
            variant="primary"
            size="medium"
            onClick={handleStartOver}
          >
            START OVER
          </Button>
        </div>
      </Modal>

      {/* Unsaved Narrative Warning */}
      <Modal
        isOpen={showUnsavedModal}
        onClose={() => { setShowUnsavedModal(false); setPendingNavigation(null); }}
        title="Unsaved Narrative"
        width="max-w-[460px]"
      >
        <p className="text-[var(--text-secondary)] mb-6">
          You have an unsaved narrative. Once you leave this page, this story cannot be recovered.
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            size="medium"
            onClick={() => { setShowUnsavedModal(false); setPendingNavigation(null); }}
          >
            STAY ON PAGE
          </Button>
          <Button
            variant="primary"
            size="medium"
            onClick={handleConfirmLeave}
          >
            LEAVE WITHOUT SAVING
          </Button>
        </div>
      </Modal>

      {/* Post-save micro-survey — non-blocking bottom-corner popup */}
      <SurveyPopup question={surveyQuestion} onClose={() => setSurveyQuestion(null)} />
    </div>
  );
}
