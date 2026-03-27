import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Force www → non-www redirect BEFORE auth processing.
  // PKCE code_verifier cookies are domain-scoped — if the user signs up on
  // www.servicedraft.ai but the callback runs on servicedraft.ai, the cookie
  // is missing and exchangeCodeForSession() fails silently.
  const host = request.headers.get('host') || '';
  if (host.startsWith('www.')) {
    const nonWwwHost = host.replace(/^www\./, '');
    const url = request.nextUrl.clone();
    url.host = nonWwwHost;
    url.port = ''; // Clear port for clean redirect
    return NextResponse.redirect(url, 308);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
