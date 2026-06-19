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

MANDATORY OUTPUT RULES (the corrected narrative you return must follow these, no exceptions):
1. IMPLIED FIRST PERSON VOICE. Write from the technician's perspective but NEVER use first-person pronouns (I, ME, MY, WE, OUR) and NEVER refer to THE TECHNICIAN. Technician actions stay verb-first in past tense. The customer's reported concern stays in standard form, e.g. CUSTOMER STATES VEHICLE STALLS AT IDLE.
2. STRICT FULL CAPITALIZATION. EVERY word must be uppercase with no exceptions, including short connector words such as AND, THE, OF, A, TO, IS, OR, IN, ON, FOR. Never leave a single word in lowercase.
3. NO DASHES AS PUNCTUATION. Do not use dashes to join clauses, set off phrases, or connect thoughts, and do not hyphenate compound words. Write VEHICLE WIDE not VEHICLE-WIDE, WARM UP not WARM-UP, REAL TIME not REAL-TIME, UNDER TEMPERATURE not UNDER-TEMPERATURE. Use commas, periods, or spaces instead. Hyphens are permitted ONLY inside legitimate part numbers, component or product names, and codes exactly as provided (for example O-RING, ANTI-LOCK, DEX-COOL, or part number 12345-678).
4. NO PARENTHETICAL DEFINITIONS. Do not use parentheses to define or expand abbreviations or codes. Never write PCM (POWERTRAIN CONTROL MODULE) or P0300 (RANDOM MISFIRE). Use standard abbreviations bare, and weave a code's meaning inline naturally. Parentheses may appear only if they were part of the original narrative's provided data.

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
