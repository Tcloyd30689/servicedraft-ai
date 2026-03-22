import { createClient } from '@/lib/supabase/client';

interface LogData {
  story_type?: string;
  input_data?: object;
  output_preview?: string;
  metadata?: object;
}

/**
 * Fire-and-forget activity logger.
 * Failures are silently caught — logging must NEVER break user workflows.
 */
export function logActivity(action_type: string, data?: LogData, userId?: string): void {
  const supabase = createClient();

  // Fire-and-forget: don't await in calling code
  (async () => {
    try {
      let uid = userId;
      if (!uid) {
        // Fallback: use getSession() (cache-only, no network call)
        const { data: { session } } = await supabase.auth.getSession();
        uid = session?.user?.id;
      }
      if (!uid) return;

      const { error } = await supabase.from('activity_log').insert({
        user_id: uid,
        action_type,
        story_type: data?.story_type ?? null,
        input_data: data?.input_data ?? null,
        output_preview: null,
        metadata: data?.metadata ?? {},
      });

      if (error) {
        console.error('Activity log insert error:', error.message);
      }
    } catch (err) {
      console.error('Activity logger error:', err);
    }
  })();
}
