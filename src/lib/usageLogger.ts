import { createClient } from '@/lib/supabase/server';
import type { GeminiUsageMetadata } from '@/lib/gemini/client';
import { GEMINI_MODEL_ID, GEMINI_INPUT_COST_PER_1M, GEMINI_OUTPUT_COST_PER_1M } from '@/lib/gemini/modelId';

// Pricing (per token) derived from per-1M constants in modelId.ts
const INPUT_COST_PER_TOKEN = GEMINI_INPUT_COST_PER_1M / 1_000_000;
const OUTPUT_COST_PER_TOKEN = GEMINI_OUTPUT_COST_PER_1M / 1_000_000;

/**
 * Fire-and-forget server-side token usage logger.
 * Logs to api_usage_log table. Never blocks the request.
 */
export function logTokenUsage(
  userId: string,
  actionType: string,
  usage: GeminiUsageMetadata | null,
): void {
  if (!usage) return;

  const estimatedCost =
    usage.promptTokenCount * INPUT_COST_PER_TOKEN +
    usage.candidatesTokenCount * OUTPUT_COST_PER_TOKEN;

  // Fire-and-forget — never await in calling code
  (async () => {
    try {
      const supabase = await createClient();
      await supabase.from('api_usage_log').insert({
        user_id: userId,
        action_type: actionType,
        prompt_tokens: usage.promptTokenCount,
        completion_tokens: usage.candidatesTokenCount,
        total_tokens: usage.totalTokenCount,
        model_name: GEMINI_MODEL_ID,
        estimated_cost_usd: estimatedCost,
      });
    } catch (err) {
      console.error('Usage log insert error:', err);
    }
  })();
}
