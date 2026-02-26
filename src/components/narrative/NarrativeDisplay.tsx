'use client';

import { useState } from 'react';
import { useTypingAnimation } from '@/hooks/useTypingAnimation';
import type { NarrativeData } from '@/stores/narrativeStore';
import type { HighlightRange } from '@/lib/highlightUtils';

interface NarrativeDisplayProps {
  narrative: NarrativeData;
  displayFormat: 'block' | 'ccc';
  animate?: boolean;
  highlights?: HighlightRange[];
  highlightActive?: boolean;
  issueDescriptions?: string[];
}

/**
 * Render text with highlighted spans. Splits the text at highlight boundaries
 * and wraps matched segments in <mark> elements with pulsing animation.
 */
function HighlightedText({
  text,
  highlights,
  active,
  issueDescriptions,
}: {
  text: string;
  highlights: HighlightRange[];
  active: boolean;
  issueDescriptions?: string[];
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (highlights.length === 0) {
    return <>{text}</>;
  }

  const segments: React.ReactNode[] = [];
  let cursor = 0;

  for (const hl of highlights) {
    // Text before this highlight
    if (hl.start > cursor) {
      segments.push(text.slice(cursor, hl.start));
    }

    const highlightedText = text.slice(hl.start, hl.end);
    const tooltip = issueDescriptions?.[hl.issueIndex] || '';

    segments.push(
      <mark
        key={`hl-${hl.start}`}
        className="relative cursor-help"
        style={{
          background: 'var(--accent-30)',
          borderBottom: '2px solid var(--accent-primary)',
          borderRadius: '2px',
          padding: '0 1px',
          color: 'inherit',
          animation: active ? 'highlightPulse 2s ease-in-out infinite' : 'none',
          transition: 'opacity 1s ease-out',
          opacity: active ? 1 : 0,
        }}
        onMouseEnter={() => setHoveredIndex(hl.issueIndex)}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {highlightedText}
        {tooltip && hoveredIndex === hl.issueIndex && (
          <span
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs whitespace-normal max-w-[280px] pointer-events-none"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--accent-border)',
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-glow-sm)',
            }}
          >
            {tooltip}
          </span>
        )}
      </mark>,
    );

    cursor = hl.end;
  }

  // Remaining text after last highlight
  if (cursor < text.length) {
    segments.push(text.slice(cursor));
  }

  return <>{segments}</>;
}

/**
 * Build highlights scoped to a specific section of the narrative.
 * Since highlights are computed against the full narrative text (block_narrative),
 * for C/C/C format we need to find matching ranges within each individual section.
 */
function getSectionHighlights(
  sectionText: string,
  fullHighlights: HighlightRange[],
  fullText: string,
): HighlightRange[] {
  if (!fullHighlights.length) return [];

  const results: HighlightRange[] = [];
  const sectionLower = sectionText.toLowerCase();

  for (const hl of fullHighlights) {
    const highlightedSnippet = fullText.slice(hl.start, hl.end).toLowerCase();
    const idx = sectionLower.indexOf(highlightedSnippet);
    if (idx !== -1) {
      results.push({
        start: idx,
        end: idx + highlightedSnippet.length,
        issueIndex: hl.issueIndex,
      });
    }
  }

  return results;
}

