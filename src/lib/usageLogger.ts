import { createClient } from '@/lib/supabase/server';
import type { GeminiUsageMetadata } from '@/lib/gemini/client';

// Gemini 3 Flash Preview pricing (per token)
const INPUT_COST_PER_TOKEN = 0.0000005; // $0.50 per 1M tokens
const OUTPUT_COST_PER_TOKEN = 0.000003; // $3.00 per 1M tokens

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
        model_name: 'gemini-3-flash-preview',
        estimated_cost_usd: estimatedCost,
      });
    } catch (err) {
      console.error('Usage log insert error:', err);
    }
  })();
}
