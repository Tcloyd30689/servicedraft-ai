export interface HighlightRange {
  start: number;
  end: number;
  issueIndex: number;
}

/**
 * Find highlight ranges in narrative text matching the given snippets.
 * Case-insensitive matching. Overlapping ranges are merged.
 * Snippets that don't match are silently skipped.
 */
export function findHighlightRanges(
  narrativeText: string,
  snippets: string[],
): HighlightRange[] {
  const ranges: HighlightRange[] = [];
  const lowerText = narrativeText.toLowerCase();

  for (let i = 0; i < snippets.length; i++) {
    const snippet = snippets[i];
    if (!snippet) continue;

    const lowerSnippet = snippet.toLowerCase();
    const idx = lowerText.indexOf(lowerSnippet);
    if (idx === -1) continue;

    ranges.push({
      start: idx,
      end: idx + snippet.length,
      issueIndex: i,
    });
  }

  // Sort by start position
  ranges.sort((a, b) => a.start - b.start);

  // Merge overlapping ranges
  const merged: HighlightRange[] = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range.start <= last.end) {
      // Overlapping — extend the existing range, keep the first issueIndex
      last.end = Math.max(last.end, range.end);
    } else {
      merged.push({ ...range });
    }
  }

  return merged;
}
