import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null;

  const supabase = await createClient();

  // PKCE flow — exchange auth code for session
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL('/signup?step=2', requestUrl.origin));
    }
    console.error('Auth callback code exchange failed:', error.message);
  }

  // Token hash flow — magic link / email OTP verification
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      return NextResponse.redirect(new URL('/signup?step=2', requestUrl.origin));
    }
    console.error('Auth callback OTP verification failed:', error.message);
  }

  // If both methods fail or no params, redirect to login
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}
