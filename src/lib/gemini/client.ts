import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface GeminiUsageMetadata {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
}

export interface GeminiResponse {
  text: string;
  usage: GeminiUsageMetadata | null;
}

export async function generateWithGemini(
  systemPrompt: string,
  userPrompt: string,
  maxOutputTokens: number = 30000,
): Promise<GeminiResponse> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
    systemInstruction: systemPrompt,
    generationConfig: {
      maxOutputTokens,
    },
  });

  const result = await model.generateContent(userPrompt);
  const response = result.response;

  // Extract usage metadata if available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawUsage = (response as any).usageMetadata;
  const usage: GeminiUsageMetadata | null = rawUsage
    ? {
        promptTokenCount: rawUsage.promptTokenCount ?? 0,
        candidatesTokenCount: rawUsage.candidatesTokenCount ?? 0,
        totalTokenCount: rawUsage.totalTokenCount ?? 0,
      }
    : null;

  return { text: response.text(), usage };
}

export function parseJsonResponse<T>(rawText: string): T {
  // Strip markdown code fences if present
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  return JSON.parse(cleaned) as T;
}
