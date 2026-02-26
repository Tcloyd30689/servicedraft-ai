import { NextResponse } from 'next/server';
import { generateWithGemini, parseJsonResponse } from '@/lib/gemini/client';
import { PROOFREAD_SYSTEM_PROMPT } from '@/constants/prompts';

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
    const { concern, cause, correction, storyType, year, make, model } = await request.json();

    if (!concern || !cause || !correction) {
      return NextResponse.json(
        { error: 'Missing narrative text' },
        { status: 400 },
      );
    }

    const userPrompt = `Review the following warranty narrative for audit compliance issues. Identify any language, missing information, or structural problems that could cause this claim to be flagged or rejected during a manufacturer warranty audit.

STORY TYPE: ${storyType === 'diagnostic_only' ? 'Diagnostic Only' : 'Repair Complete'}
VEHICLE: ${year || ''} ${make || ''} ${model || ''}

NARRATIVE TO REVIEW:
---
CONCERN: ${concern}

CAUSE: ${cause}

CORRECTION: ${correction}
---`;

    const rawResponse = await generateWithGemini(PROOFREAD_SYSTEM_PROMPT, userPrompt);
    const parsed = parseJsonResponse<RawProofreadResponse>(rawResponse);

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
