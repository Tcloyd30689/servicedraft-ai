'use client';

import { useEffect, useRef, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
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
 * Copy plain text to the clipboard. Prefers the async Clipboard API and falls
 * back to a hidden textarea + execCommand for older/insecure contexts.
 */
async function copyPlainText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Small copy-to-clipboard icon button pinned to the top-right of a narrative
 * field, like the copy control on a code block. Copies the FULL plain text of
 * the field (never the partially-typed animation text) and swaps to a check
 * mark for ~1.5s after a successful copy.
 */
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = async () => {
    const ok = await copyPlainText(text);
    if (!ok) {
      toast.error('Could not copy to clipboard', { id: 'narrative-copy' });
      return;
    }
    setCopied(true);
    toast.success('Copied', { id: 'narrative-copy' });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? 'Copied' : label}
      aria-label={label}
      aria-live="polite"
      className="absolute top-2 right-2 z-10 inline-flex items-center justify-center h-7 w-7 rounded-md border border-transparent text-[var(--text-secondary)] hover:text-[var(--accent-bright)] hover:border-[var(--accent-border)] hover:bg-[var(--accent-10)] transition-colors cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-bright)]"
      style={copied ? { color: 'var(--accent-bright)' } : undefined}
    >
      {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
    </button>
  );
}

/**
 * Render text with highlighted spans. Splits the text at highlight boundaries
 * and wraps matched segments in <mark> elements with hover tooltips.
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
          transition: 'opacity 1s ease-out',
          opacity: active ? 1 : 0,
        }}
        onMouseEnter={() => setHoveredIndex(hl.issueIndex)}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {highlightedText}
        {tooltip && hoveredIndex === hl.issueIndex && (
          <span
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-3 rounded-lg text-xs whitespace-normal min-w-[300px] max-w-[440px] pointer-events-none"
            style={{
              background: 'var(--bg-modal)',
              border: '1px solid var(--accent-primary)',
              color: 'var(--text-primary)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.9)',
              opacity: 1,
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

/**
 * One narrative text field: the bordered box, its copy button, the typing
 * cursor, and the plain / animating / highlighted text body.
 */
function NarrativeField({
  label,
  fullText,
  displayText,
  isAnimating,
  highlights,
  highlightActive,
  issueDescriptions,
  minHeightClass,
}: {
  label: string;
  fullText: string;
  displayText: string;
  isAnimating: boolean;
  highlights: HighlightRange[];
  highlightActive: boolean;
  issueDescriptions: string[];
  minHeightClass?: string;
}) {
  return (
    <div
      className={`relative bg-[var(--bg-input)] border border-[var(--accent-border)] rounded-lg p-4 pr-12 ${minHeightClass ?? ''}`}
    >
      <CopyButton text={fullText} label={`Copy ${label}`} />
      <p className="font-data text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap text-sm">
        {isAnimating ? (
          displayText
        ) : highlights.length > 0 ? (
          <HighlightedText
            text={fullText}
            highlights={highlights}
            active={highlightActive}
            issueDescriptions={issueDescriptions}
          />
        ) : (
          fullText
        )}
      </p>
      {isAnimating && (
        <span className="inline-block w-0.5 h-4 bg-[var(--accent-hover)] animate-pulse ml-0.5 align-middle" />
      )}
    </div>
  );
}

/**
 * 'Skip animation' control, pinned to the top-right corner of the whole
 * narrative container (NOT the per-field copy buttons, which live inside each
 * field box). Only rendered while a typing animation is running.
 */
function SkipAnimationButton({ onSkip }: { onSkip: () => void }) {
  return (
    <button
      type="button"
      onClick={onSkip}
      aria-label="Skip animation"
      className="absolute top-0 right-0 z-10 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
    >
      Skip animation
    </button>
  );
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
    speed: 7,
    enabled: animate && displayFormat === 'block',
  });

  const concernText = useTypingAnimation(narrative.concern, {
    speed: 7,
    enabled: animate && displayFormat === 'ccc',
  });

  const causeText = useTypingAnimation(narrative.cause, {
    speed: 7,
    enabled: animate && displayFormat === 'ccc',
  });

  const correctionText = useTypingAnimation(narrative.correction, {
    speed: 7,
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
      <div className="relative space-y-4">
        {isAnimating && <SkipAnimationButton onSkip={blockText.skip} />}
        <h3 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide pr-28">
          Block Narrative
        </h3>
        <NarrativeField
          label="BLOCK NARRATIVE"
          fullText={narrative.block_narrative}
          displayText={blockText.displayText}
          isAnimating={isAnimating}
          highlights={hasHighlights ? highlights : []}
          highlightActive={highlightActive}
          issueDescriptions={issueDescriptions}
          minHeightClass="min-h-[200px]"
        />
      </div>
    );
  }

  const isConcernAnimating = animate && concernText.isAnimating;
  const isCauseAnimating = animate && causeText.isAnimating;
  const isCorrectionAnimating = animate && correctionText.isAnimating;
  const isAnyAnimating = isConcernAnimating || isCauseAnimating || isCorrectionAnimating;

  const skipAll = () => {
    concernText.skip();
    causeText.skip();
    correctionText.skip();
  };

  return (
    <div className="relative space-y-5">
      {isAnyAnimating && <SkipAnimationButton onSkip={skipAll} />}

      {/* Concern */}
      <div>
        <h3 className="text-sm font-medium text-[var(--accent-text-emphasis)] uppercase tracking-wide mb-2 pr-28">
          Concern
        </h3>
        <NarrativeField
          label="CONCERN"
          fullText={narrative.concern}
          displayText={concernText.displayText}
          isAnimating={isConcernAnimating}
          highlights={concernHighlights}
          highlightActive={highlightActive}
          issueDescriptions={issueDescriptions}
        />
      </div>

      {/* Cause */}
      <div>
        <h3 className="text-sm font-medium text-[var(--accent-text-emphasis)] uppercase tracking-wide mb-2">
          Cause
        </h3>
        <NarrativeField
          label="CAUSE"
          fullText={narrative.cause}
          displayText={causeText.displayText}
          isAnimating={isCauseAnimating}
          highlights={causeHighlights}
          highlightActive={highlightActive}
          issueDescriptions={issueDescriptions}
        />
      </div>

      {/* Correction */}
      <div>
        <h3 className="text-sm font-medium text-[var(--accent-text-emphasis)] uppercase tracking-wide mb-2">
          Correction
        </h3>
        <NarrativeField
          label="CORRECTION"
          fullText={narrative.correction}
          displayText={correctionText.displayText}
          isAnimating={isCorrectionAnimating}
          highlights={correctionHighlights}
          highlightActive={highlightActive}
          issueDescriptions={issueDescriptions}
        />
      </div>
    </div>
  );
}
