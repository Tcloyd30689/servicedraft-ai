import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWithGemini, parseJsonResponse } from '@/lib/gemini/client';
import { CUSTOMIZATION_SYSTEM_PROMPT, LENGTH_MODIFIERS, TONE_MODIFIERS, DETAIL_MODIFIERS } from '@/constants/prompts';
import { logTokenUsage } from '@/lib/usageLogger';

interface NarrativeResponse {
  block_narrative: string;
  concern: string;
  cause: string;
  correction: string;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const {
      concern,
      cause,
      correction,
      storyType,
      lengthSlider,
      toneSlider,
      detailSlider,
      customInstructions,
      originalInputContext,
    } = await request.json();

    if (!concern || !cause || !correction) {
      return NextResponse.json(
        { error: 'Missing narrative text' },
        { status: 400 },
      );
    }

    // Server-side custom instructions validation (source of truth)
    if (customInstructions) {
      if (customInstructions.length > 100) {
        return NextResponse.json(
          { error: 'Custom instructions exceed maximum length of 100 characters' },
          { status: 400 },
        );
      }

      const BLOCKED_PATTERNS = [
        /ignore (previous|prior|all) instructions/i,
        /you are now/i,
        /system\s*:/i,
        /assistant\s*:/i,
        /disregard/i,
        /forget (your|all|previous)/i,
        /new (instructions|persona|role)/i,
        /act as/i,
        /pretend (to be|you are)/i,
      ];

      const hasBlockedContent = BLOCKED_PATTERNS.some((pattern) => pattern.test(customInstructions));
      if (hasBlockedContent) {
        return NextResponse.json(
          { error: 'Custom instructions contain restricted content' },
          { status: 400 },
        );
      }
    }

    // Build customization block
    const modifiers: string[] = [];

    if (lengthSlider && LENGTH_MODIFIERS[lengthSlider]) {
      modifiers.push(LENGTH_MODIFIERS[lengthSlider]);
    }
    if (toneSlider && TONE_MODIFIERS[toneSlider]) {
      modifiers.push(TONE_MODIFIERS[toneSlider]);
    }
    if (detailSlider && DETAIL_MODIFIERS[detailSlider]) {
      modifiers.push(DETAIL_MODIFIERS[detailSlider]);
    }
    if (customInstructions?.trim()) {
      modifiers.push(`ADDITIONAL INSTRUCTIONS: ${customInstructions.trim()}`);
    }

    if (modifiers.length === 0) {
      return NextResponse.json(
        { error: 'No customization preferences specified' },
        { status: 400 },
      );
    }

    const customizationBlock = modifiers.join('\n');

    const inputContextBlock = originalInputContext
      ? `\nORIGINAL INPUT CONTEXT (from input page — preserve consistency with these facts):\n---\n${originalInputContext}\n---\n`
      : '';

    const userPrompt = `Rewrite the following warranty narrative according to the customization preferences listed below. Preserve all factual content — only adjust the style, length, tone, and detail level as specified.

STORY TYPE: ${storyType === 'diagnostic_only' ? 'Diagnostic Only' : 'Repair Complete'}
${inputContextBlock}
CURRENT NARRATIVE:
---
CONCERN: ${concern}

CAUSE: ${cause}

CORRECTION: ${correction}
---

CUSTOMIZATION PREFERENCES:
${customizationBlock}`;

    const geminiResult = await generateWithGemini(CUSTOMIZATION_SYSTEM_PROMPT, userPrompt);
    const parsed = parseJsonResponse<NarrativeResponse>(geminiResult.text);

    // Fire-and-forget token usage logging
    logTokenUsage(user.id, 'customize', geminiResult.usage);

    if (!parsed.block_narrative || !parsed.concern || !parsed.cause || !parsed.correction) {
      throw new Error('Response missing required keys');
    }

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Customize narrative error:', message, error);
    return NextResponse.json(
      { error: `Failed to customize narrative: ${message}` },
      { status: 500 },
    );
  }
}
