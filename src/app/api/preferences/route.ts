import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ preferences: null }, { status: 401 });
    }

    const { data: row } = await supabase
      .from('users')
      .select('preferences')
      .eq('id', user.id)
      .single();

    return NextResponse.json({ preferences: row?.preferences || null, userId: user.id });
  } catch {
    return NextResponse.json({ preferences: null }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { preferences } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { error } = await supabase
      .from('users')
      .update({ preferences })
      .eq('id', user.id);

    if (error) {
      console.error('[/api/preferences] Update error:', error.message);
      return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[/api/preferences] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
