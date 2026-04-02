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

  // Determine the best failure redirect based on what was attempted
  if (code) {
    // Had an auth code but exchangeCodeForSession failed.
    // Most likely cause: cross-browser (code_verifier cookie missing from this browser).
    console.error('Auth callback: Code exchange failed — redirecting to signup with cross-browser error');
    return NextResponse.redirect(new URL('/signup?error=cross-browser', canonicalOrigin));
  }
  if (token_hash) {
    // Had a token_hash but verifyOtp failed — expired or already used
    console.error('Auth callback: Token verification failed — redirecting to signup with link-expired error');
    return NextResponse.redirect(new URL('/signup?error=link-expired', canonicalOrigin));
  }
  // No recognizable params at all
  console.error('Auth callback: No valid code or token_hash found');
  return NextResponse.redirect(new URL('/login', canonicalOrigin));
}
