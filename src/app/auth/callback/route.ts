import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Email confirmed — send user to step 2 (payment / access code)
      return NextResponse.redirect(new URL('/signup?step=2', requestUrl.origin));
    }
  }

  // If code exchange fails or no code, redirect to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}
