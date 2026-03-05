'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTypingAnimation } from '@/hooks/useTypingAnimation';

interface ParsedIssue {
  issue: string;
  snippet: string;
}

interface ProofreadData {
  flagged_issues: ParsedIssue[];
  suggested_edits: string[];
  overall_rating: 'PASS' | 'NEEDS_REVIEW' | 'FAIL';
  summary: string;
}

interface ProofreadResultsProps {
  data: ProofreadData;
  animate?: boolean;
  onSelectionChange?: (selectedIndices: number[]) => void;
}

const ratingConfig = {
  PASS: { color: 'bg-green-600', textColor: 'text-green-400', label: 'PASS' },
  NEEDS_REVIEW: { color: 'bg-yellow-600', textColor: 'text-yellow-400', label: 'NEEDS REVIEW' },
  FAIL: { color: 'bg-red-600', textColor: 'text-red-400', label: 'FAIL' },
};

export default function ProofreadResults({
  data,
  animate = false,
  onSelectionChange,
}: ProofreadResultsProps) {
  const [checkedEdits, setCheckedEdits] = useState<boolean[]>(
    () => new Array(data.suggested_edits.length).fill(false)
  );

  const issuesText = useTypingAnimation(
    data.flagged_issues.length > 0
      ? data.flagged_issues.map((item, i) => `${i + 1}. ${item.issue}`).join('\n')
      : 'No issues found.',
    { speed: 10, enabled: animate },
  );

  // Notify parent of selection changes
  const notifyParent = useCallback((checks: boolean[]) => {
    if (onSelectionChange) {
      const indices = checks.reduce<number[]>((acc, checked, i) => {
        if (checked) acc.push(i);
        return acc;
      }, []);
      onSelectionChange(indices);
    }
  }, [onSelectionChange]);

  // Reset checkboxes when data changes
  useEffect(() => {
    const fresh = new Array(data.suggested_edits.length).fill(false);
    setCheckedEdits(fresh);
    notifyParent(fresh);
  }, [data.suggested_edits, notifyParent]);

  const toggleEdit = (index: number) => {
    setCheckedEdits(prev => {
      const next = [...prev];
      next[index] = !next[index];
      notifyParent(next);
      return next;
    });
  };

  const allChecked = checkedEdits.length > 0 && checkedEdits.every(Boolean);

  const toggleAll = () => {
    const newState = !allChecked;
    const next = new Array(data.suggested_edits.length).fill(newState);
    setCheckedEdits(next);
    notifyParent(next);
  };

  const rating = ratingConfig[data.overall_rating];

  return (
    <div className="space-y-4">
      {/* Rating Badge */}
      <div className="flex items-center gap-3">
        <span className={`${rating.color} text-white text-xs font-bold px-3 py-1 rounded-full`}>
          {rating.label}
        </span>
        <span className="font-data text-[var(--text-secondary)] text-sm">{data.summary}</span>
      </div>

      {/* Flagged Issues */}
      <div>
        <h4 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-2">
          Flagged Issues
        </h4>
        <div className="bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg p-3 min-h-[60px]">
          <p className="font-data text-[var(--text-primary)] text-sm whitespace-pre-wrap leading-relaxed">
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
                <label
                  key={i}
                  className="flex items-start gap-3 cursor-pointer group rounded-md p-2 -mx-1 transition-colors hover:bg-[var(--accent-5)]"
                >
                  <input
                    type="checkbox"
                    checked={checkedEdits[i] || false}
                    onChange={() => toggleEdit(i)}
                    className="mt-0.5 h-4 w-4 rounded border-2 cursor-pointer shrink-0 accent-[var(--accent-hover)]"
                    style={{
                      accentColor: 'var(--accent-hover)',
                    }}
                  />
                  <span className="font-data text-[var(--text-primary)] text-sm leading-relaxed">
                    {i + 1}. {edit}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-[var(--text-primary)] text-sm">No edits suggested.</p>
          )}
        </div>
      </div>
    </div>
  );
}
