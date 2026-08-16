'use client';

/**
 * Sprint A-3 — minimal markdown renderer for the AI insights report.
 *
 * WHY HAND-ROLLED: this repo ships no markdown library (no react-markdown /
 * marked / markdown-it / remark / rehype), and raw-HTML injection is not an
 * accepted pattern here. So this parses the text into blocks and builds REAL
 * React elements — no HTML injection, no new dependency.
 *
 * The Gemini prompt behind /api/admin/insights/report is hard-constrained to
 * emit only this subset:
 *   ## Heading, ### Heading, blank-line-separated paragraphs,
 *   `- item` bullets, `1. item` numbers, and **bold** inline.
 *
 * The model can still misbehave, so every unrecognised line degrades to a
 * plain paragraph rather than vanishing or throwing.
 */

import { type ReactNode } from 'react';

type Block =
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] };

/** `# H` … `###### H`. Level 1 and 2 render as h2, anything deeper as h3. */
const HEADING_RE = /^(#{1,6})\s+(.*)$/;
/** `- item` or `* item`. `**bold**` cannot match: `*` must be followed by space. */
const BULLET_RE = /^[-*]\s+(.*)$/;
/** `1. item` or `1) item`. */
const ORDERED_RE = /^\d+[.)]\s+(.*)$/;
/** Non-greedy so several spans on one line each close at their own `**`. */
const BOLD_RE = /\*\*([\s\S]+?)\*\*/g;

/**
 * Splits raw markdown into an ordered list of blocks.
 *
 * Consecutive bullet (or numbered) lines collapse into ONE list; a blank line
 * or any other block type closes it. Consecutive plain lines join into a
 * single paragraph, which is what the blank-line-separated convention means.
 */
function parseBlocks(markdown: string): Block[] {
  const blocks: Block[] = [];

  // Open accumulators. At most one is non-empty at any moment.
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let listKind: 'ul' | 'ol' | null = null;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const text = paragraph.join(' ').trim();
    if (text) blocks.push({ kind: 'p', text });
    paragraph = [];
  };

  const flushList = () => {
    if (!listKind || listItems.length === 0) {
      listItems = [];
      listKind = null;
      return;
    }
    blocks.push({ kind: listKind, items: listItems });
    listItems = [];
    listKind = null;
  };

  const flushAll = () => {
    flushParagraph();
    flushList();
  };

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();

    // Blank line — closes whatever is open.
    if (line.length === 0) {
      flushAll();
      continue;
    }

    const heading = HEADING_RE.exec(line);
    if (heading) {
      flushAll();
      const text = heading[2].trim();
      // A stray level-1 `#` is promoted to h2 rather than dropped, so the
      // report never silently loses its title.
      if (text) blocks.push({ kind: heading[1].length <= 2 ? 'h2' : 'h3', text });
      continue;
    }

    const bullet = BULLET_RE.exec(line);
    if (bullet) {
      flushParagraph();
      if (listKind !== 'ul') flushList();
      listKind = 'ul';
      listItems.push(bullet[1].trim());
      continue;
    }

    const ordered = ORDERED_RE.exec(line);
    if (ordered) {
      flushParagraph();
      if (listKind !== 'ol') flushList();
      listKind = 'ol';
      listItems.push(ordered[1].trim());
      continue;
    }

    // Anything else — including `---`, tables, code fences or plain prose —
    // is kept verbatim as paragraph text.
    flushList();
    paragraph.push(line);
  }

  flushAll();
  return blocks;
}

/**
 * Turns `**bold**` spans into <strong> nodes.
 *
 * An unmatched `**` never matches (the pattern needs a closing pair), so the
 * raw text is returned untouched instead of eating the rest of the line.
 */
function renderInline(text: string, keyPrefix: string): ReactNode {
  BOLD_RE.lastIndex = 0;
  const parts: ReactNode[] = [];
  let cursor = 0;
  let index = 0;
  let match: RegExpExecArray | null;

  while ((match = BOLD_RE.exec(text)) !== null) {
    if (match.index > cursor) parts.push(text.slice(cursor, match.index));
    parts.push(
      <strong key={`${keyPrefix}-b${index}`} className="font-semibold text-[var(--text-primary)]">
        {match[1]}
      </strong>,
    );
    cursor = match.index + match[0].length;
    index += 1;
  }

  if (parts.length === 0) return text;
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

interface MarkdownReportProps {
  markdown: string;
}

export default function MarkdownReport({ markdown }: MarkdownReportProps) {
  // Empty or whitespace-only renders nothing — the caller owns the empty state.
  if (typeof markdown !== 'string' || markdown.trim().length === 0) return null;

  const blocks = parseBlocks(markdown);
  if (blocks.length === 0) return null;

  return (
    <div className="space-y-3 text-[var(--text-secondary)] text-sm leading-relaxed">
      {blocks.map((block, i) => {
        const key = `block-${i}`;

        if (block.kind === 'h2') {
          return (
            <h2 key={key} className="text-lg font-semibold text-[var(--text-primary)] pt-2">
              {renderInline(block.text, key)}
            </h2>
          );
        }

        if (block.kind === 'h3') {
          return (
            <h3 key={key} className="text-base font-semibold text-[var(--text-primary)] pt-1">
              {renderInline(block.text, key)}
            </h3>
          );
        }

        if (block.kind === 'ul') {
          return (
            <ul key={key} className="list-disc pl-5 space-y-1.5 text-[var(--text-secondary)]">
              {block.items.map((item, j) => (
                <li key={`${key}-i${j}`}>{renderInline(item, `${key}-i${j}`)}</li>
              ))}
            </ul>
          );
        }

        if (block.kind === 'ol') {
          return (
            <ol key={key} className="list-decimal pl-5 space-y-1.5 text-[var(--text-secondary)]">
              {block.items.map((item, j) => (
                <li key={`${key}-i${j}`}>{renderInline(item, `${key}-i${j}`)}</li>
              ))}
            </ol>
          );
        }

        return (
          <p key={key} className="text-[var(--text-secondary)]">
            {renderInline(block.text, key)}
          </p>
        );
      })}
    </div>
  );
}
