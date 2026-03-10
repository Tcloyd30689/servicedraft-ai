import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWithGemini, parseJsonResponse } from '@/lib/gemini/client';
import { DIAGNOSTIC_ONLY_SYSTEM_PROMPT, REPAIR_COMPLETE_SYSTEM_PROMPT } from '@/constants/prompts';
import { rateLimit } from '@/lib/rateLimit';
import { logTokenUsage } from '@/lib/usageLogger';

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

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Rate limit: 20 generations per user per 15 minutes
    const { success: rateLimitOk } = rateLimit(`generate:${user.id}`, 20, 15 * 60 * 1000);
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a few minutes before generating again.' },
        { status: 429 },
      );
    }

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

    const { compiledDataBlock, storyType } = await request.json();

    if (!compiledDataBlock || !storyType) {
      return NextResponse.json(
        { error: 'Missing required fields: compiledDataBlock and storyType' },
        { status: 400 },
      );
    }

    // Input length limit to prevent abuse
    if (typeof compiledDataBlock !== 'string' || compiledDataBlock.length > 10000) {
      return NextResponse.json(
        { error: 'Input data exceeds maximum allowed length' },
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

    const geminiResult = await generateWithGemini(systemPrompt, userPrompt);
    const parsed = parseJsonResponse<NarrativeResponse>(geminiResult.text);

    // Fire-and-forget token usage logging
    logTokenUsage(user.id, 'generate', geminiResult.usage);

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
