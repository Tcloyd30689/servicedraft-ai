import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWithGemini, parseJsonResponse } from '@/lib/gemini/client';
import { buildProofreadSystemPrompt } from '@/constants/prompts';
import {
  normalizeProofreadIssueCategory,
  type ProofreadIssueCategory,
} from '@/constants/proofreadCategories';
import { logTokenUsage } from '@/lib/usageLogger';

interface RawProofreadResponse {
  flagged_issues: string[];
  suggested_edits: string[];
  /** Fixed-list category key per flagged issue (same index). Optional: older model output omits it. */
  issue_categories?: unknown;
  overall_rating: 'PASS' | 'NEEDS_REVIEW' | 'FAIL';
  summary: string;
}

interface ParsedIssue {
  issue: string;
  snippet: string;
}

function extractSnippet(issueText: string): ParsedIssue {
  const match = issueText.match(/\[\[(.+?)\]\]/);
  const snippet = match ? match[1].trim() : '';
  const issue = issueText.replace(/\[\[.*?\]\]/, '').trim();
  return { issue, snippet };
}

/**
 * Build the issue_categories array aligned by index with the flagged issues /
 * suggested edits. Defensive on purpose: a missing array, a non-array, a short
 * array, or an unknown key all degrade to 'other' rather than failing the run.
 */
function alignIssueCategories(raw: unknown, count: number): ProofreadIssueCategory[] {
  const list = Array.isArray(raw) ? raw : [];
  const out: ProofreadIssueCategory[] = [];
  for (let i = 0; i < count; i++) {
    out.push(normalizeProofreadIssueCategory(list[i]));
  }
  return out;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { concern, cause, correction, storyType, year, make, model, originalInputContext, narrativeStyle } = await request.json();

    if (!concern || !cause || !correction) {
      return NextResponse.json(
        { error: 'Missing narrative text' },
        { status: 400 },
      );
    }

    const isDiagnosticOnly = storyType === 'diagnostic_only';

    const systemPrompt = buildProofreadSystemPrompt(narrativeStyle, storyType);

    const inputContextBlock = originalInputContext
      ? `\nORIGINAL INPUT CONTEXT (from input page — flag any mismatches between these facts and the narrative):\n---\n${originalInputContext}\n---\n`
      : '';

    const styleLabel =
      narrativeStyle === 'customer_pay'
        ? 'Customer Pay'
        : narrativeStyle === 'extended_warranty'
          ? 'Extended Warranty'
          : 'Manufacturer Warranty';

    const userPrompt = `Review the following automotive repair narrative and return your structured feedback exactly as specified in your instructions.

NARRATIVE STYLE: ${styleLabel}
STORY TYPE: ${isDiagnosticOnly ? 'Diagnostic Only' : 'Repair Complete'}
VEHICLE: ${year || ''} ${make || ''} ${model || ''}
${inputContextBlock}
NARRATIVE TO REVIEW:
---
CONCERN: ${concern}

CAUSE: ${cause}

CORRECTION: ${correction}
---`;

    const geminiResult = await generateWithGemini(systemPrompt, userPrompt);
    const parsed = parseJsonResponse<RawProofreadResponse>(geminiResult.text);

    // Fire-and-forget token usage logging
    logTokenUsage(user.id, 'proofread', geminiResult.usage);

    if (!parsed.overall_rating || !parsed.summary) {
      throw new Error('Response missing required keys');
    }

    // Ensure arrays exist
    const rawIssues = parsed.flagged_issues || [];
    parsed.suggested_edits = parsed.suggested_edits || [];

    // Extract [[snippet]] from each flagged issue
    const parsedIssues: ParsedIssue[] = rawIssues.map(extractSnippet);

    // One fixed-list category per issue, aligned by index with both arrays.
    // Backward compatible: old-shape model output (no issue_categories) -> 'other'.
    const issueCategories = alignIssueCategories(
      parsed.issue_categories,
      Math.max(parsedIssues.length, parsed.suggested_edits.length),
    );

    return NextResponse.json({
      flagged_issues: parsedIssues,
      suggested_edits: parsed.suggested_edits,
      issue_categories: issueCategories,
      overall_rating: parsed.overall_rating,
      summary: parsed.summary,
    });
  } catch (error) {
    console.error('Proofread narrative error:', error);
    return NextResponse.json(
      { error: 'Failed to proofread narrative. Please try again.' },
      { status: 500 },
    );
  }
}
