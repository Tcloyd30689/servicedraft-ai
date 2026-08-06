import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWithGemini, parseJsonResponse } from '@/lib/gemini/client';
import { MANDATORY_OUTPUT_RULES } from '@/constants/prompts';
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

The corrected narrative you return must follow these mandatory output rules, no exceptions:
${MANDATORY_OUTPUT_RULES}

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

    const { concern, cause, correction, suggestedEdits, storyType } = await request.json();

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

    // Diagnostic-only narratives state a RECOMMENDED repair that has not happened yet.
    // Applying an edit must never flip the Correction into completed-repair tense.
    // Framed as a constraint on HOW the selected edits are applied, not as an extra edit,
    // so it does not conflict with the system prompt's "no additional changes" rule.
    const tenseBlock =
      storyType === 'diagnostic_only'
        ? `\n\nDIAGNOSTIC ONLY TENSE PRESERVATION (ABSOLUTE — this is a constraint on HOW the edits above are applied, not an additional edit):\nThis narrative is DIAGNOSTIC ONLY. The repair has NOT been performed. The CORRECTION section states a RECOMMENDED repair and MUST remain in recommended, pre-repair tense after the selected edits are applied. Keep wording such as RECOMMENDED REPLACING or RECOMMEND PERFORMING, and NEVER convert it to REPLACED, PERFORMED, INSTALLED, REPAIRED, or any wording that states or implies the repair was carried out. Never add repair verification, post-repair road test, or any claim that the repair corrected the concern. If a selected edit would seem to require completed-repair wording, apply the substance of that edit while keeping the recommendation tense. Diagnostic, inspection, and access work that WAS actually performed stays in past tense as normal.`
        : '';

    const userPrompt = `Apply ONLY the following selected edits to this warranty narrative. These are the specific edits the user chose to apply. Make these corrections while keeping the narrative professional and audit-compliant. Do not make any other changes beyond what is listed below.

CURRENT NARRATIVE:
---
CONCERN: ${concern}

CAUSE: ${cause}

CORRECTION: ${correction}
---

SELECTED EDITS TO APPLY:
${editsFormatted}${tenseBlock}`;

    const geminiResult = await generateWithGemini(APPLY_EDITS_SYSTEM_PROMPT, userPrompt, 8192);
    const parsed = parseJsonResponse<NarrativeResponse>(geminiResult.text);

    // Fire-and-forget token usage logging
    logTokenUsage(user.id, 'apply_edits', geminiResult.usage);

    if (!parsed.block_narrative || !parsed.concern || !parsed.cause || !parsed.correction) {
      throw new Error('Response missing required keys');
    }

    // Enforce FULL CAPITALIZATION deterministically so a stray lowercase word
    // from the model can never reach the narrative (the app requires all caps).
    parsed.block_narrative = parsed.block_narrative.toUpperCase();
    parsed.concern = parsed.concern.toUpperCase();
    parsed.cause = parsed.cause.toUpperCase();
    parsed.correction = parsed.correction.toUpperCase();

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
