'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useTypingAnimation } from '@/hooks/useTypingAnimation';
import { useNarrativeStore } from '@/stores/narrativeStore';
import ProofreadSuggestionFeedback, {
  type SuggestionRating,
} from '@/components/narrative/ProofreadSuggestionFeedback';
import ProofreadFeedbackModal from '@/components/narrative/ProofreadFeedbackModal';
import { normalizeProofreadIssueCategory } from '@/constants/proofreadCategories';

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

interface ProofreadResultsProps {
  data: ProofreadData;
  animate?: boolean;
  onSelectionChange?: (selectedIndices: number[]) => void;
}

/** Per-run vote state. A new proofread run (new `data` identity) gets a fresh id and no votes. */
interface FeedbackRun {
  data: ProofreadData;
  runId: string;
  votes: Record<number, SuggestionRating>;
}

/** Matches the server-side truncation in /api/proofread-feedback. */
const MAX_SUGGESTION_TEXT_LENGTH = 2000;

function newRunId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // RFC 4122 v4-shaped fallback for environments without crypto.randomUUID.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function makeRun(data: ProofreadData): FeedbackRun {
  return { data, runId: newRunId(), votes: {} };
}

export default function ProofreadResults({
  data,
  animate = false,
  onSelectionChange,
}: ProofreadResultsProps) {
  const { state } = useNarrativeStore();

  const [checkedEdits, setCheckedEdits] = useState<boolean[]>(
    () => new Array(data.suggested_edits.length).fill(false)
  );

  // Thumbs votes are tied to the identity of the incoming proofread data.
  // "Adjust state when a prop changes" pattern: when page.tsx hands us a new
  // proofread result, mint a new run id and clear every vote before painting.
  const [run, setRun] = useState<FeedbackRun>(() => makeRun(data));
  if (run.data !== data) {
    setRun(makeRun(data));
  }

  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [feedbackIndex, setFeedbackIndex] = useState<number | null>(null);
  const [isSavingComment, setIsSavingComment] = useState(false);

  const issuesText = useTypingAnimation(
    data.flagged_issues.length > 0
      ? data.flagged_issues.map((item, i) => `${i + 1}. ${item.issue}`).join('\n')
      : 'No issues found.',
    { speed: 10, enabled: animate },
  );

  // Notify parent of selection changes AFTER render via useEffect
  useEffect(() => {
    if (onSelectionChange) {
      const indices = checkedEdits.reduce<number[]>((acc, checked, i) => {
        if (checked) acc.push(i);
        return acc;
      }, []);
      onSelectionChange(indices);
    }
  }, [checkedEdits, onSelectionChange]);

  // Reset checkboxes when data changes
  useEffect(() => {
    setCheckedEdits(new Array(data.suggested_edits.length).fill(false));
  }, [data.suggested_edits]);

  const toggleEdit = (index: number) => {
    setCheckedEdits(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const allChecked = checkedEdits.length > 0 && checkedEdits.every(Boolean);

  const toggleAll = () => {
    const newState = !allChecked;
    setCheckedEdits(new Array(data.suggested_edits.length).fill(newState));
  };

  /**
   * POST one vote. A feedback failure must never throw into the page — it
   * toasts and logs, same contract as NarrativeFeedback. issue_type is the
   * fixed-list category KEY for the issue at this index (e.g.
   * 'missing_verification'), never the free-text issue sentence, so the
   * Insights "By issue type" chart can aggregate across runs. Old payloads
   * without issue_categories fall back to 'other'.
   */
  const sendSuggestionFeedback = async (
    index: number,
    rating: SuggestionRating,
    comment?: string,
  ): Promise<boolean> => {
    const suggestion = data.suggested_edits[index] ?? '';
    const issueType = normalizeProofreadIssueCategory(data.issue_categories?.[index]);
    const trimmedComment = comment?.trim() ?? '';

    try {
      const response = await fetch('/api/proofread-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proofread_run_id: run.runId,
          suggestion_index: index,
          rating,
          suggestion_text: suggestion.slice(0, MAX_SUGGESTION_TEXT_LENGTH),
          issue_type: issueType,
          comment: trimmedComment.length > 0 ? trimmedComment : null,
          tracker_id: state.trackerId,
          story_type: state.storyType,
          narrative_style: state.narrativeStyle,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || 'Failed to save feedback');
      }

      return true;
    } catch (err) {
      console.error('Proofread suggestion feedback save failed:', err);
      toast.error('Could not save your feedback', { id: 'proofread-feedback' });
      return false;
    }
  };

  const handleVote = async (index: number, rating: SuggestionRating) => {
    if (savingIndex !== null) return;

    // Paint the selection immediately; votes persist for this proofread run.
    setRun(prev => ({ ...prev, votes: { ...prev.votes, [index]: rating } }));

    // Thumbs down opens the comment modal on top of the recorded vote.
    if (rating === 'down') setFeedbackIndex(index);

    setSavingIndex(index);
    const ok = await sendSuggestionFeedback(index, rating);
    setSavingIndex(null);

    if (ok && rating === 'up') {
      toast.success('Thanks for the feedback', { id: 'proofread-feedback' });
    }
  };

  const handleSubmitComment = async (comment: string) => {
    if (feedbackIndex === null) return;

    setIsSavingComment(true);
    const ok = await sendSuggestionFeedback(feedbackIndex, 'down', comment);
    setIsSavingComment(false);

    if (ok) {
      toast.success('Thanks for the feedback', { id: 'proofread-feedback' });
      setFeedbackIndex(null);
    }
  };

  const closeFeedbackModal = () => {
    if (isSavingComment) return;
    setFeedbackIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Audit summary — Inter for readability. The rating is shown by the result stamp above. */}
      <p className="font-data text-[var(--text-secondary)] text-sm leading-relaxed">{data.summary}</p>

      {/* Flagged Issues */}
      <div>
        <h4 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-2">
          Flagged Issues
        </h4>
        <div className="bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg p-3 min-h-[60px]">
          <p className="text-[var(--text-primary)] text-sm whitespace-pre-wrap leading-relaxed">
            {animate ? issuesText.displayText : (
              data.flagged_issues.length > 0
                ? data.flagged_issues.map((item, i) => `${i + 1}. ${item.issue}`).join('\n')
                : 'No issues found.'
            )}
          </p>
        </div>
      </div>

      {/* Suggested Edits with Checkboxes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">
            Suggested Edits
          </h4>
          {data.suggested_edits.length > 0 && (
            <button
              onClick={toggleAll}
              className="text-xs font-medium px-2 py-1 rounded transition-colors"
              style={{
                color: 'var(--accent-bright)',
                backgroundColor: 'var(--accent-10)',
              }}
            >
              {allChecked ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>
        <div className="bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg p-3 min-h-[60px]">
          {data.suggested_edits.length > 0 ? (
            <div className="space-y-2">
              {data.suggested_edits.map((edit, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 group rounded-md p-2 -mx-1 transition-colors hover:bg-[var(--accent-5)]"
                >
                  {/* The label wraps ONLY the checkbox + text, so the thumbs beside it
                      never toggle the apply-edit selection. */}
                  <label className="flex items-start gap-3 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={checkedEdits[i] || false}
                      onChange={() => toggleEdit(i)}
                      className="mt-0.5 h-4 w-4 rounded border-2 cursor-pointer shrink-0 accent-[var(--accent-hover)]"
                      style={{
                        accentColor: 'var(--accent-hover)',
                      }}
                    />
                    <span className="text-[var(--text-primary)] text-sm leading-relaxed">
                      {i + 1}. {edit}
                    </span>
                  </label>

                  <ProofreadSuggestionFeedback
                    index={i}
                    rating={run.votes[i] ?? null}
                    disabled={savingIndex !== null && savingIndex !== i}
                    onVote={handleVote}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[var(--text-primary)] text-sm">No edits suggested.</p>
          )}
        </div>
      </div>

      <ProofreadFeedbackModal
        isOpen={feedbackIndex !== null}
        suggestionIndex={feedbackIndex}
        suggestionText={feedbackIndex !== null ? data.suggested_edits[feedbackIndex] ?? '' : ''}
        isSaving={isSavingComment}
        onSubmit={handleSubmitComment}
        onClose={closeFeedbackModal}
      />
    </div>
  );
}
