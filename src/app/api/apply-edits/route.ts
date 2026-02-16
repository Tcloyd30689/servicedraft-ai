import { NextResponse } from 'next/server';
import { generateWithGemini, parseJsonResponse } from '@/lib/gemini/client';

interface NarrativeResponse {
  block_narrative: string;
  concern: string;
  cause: string;
  correction: string;
}

const APPLY_EDITS_SYSTEM_PROMPT = `You are an expert automotive warranty narrative editor. You will receive a warranty narrative along with a list of suggested edits from an audit review. Apply ALL of the suggested edits to the narrative while maintaining the overall structure, flow, and professional tone.

RULES:
1. Apply every suggested edit provided. Do not skip any.
2. Maintain FULL CAPITALIZATION throughout all text.
3. Keep the narrative audit-proof — NEVER introduce language that implies external damage, customer misuse, abuse, or neglect.
4. Preserve the overall structure and factual content while incorporating the suggested improvements.
5. NEVER generate, fabricate, or include any document ID numbers, reference numbers, case numbers, claim numbers, or authorization numbers. Only include identification numbers from the original narrative.

RESPONSE FORMAT:
You must respond with ONLY a valid JSON object. No additional text, no markdown formatting, no code fences. Just the raw JSON.

Return the corrected narrative in this exact 4-key JSON format:
{
  "block_narrative": "THE CORRECTED COMPLETE STORY AS A SINGLE FLOWING PARAGRAPH",
  "concern": "THE CORRECTED CUSTOMER CONCERN SECTION ONLY",
  "cause": "THE CORRECTED CAUSE/DIAGNOSIS SECTION ONLY",
  "correction": "THE CORRECTED CORRECTION/REPAIR SECTION ONLY"
}

IMPORTANT:
- The block_narrative must flow naturally as one cohesive paragraph.
- The concern, cause, and correction must also read naturally as standalone sections.
- All four fields must remain factually consistent with each other.
- All text must be FULLY CAPITALIZED.`;

export async function POST(request: Request) {
  try {
    const { concern, cause, correction, suggestedEdits } = await request.json();

    if (!concern || !cause || !correction) {
      return NextResponse.json(
        { error: 'Missing narrative text' },
        { status: 400 },
      );
    }

    if (!suggestedEdits || !Array.isArray(suggestedEdits) || suggestedEdits.length === 0) {
      return NextResponse.json(
        { error: 'No suggested edits provided' },
        { status: 400 },
      );
    }

    const editsFormatted = suggestedEdits
      .map((edit: string, i: number) => `${i + 1}. ${edit}`)
      .join('\n');

    const userPrompt = `Apply the following suggested edits to this warranty narrative. Make all corrections while keeping the narrative professional and audit-compliant.

CURRENT NARRATIVE:
---
CONCERN: ${concern}

CAUSE: ${cause}

CORRECTION: ${correction}
---

SUGGESTED EDITS TO APPLY:
${editsFormatted}`;

    const rawResponse = await generateWithGemini(APPLY_EDITS_SYSTEM_PROMPT, userPrompt, 8192);
    const parsed = parseJsonResponse<NarrativeResponse>(rawResponse);

    if (!parsed.block_narrative || !parsed.concern || !parsed.cause || !parsed.correction) {
      throw new Error('Response missing required keys');
    }

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Apply edits error:', message, error);
    return NextResponse.json(
      { error: `Failed to apply edits: ${message}` },
      { status: 500 },
    );
  }
}
