import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase service role configuration');
  }
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST() {
  try {
    // Verify the requesting user's session
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 },
      );
    }

    const svc = createServiceClient();

    // Delete user's narratives
    const { error: narrativesErr } = await svc.from('narratives').delete().eq('user_id', user.id);
    if (narrativesErr) console.error('Failed to delete narratives:', narrativesErr.message);

    // Delete user's activity log entries
    const { error: activityErr } = await svc.from('activity_log').delete().eq('user_id', user.id);
    if (activityErr) console.error('Failed to delete activity log:', activityErr.message);

    // Delete user's saved repairs
    const { error: repairsErr } = await svc.from('saved_repairs').delete().eq('user_id', user.id);
    if (repairsErr) console.error('Failed to delete saved repairs:', repairsErr.message);

    // Delete user's profile row
    const { error: profileErr } = await svc.from('users').delete().eq('id', user.id);
    if (profileErr) console.error('Failed to delete user profile:', profileErr.message);

    // Delete the auth user (removes from auth.users)
    const { error } = await svc.auth.admin.deleteUser(user.id);
    if (error) {
      console.error('Failed to delete auth user:', error.message);
      return NextResponse.json(
        { error: 'Failed to delete account. Please contact support.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete account error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please contact support.' },
      { status: 500 },
    );
  }
}
