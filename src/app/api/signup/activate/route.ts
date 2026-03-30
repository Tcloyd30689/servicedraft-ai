import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { teamId } = body;

    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Update subscription status to bypass and optionally set team_id
    // Uses UPSERT as a safety net in case public.users row is missing
    const upsertData: Record<string, string> = {
      id: user.id,
      email: user.email || '',
      subscription_status: 'bypass',
    };
    if (teamId) {
      upsertData.team_id = teamId;
    }

    const { error } = await supabase
      .from('users')
      .upsert(upsertData, { onConflict: 'id' });

    if (error) {
      console.error('[/api/signup/activate] Upsert error:', error.message);
      return NextResponse.json({ error: 'Failed to activate account' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[/api/signup/activate] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
