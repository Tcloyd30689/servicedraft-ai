import { NextResponse } from 'next/server';
import { generateWithGemini, parseJsonResponse } from '@/lib/gemini/client';
import { CUSTOMIZATION_SYSTEM_PROMPT, LENGTH_MODIFIERS, TONE_MODIFIERS, DETAIL_MODIFIERS } from '@/constants/prompts';

interface NarrativeResponse {
  block_narrative: string;
  concern: string;
  cause: string;
  correction: string;
}

export async function POST(request: Request) {
  try {
    const {
      concern,
      cause,
      correction,
      storyType,
      lengthSlider,
      toneSlider,
      detailSlider,
      customInstructions,
    } = await request.json();

    if (!concern || !cause || !correction) {
      return NextResponse.json(
        { error: 'Missing narrative text' },
        { status: 400 },
      );
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

    const userPrompt = `Rewrite the following warranty narrative according to the customization preferences listed below. Preserve all factual content — only adjust the style, length, tone, and detail level as specified.

STORY TYPE: ${storyType === 'diagnostic_only' ? 'Diagnostic Only' : 'Repair Complete'}

CURRENT NARRATIVE:
---
CONCERN: ${concern}

CAUSE: ${cause}

CORRECTION: ${correction}
---

CUSTOMIZATION PREFERENCES:
${customizationBlock}`;

    const rawResponse = await generateWithGemini(CUSTOMIZATION_SYSTEM_PROMPT, userPrompt);
    const parsed = parseJsonResponse<NarrativeResponse>(rawResponse);

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