export default function NarrativeDisplay({
  narrative,
  displayFormat,
  animate = false,
  highlights = [],
  highlightActive = false,
  issueDescriptions = [],
}: NarrativeDisplayProps) {
  const blockText = useTypingAnimation(narrative.block_narrative, {
    speed: 15,
    enabled: animate && displayFormat === 'block',
  });

  const concernText = useTypingAnimation(narrative.concern, {
    speed: 15,
    enabled: animate && displayFormat === 'ccc',
  });

  const causeText = useTypingAnimation(narrative.cause, {
    speed: 15,
    enabled: animate && displayFormat === 'ccc',
  });

  const correctionText = useTypingAnimation(narrative.correction, {
    speed: 15,
    enabled: animate && displayFormat === 'ccc',
  });

  const hasHighlights = highlights.length > 0;

  // For C/C/C format, compute per-section highlights from the block-level ranges
  const concernHighlights = hasHighlights
    ? getSectionHighlights(narrative.concern, highlights, narrative.block_narrative)
    : [];
  const causeHighlights = hasHighlights
    ? getSectionHighlights(narrative.cause, highlights, narrative.block_narrative)
    : [];
  const correctionHighlights = hasHighlights
    ? getSectionHighlights(narrative.correction, highlights, narrative.block_narrative)
    : [];

  if (displayFormat === 'block') {
    const isAnimating = animate && blockText.isAnimating;
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">
          Block Narrative
        </h3>
        <div className="bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg p-4 min-h-[200px]">
          <p className="text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap text-sm">
            {isAnimating ? (
              blockText.displayText
            ) : hasHighlights ? (
              <HighlightedText
                text={narrative.block_narrative}
                highlights={highlights}
                active={highlightActive}
                issueDescriptions={issueDescriptions}
              />
            ) : (
              narrative.block_narrative
            )}
          </p>
          {blockText.isAnimating && (
            <span className="inline-block w-0.5 h-4 bg-[var(--accent-hover)] animate-pulse ml-0.5 align-middle" />
          )}
        </div>
        {blockText.isAnimating && (
          <button
            onClick={blockText.skip}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            Skip animation
          </button>
        )}
      </div>
    );
  }

  const isAnyAnimating = animate && (concernText.isAnimating || causeText.isAnimating || correctionText.isAnimating);

  return (
    <div className="space-y-5">
      {/* Concern */}
      <div>
        <h3 className="text-sm font-medium text-[var(--accent-text-emphasis)] uppercase tracking-wide mb-2">
          Concern
        </h3>
        <div className="bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg p-4">
          <p className="text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap text-sm">
            {animate && concernText.isAnimating ? (
              concernText.displayText
            ) : concernHighlights.length > 0 ? (
              <HighlightedText
                text={narrative.concern}
                highlights={concernHighlights}
                active={highlightActive}
                issueDescriptions={issueDescriptions}
              />
            ) : (
              narrative.concern
            )}
          </p>
          {concernText.isAnimating && (
            <span className="inline-block w-0.5 h-4 bg-[var(--accent-hover)] animate-pulse ml-0.5 align-middle" />
          )}
        </div>
      </div>

      {/* Cause */}
      <div>
        <h3 className="text-sm font-medium text-[var(--accent-text-emphasis)] uppercase tracking-wide mb-2">
          Cause
        </h3>
        <div className="bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg p-4">
          <p className="text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap text-sm">
            {animate && causeText.isAnimating ? (
              causeText.displayText
            ) : causeHighlights.length > 0 ? (
              <HighlightedText
                text={narrative.cause}
                highlights={causeHighlights}
                active={highlightActive}
                issueDescriptions={issueDescriptions}
              />
            ) : (
              narrative.cause
            )}
          </p>
          {causeText.isAnimating && (
            <span className="inline-block w-0.5 h-4 bg-[var(--accent-hover)] animate-pulse ml-0.5 align-middle" />
          )}
        </div>
      </div>

      {/* Correction */}
      <div>
        <h3 className="text-sm font-medium text-[var(--accent-text-emphasis)] uppercase tracking-wide mb-2">
          Correction
        </h3>
        <div className="bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg p-4">
          <p className="text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap text-sm">
            {animate && correctionText.isAnimating ? (
              correctionText.displayText
            ) : correctionHighlights.length > 0 ? (
              <HighlightedText
                text={narrative.correction}
                highlights={correctionHighlights}
                active={highlightActive}
                issueDescriptions={issueDescriptions}
              />
            ) : (
              narrative.correction
            )}
          </p>
          {correctionText.isAnimating && (
            <span className="inline-block w-0.5 h-4 bg-[var(--accent-hover)] animate-pulse ml-0.5 align-middle" />
          )}
        </div>
      </div>

      {isAnyAnimating && (
        <button
          onClick={() => {
            concernText.skip();
            causeText.skip();
            correctionText.skip();
          }}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          Skip animation
        </button>
      )}
    </div>
  );
}
