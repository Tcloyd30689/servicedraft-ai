import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Allow explicit user_id override (for login logging where session may not be set yet)
    const body = await request.json();
    const uid = body.user_id || user?.id;
    if (!uid) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { error } = await supabase.from('activity_log').insert({
      user_id: uid,
      action_type: body.action_type,
      story_type: body.story_type ?? null,
      input_data: body.input_data ?? null,
      output_preview: body.output_preview ?? null,
      metadata: body.metadata ?? {},
    });

    if (error) {
      console.error('[/api/activity-log] Insert error:', error.message);
      return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[/api/activity-log] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
