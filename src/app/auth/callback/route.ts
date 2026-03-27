import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null;

  // Always redirect to the canonical domain (non-www) to match cookie domain
  const canonicalOrigin = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;

  const supabase = await createClient();

  // PKCE flow — exchange auth code for session
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL('/signup?step=2', canonicalOrigin));
    }
    console.error('Auth callback code exchange failed:', error.message);
  }

  // Token hash flow — magic link / email OTP verification
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      return NextResponse.redirect(new URL('/signup?step=2', canonicalOrigin));
    }
    console.error('Auth callback OTP verification failed:', error.message);
  }

  // If both methods fail or no params, redirect to login with error hint
  console.error('Auth callback: No valid code or token_hash found, or all exchange methods failed');
  return NextResponse.redirect(new URL('/login', canonicalOrigin));
}
