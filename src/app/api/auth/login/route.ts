import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('[/api/auth/login] Sign-in error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (!data.user) {
      return NextResponse.json({ error: 'Sign-in failed' }, { status: 401 });
    }

    // Fetch the user profile to determine onboarding status
    const { data: profile } = await supabase
      .from('users')
      .select('username, subscription_status')
      .eq('id', data.user.id)
      .single();

    // Determine where to route the user
    let redirectTo = '/main-menu';
    if (!profile || !profile.username) {
      redirectTo = '/signup?step=2';
    } else if (!profile.subscription_status || profile.subscription_status === 'trial') {
      redirectTo = '/signup?step=3';
    }

    // Fire-and-forget activity log — server-side, no browser client needed.
    // Don't await — logging must never delay the login response.
    supabase.from('activity_log').insert({
      user_id: data.user.id,
      action_type: 'login',
      story_type: null,
      input_data: null,
      output_preview: null,
      metadata: {},
    }).then(({ error: logErr }) => {
      if (logErr) console.error('[/api/auth/login] Activity log error:', logErr.message);
    });

    return NextResponse.json({
      success: true,
      redirectTo,
      userId: data.user.id,
    });
  } catch (err) {
    console.error('[/api/auth/login] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
