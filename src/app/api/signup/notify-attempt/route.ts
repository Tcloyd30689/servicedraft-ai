import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import { notifyOwnersOfSignup } from '@/lib/signupNotify';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip');
  return realIp ? realIp.trim() : null;
}

/**
 * POST /api/signup/notify-attempt
 *
 * Fires from the signup page right after a verification code is requested.
 * No session exists yet, so there is no auth. The route only ever tells the
 * caller "ok" (or 400 for a malformed email / 429 when rate limited) so that
 * nothing about owner notification recipients or delivery leaks, and the
 * signup page is never slowed by email delivery.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent');

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const rawEmail = (body as { email?: unknown }).email;
  if (typeof rawEmail !== 'string') {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
  }
  const email = rawEmail.trim();
  if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
  }

  const { success: rateLimitOk } = rateLimit(
    `signup_notify:${ip || 'unknown'}`,
    RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW_MS,
  );
  if (!rateLimitOk) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // Fire-and-forget: never awaited, never allowed to throw into this handler.
  try {
    void notifyOwnersOfSignup('attempt', { email, ip, userAgent }).catch(() => {});
  } catch {
    // notifyOwnersOfSignup never throws synchronously, but guard regardless.
  }

  return NextResponse.json({ ok: true });
}
