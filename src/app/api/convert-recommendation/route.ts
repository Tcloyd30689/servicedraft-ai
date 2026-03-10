import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWithGemini } from '@/lib/gemini/client';
import { logTokenUsage } from '@/lib/usageLogger';

const SYSTEM_PROMPT =
  'You are an automotive warranty narrative assistant. Your only task is to take a diagnostic recommendation statement and reword it as a completed repair statement. Change future/recommended tense to past/completed tense. For example, \'RECOMMEND REPLACING THE LEFT FRONT WHEEL BEARING ASSEMBLY\' becomes \'REPLACED THE LEFT FRONT WHEEL BEARING ASSEMBLY\'. \'RECOMMEND PERFORMING A TRANSMISSION FLUID FLUSH\' becomes \'PERFORMED A TRANSMISSION FLUID FLUSH\'. Keep the same technical details and terminology. Output ONLY the reworded text, fully capitalized, with no additional commentary.';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { correction } = await request.json();

    if (!correction || !correction.trim()) {
      return NextResponse.json(
        { error: 'No recommendation text provided' },
        { status: 400 },
      );
    }

    const userPrompt = `Reword the following diagnostic recommendation as a completed repair:\n\n${correction}`;

    const geminiResult = await generateWithGemini(SYSTEM_PROMPT, userPrompt, 2048);

    // Fire-and-forget token usage logging
    logTokenUsage(user.id, 'convert_recommendation', geminiResult.usage);

    return NextResponse.json({ repairText: geminiResult.text.trim() });
  } catch (error) {
    console.error('Convert recommendation error:', error);
    return NextResponse.json(
      { error: 'Failed to convert recommendation' },
      { status: 500 },
    );
  }
}
