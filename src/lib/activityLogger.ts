/**
 * Fire-and-forget activity logger.
 * Routes through server-side /api/activity-log to avoid browser Supabase client.
 * Failures are silently caught — logging must NEVER break user workflows.
 */
export function logActivity(action_type: string, data?: {
  story_type?: string;
  input_data?: object;
  output_preview?: string;
  metadata?: object;
}, userId?: string): void {
  // Fire-and-forget: log via server-side API
  (async () => {
    try {
      await fetch('/api/activity-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action_type,
          story_type: data?.story_type,
          input_data: data?.input_data,
          output_preview: data?.output_preview,
          metadata: data?.metadata,
          user_id: userId,
        }),
      });
    } catch {
      // Silent — logging must never break user workflows
    }
  })();
}
