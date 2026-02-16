import { NextResponse } from 'next/server';
import { generateWithGemini, parseJsonResponse } from '@/lib/gemini/client';
import { PROOFREAD_SYSTEM_PROMPT } from '@/constants/prompts';

interface ProofreadResponse {
  flagged_issues: string[];
  suggested_edits: string[];
  overall_rating: 'PASS' | 'NEEDS_REVIEW' | 'FAIL';
  summary: string;
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
    const parsed = parseJsonResponse<ProofreadResponse>(rawResponse);

    if (!parsed.overall_rating || !parsed.summary) {
      throw new Error('Response missing required keys');
    }

    // Ensure arrays exist
    parsed.flagged_issues = parsed.flagged_issues || [];
    parsed.suggested_edits = parsed.suggested_edits || [];

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Proofread narrative error:', error);
    return NextResponse.json(
      { error: 'Failed to proofread narrative. Please try again.' },
      { status: 500 },
    );
  }
}
