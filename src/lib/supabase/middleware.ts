import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Check for potentially corrupted auth cookies before Supabase tries to parse them
  const authCookies = request.cookies.getAll().filter(c => c.name.startsWith('sb-'));
  let cookiesCorrupted = false;

  for (const cookie of authCookies) {
    try {
      if (cookie.value) {
        const base64Part = cookie.value.split('.')[0];
        if (base64Part) {
          Buffer.from(base64Part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
        }
      }
    } catch {
      console.warn(`Corrupted Supabase cookie detected in middleware: ${cookie.name}`);
      cookiesCorrupted = true;
      break;
    }
  }

  // If cookies are corrupted, clear them and redirect to login
  if (cookiesCorrupted) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const response = NextResponse.redirect(url);
    for (const cookie of authCookies) {
      response.cookies.delete(cookie.name);
    }
    return response;
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // Protected routes — redirect to login if not authenticated
    const protectedRoutes = ['/main-menu', '/input', '/narrative', '/dashboard', '/admin', '/team-dashboard'];
    const isProtectedRoute = protectedRoutes.some((route) =>
      pathname.startsWith(route),
    );

    if (isProtectedRoute && !user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // Auth routes — /login and /signup handle their own routing client-side
    // to support multi-step onboarding (email confirmation → access code → profile)
    // No server-side redirect for authenticated users on auth routes

    return supabaseResponse;
  } catch (err) {
    // Catch any remaining Supabase parsing errors (Invalid UTF-8, etc.)
    console.error('Middleware auth error — clearing session:', err);
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const response = NextResponse.redirect(url);
    for (const cookie of authCookies) {
      response.cookies.delete(cookie.name);
    }
    return response;
  }
}
