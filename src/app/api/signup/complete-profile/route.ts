import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password, firstName, lastName, location, position, accentColor } = body;

    // Validate required fields
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 });
    }
    if (!position) {
      return NextResponse.json({ error: 'Position is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('[/api/signup/complete-profile] Auth error:', userError?.message);
      return NextResponse.json({ error: 'Not authenticated. Please click your email confirmation link again.' }, { status: 401 });
    }

    // Step 1: Set the password
    const { error: passwordError } = await supabase.auth.updateUser({ password });
    if (passwordError) {
      console.error('[/api/signup/complete-profile] Password update error:', passwordError.message);
      return NextResponse.json({ error: 'Failed to set password: ' + passwordError.message }, { status: 500 });
    }

    // Step 2: Upsert the profile in the users table
    // Uses UPSERT instead of UPDATE because the handle_new_user trigger
    // on auth.users can silently fail, leaving no public.users row.
    const username = (user.email || '').split('@')[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const upsertData: Record<string, any> = {
      id: user.id,
      email: user.email || '',
      username,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      location: location || null,
      position,
    };

    if (accentColor) {
      upsertData.preferences = {
        appearance: {
          accentColor,
          mode: 'dark',
          backgroundAnimation: true,
        },
      };
    }

    const { error: profileError } = await supabase
      .from('users')
      .upsert(upsertData, { onConflict: 'id' });

    if (profileError) {
      console.error('[/api/signup/complete-profile] Profile upsert error:', profileError.message);
      return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true, username });
  } catch (err) {
    console.error('[/api/signup/complete-profile] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
