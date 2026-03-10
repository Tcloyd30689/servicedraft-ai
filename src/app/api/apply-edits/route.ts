import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWithGemini, parseJsonResponse } from '@/lib/gemini/client';
import { logTokenUsage } from '@/lib/usageLogger';

interface NarrativeResponse {
  block_narrative: string;
  concern: string;
  cause: string;
  correction: string;
}

const APPLY_EDITS_SYSTEM_PROMPT = `You are an expert automotive warranty narrative editor. You will receive a warranty narrative along with a specific list of suggested edits selected by the user from an audit review. Apply ONLY the suggested edits provided — these may be a subset of a larger audit. Do not make any changes beyond what is specified in the provided edits.

RULES:
1. Apply every suggested edit in the provided list. Do not skip any of the listed edits.
2. Do NOT make additional changes beyond the provided edits. If a section is not addressed by any edit, leave it exactly as-is.
3. Maintain FULL CAPITALIZATION throughout all text.
4. Keep the narrative audit-proof — NEVER introduce language that implies external damage, customer misuse, abuse, or neglect.
5. Preserve the overall structure and factual content while incorporating the suggested improvements.
6. NEVER generate, fabricate, or include any document ID numbers, reference numbers, case numbers, claim numbers, or authorization numbers. Only include identification numbers from the original narrative.

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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

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

    const userPrompt = `Apply ONLY the following selected edits to this warranty narrative. These are the specific edits the user chose to apply. Make these corrections while keeping the narrative professional and audit-compliant. Do not make any other changes beyond what is listed below.

CURRENT NARRATIVE:
---
CONCERN: ${concern}

CAUSE: ${cause}

CORRECTION: ${correction}
---

SELECTED EDITS TO APPLY:
${editsFormatted}`;

    const geminiResult = await generateWithGemini(APPLY_EDITS_SYSTEM_PROMPT, userPrompt, 8192);
    const parsed = parseJsonResponse<NarrativeResponse>(geminiResult.text);

    // Fire-and-forget token usage logging
    logTokenUsage(user.id, 'apply_edits', geminiResult.usage);

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
