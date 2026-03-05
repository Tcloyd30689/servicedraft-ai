import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWithGemini, parseJsonResponse } from '@/lib/gemini/client';

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

    const rawResponse = await generateWithGemini(SYSTEM_PROMPT, userPrompt);
    const parsed = parseJsonResponse<NarrativeResponse>(rawResponse);

    if (!parsed.block_narrative || !parsed.concern || !parsed.cause || !parsed.correction) {
      throw new Error('Response missing required keys');
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Update narrative error:', error);
    return NextResponse.json(
      { error: 'Failed to generate updated narrative. Please try again.' },
      { status: 500 },
    );
  }
}
