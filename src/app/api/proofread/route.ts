import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWithGemini, parseJsonResponse } from '@/lib/gemini/client';
import { PROOFREAD_SYSTEM_PROMPT, DIAGNOSTIC_ONLY_PROOFREAD_SYSTEM_PROMPT, AUDIT_STYLE_MODIFIERS } from '@/constants/prompts';

const VALID_AUDIT_STYLES = ['customer_pay', 'extended_warranty', 'manufacturer_warranty'];
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

    // Validate the requested audit style and default to manufacturer_warranty
    // when missing or invalid (frontend not yet updated this sprint).
    const auditStyle = VALID_AUDIT_STYLES.includes(narrativeStyle)
      ? narrativeStyle
      : 'manufacturer_warranty';

    const baseSystemPrompt = isDiagnosticOnly
      ? DIAGNOSTIC_ONLY_PROOFREAD_SYSTEM_PROMPT
      : PROOFREAD_SYSTEM_PROMPT;

    // Append the selected audit style modifier so the AI judges the narrative
    // against how it will be used (customer pay vs. extended vs. manufacturer).
    const systemPrompt = baseSystemPrompt + '\n\n' + AUDIT_STYLE_MODIFIERS[auditStyle];

    const inputContextBlock = originalInputContext
      ? `\nORIGINAL INPUT CONTEXT (from input page — flag any mismatches between these facts and the narrative):\n---\n${originalInputContext}\n---\n`
      : '';

    const userPrompt = isDiagnosticOnly
      ? `Review the following diagnostic-only narrative for strength, clarity, and authorization-readiness. This is a diagnosis-only scenario — the repair has NOT been performed yet. Evaluate whether this narrative is detailed and compelling enough to support repair authorization from a manufacturer, extended warranty company, or customer approval.

STORY TYPE: Diagnostic Only
VEHICLE: ${year || ''} ${make || ''} ${model || ''}
${inputContextBlock}
NARRATIVE TO REVIEW:
---
CONCERN: ${concern}

CAUSE: ${cause}

CORRECTION: ${correction}
---`
      : `Review the following warranty narrative for audit compliance issues. Identify any language, missing information, or structural problems that could cause this claim to be flagged or rejected during a manufacturer warranty audit.

STORY TYPE: Repair Complete
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
