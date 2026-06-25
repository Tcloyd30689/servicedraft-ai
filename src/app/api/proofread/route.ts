import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWithGemini, parseJsonResponse } from '@/lib/gemini/client';
import { buildProofreadSystemPrompt } from '@/constants/prompts';
import { logTokenUsage } from '@/lib/usageLogger';

interface RawProofreadResponse {
  flagged_issues: string[];
  suggested_edits: string[];
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

    return NextResponse.json({
      flagged_issues: parsedIssues,
      suggested_edits: parsed.suggested_edits,
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
