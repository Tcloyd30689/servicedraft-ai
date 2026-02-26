import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWithGemini, parseJsonResponse } from '@/lib/gemini/client';
import { DIAGNOSTIC_ONLY_SYSTEM_PROMPT, REPAIR_COMPLETE_SYSTEM_PROMPT } from '@/constants/prompts';

interface NarrativeResponse {
  block_narrative: string;
  concern: string;
  cause: string;
  correction: string;
}

export async function POST(request: Request) {
  try {
    // Check if user is restricted
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
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
    }

    const { compiledDataBlock, storyType } = await request.json();

    if (!compiledDataBlock || !storyType) {
      return NextResponse.json(
        { error: 'Missing required fields: compiledDataBlock and storyType' },
        { status: 400 },
      );
    }

    const systemPrompt =
      storyType === 'diagnostic_only'
        ? DIAGNOSTIC_ONLY_SYSTEM_PROMPT
        : REPAIR_COMPLETE_SYSTEM_PROMPT;

    const userPrompt =
      storyType === 'diagnostic_only'
        ? `Generate an audit-proof warranty narrative based on the following diagnostic-only repair order information. This is a diagnosis-only scenario — the repair has NOT been performed yet. The correction section should describe what repair is RECOMMENDED.\n\nVEHICLE & REPAIR ORDER INFORMATION:\n---\n${compiledDataBlock}\n---`
        : `Generate an audit-proof warranty narrative based on the following completed repair order information. This repair has been fully completed and verified.\n\nVEHICLE & REPAIR ORDER INFORMATION:\n---\n${compiledDataBlock}\n---`;

    const rawResponse = await generateWithGemini(systemPrompt, userPrompt);
    const parsed = parseJsonResponse<NarrativeResponse>(rawResponse);

    // Validate required keys
    if (!parsed.block_narrative || !parsed.concern || !parsed.cause || !parsed.correction) {
      throw new Error('Response missing required keys');
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Generate narrative error:', error);
    return NextResponse.json(
      { error: 'Failed to generate narrative. Please try again.' },
      { status: 500 },
    );
  }
}
