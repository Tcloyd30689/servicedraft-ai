'use client';

import { useTypingAnimation } from '@/hooks/useTypingAnimation';

interface ProofreadData {
  flagged_issues: string[];
  suggested_edits: string[];
  overall_rating: 'PASS' | 'NEEDS_REVIEW' | 'FAIL';
  summary: string;
}

interface ProofreadResultsProps {
  data: ProofreadData;
  animate?: boolean;
}

const ratingConfig = {
  PASS: { color: 'bg-green-600', textColor: 'text-green-400', label: 'PASS' },
  NEEDS_REVIEW: { color: 'bg-yellow-600', textColor: 'text-yellow-400', label: 'NEEDS REVIEW' },
  FAIL: { color: 'bg-red-600', textColor: 'text-red-400', label: 'FAIL' },
};

export default function ProofreadResults({
  data,
  animate = false,
}: ProofreadResultsProps) {
  const issuesText = useTypingAnimation(
    data.flagged_issues.length > 0
      ? data.flagged_issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')
      : 'No issues found.',
    { speed: 10, enabled: animate },
  );

  const editsText = useTypingAnimation(
    data.suggested_edits.length > 0
      ? data.suggested_edits.map((edit, i) => `${i + 1}. ${edit}`).join('\n')
      : 'No edits suggested.',
    { speed: 10, enabled: animate },
  );

  const rating = ratingConfig[data.overall_rating];

  return (
    <div className="space-y-4">
      {/* Rating Badge */}
      <div className="flex items-center gap-3">
        <span className={`${rating.color} text-white text-xs font-bold px-3 py-1 rounded-full`}>
          {rating.label}
        </span>
        <span className="text-[var(--text-secondary)] text-sm">{data.summary}</span>
      </div>

      {/* Flagged Issues */}
      <div>
        <h4 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-2">
          Flagged Issues
        </h4>
        <div className="bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg p-3 min-h-[60px]">
          <p className="text-[var(--text-primary)] text-sm whitespace-pre-wrap leading-relaxed">
            {animate ? issuesText.displayText : (
              data.flagged_issues.length > 0
                ? data.flagged_issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')
                : 'No issues found.'
            )}
          </p>
        </div>
      </div>

      {/* Suggested Edits */}
      <div>
        <h4 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-2">
          Suggested Edits
        </h4>
        <div className="bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg p-3 min-h-[60px]">
          <p className="text-[var(--text-primary)] text-sm whitespace-pre-wrap leading-relaxed">
            {animate ? editsText.displayText : (
              data.suggested_edits.length > 0
                ? data.suggested_edits.map((edit, i) => `${i + 1}. ${edit}`).join('\n')
                : 'No edits suggested.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
