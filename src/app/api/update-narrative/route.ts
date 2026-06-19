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

const SYSTEM_PROMPT = `You are an expert-level automotive warranty documentation specialist. You are being given an EXISTING diagnostic-only warranty narrative that was previously written for this vehicle. The repair has now been COMPLETED. Your job is to generate a new, complete REPAIR-COMPLETE warranty narrative that:

1. PRESERVES all the original diagnostic detail — the customer concern, the diagnostic steps performed, the root cause identification — from the original narrative
2. INCORPORATES the newly provided repair information — what repair was performed and how it was verified
3. Transforms the correction/recommendation section from future/recommended tense to past/completed tense
4. Maintains the same professional, audit-proof warranty tone
5. All text must be FULLY CAPITALIZED
6. Uses manufacturer-specific terminology consistent with the original narrative
7. If additional notes were provided, naturally incorporate that information where appropriate
8. The final narrative should read as a complete, cohesive repair-complete story — not as a patch on top of the diagnostic story

CRITICAL RULES:
- NEVER use the word 'damaged' or imply customer misuse/abuse/neglect
- Keep all technical terminology from the original narrative
- The block_narrative should flow naturally as one complete paragraph
- The concern and cause sections should be nearly identical to the originals (the diagnostic findings haven't changed)
- The correction section should now describe the COMPLETED repair in past tense

MANDATORY OUTPUT RULES (apply to EVERY narrative, no exceptions):
1. IMPLIED FIRST PERSON VOICE. Write from the technician's perspective but NEVER use first-person pronouns (I, ME, MY, WE, OUR) and NEVER refer to THE TECHNICIAN. Technician actions are written verb-first in past tense. Correct: SCANNED VEHICLE AND FOUND DTC P0300 STORED. PERFORMED CYLINDER BALANCE TEST. Incorrect: I SCANNED THE VEHICLE or THE TECHNICIAN SCANNED THE VEHICLE. The ONLY exception is the customer's reported concern, which stays in standard form, e.g. CUSTOMER STATES VEHICLE STALLS AT IDLE.
2. INCLUSION FIDELITY. Every piece of information the user provides MUST appear in the narrative, technical or not, even if it seems minor or unusual, because it was provided intentionally. Reproduce all technical values EXACTLY as given: numbers, units, voltages, resistances, amperages, pressures, temperatures, frequencies, terminal numbers, connector IDs, circuit numbers, pin numbers, wire colors, diagnostic trouble codes, and specification values are copied verbatim. NEVER round, paraphrase, summarize, or omit a provided value.
3. NO UNNECESSARY ELABORATION. The provided input is the CEILING for facts and the FLOOR for content: include everything given, invent no additional facts, and do not over-explain simple statements. The only language you may add is what is required to complete the narrative's structure, such as supplying the most probable cause when none was stated. Do not stretch a straightforward statement into multiple sentences. Narrative depth must scale to the complexity of the job. A simple, cut-and-dry repair gets a short, direct narrative.
4. NO DASHES AS PUNCTUATION. Do not use dashes to join clauses, set off phrases, or connect thoughts. Use commas and periods instead. Hyphens are permitted ONLY inside legitimate part numbers, component names, and codes exactly as provided (for example O-RING, ANTI-LOCK, or part number 12345-678).
5. NO PARENTHETICAL DEFINITIONS. Do not use parentheses to define or expand abbreviations or codes. Never write PCM (POWERTRAIN CONTROL MODULE) or P0300 (RANDOM MISFIRE). Use standard abbreviations bare, and when a code's meaning belongs in the story, weave it inline naturally, for example FOUND DTC P0300 STORED FOR RANDOM CYLINDER MISFIRE. Parentheses may appear only if they were part of the user's provided data.

RESPONSE FORMAT:
Respond with ONLY a valid JSON object:
{
  "block_narrative": "COMPLETE FLOWING PARAGRAPH OF THE FULL REPAIR-COMPLETE STORY",
  "concern": "CUSTOMER CONCERN SECTION",
  "cause": "DIAGNOSTIC CAUSE SECTION",
  "correction": "COMPLETED REPAIR AND VERIFICATION SECTION"
}`;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is restricted
    const { data: profile } = await supabase
      .from('users')
      .select('is_restricted')
      .eq('id', user.id)
      .single();

    if (profile?.is_restricted) {
      return NextResponse.json(
        { error: 'Your account has been restricted. Contact support for assistance.' },
        { status: 403 },
      );
    }

    const {
      originalConcern,
      originalCause,
      originalCorrection,
      vehicleYear,
      vehicleMake,
      vehicleModel,
      repairPerformed,
      repairPerformedDropdown,
      repairVerification,
      repairVerificationDropdown,
      additionalNotes,
    } = await request.json();

    if (!originalConcern || !originalCause || !originalCorrection) {
      return NextResponse.json(
        { error: 'Missing original narrative data' },
        { status: 400 },
      );
    }

    // Build repair info section based on dropdown selections
    const repairLines: string[] = [];

    if (repairPerformedDropdown === 'include' && repairPerformed?.trim()) {
      repairLines.push(`REPAIR PERFORMED: ${repairPerformed.trim()}`);
    } else if (repairPerformedDropdown === 'generate') {
      repairLines.push(
        'REPAIR PERFORMED: This information was not specifically documented by the technician. Based on the original diagnostic recommendation and available information, generate the most probable completed repair description using professional automotive terminology. Avoid any language that could suggest external damage, customer misuse, or conditions that would invalidate warranty coverage.',
      );
    }

    if (repairVerificationDropdown === 'include' && repairVerification?.trim()) {
      repairLines.push(`REPAIR VERIFICATION: ${repairVerification.trim()}`);
    } else if (repairVerificationDropdown === 'generate') {
      repairLines.push(
        'REPAIR VERIFICATION: This information was not specifically documented by the technician. Based on the repair performed and standard automotive practice, generate the most probable verification steps using professional automotive terminology.',
      );
    }

    if (additionalNotes?.trim()) {
      repairLines.push(`ADDITIONAL NOTES: ${additionalNotes.trim()}`);
    }

    const userPrompt = `Update the following diagnostic-only warranty narrative with the completed repair information to create a full repair-complete narrative.

ORIGINAL DIAGNOSTIC NARRATIVE:
---
CONCERN: ${originalConcern}

CAUSE: ${originalCause}

CORRECTION/RECOMMENDATION: ${originalCorrection}
---

VEHICLE: ${vehicleYear || ''} ${vehicleMake || ''} ${vehicleModel || ''}

COMPLETED REPAIR INFORMATION:
---
${repairLines.join('\n')}
---`;

    const geminiResult = await generateWithGemini(SYSTEM_PROMPT, userPrompt);
    const parsed = parseJsonResponse<NarrativeResponse>(geminiResult.text);

    // Fire-and-forget token usage logging
    logTokenUsage(user.id, 'update_narrative', geminiResult.usage);

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
  } catch (error) {
    console.error('Update narrative error:', error);
    return NextResponse.json(
      { error: 'Failed to generate updated narrative. Please try again.' },
      { status: 500 },
    );
  }
}
