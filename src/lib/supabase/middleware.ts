import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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

  let user = null;
  try {
    const { data } = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Middleware auth check timed out')), 5000)
      ),
    ]);
    user = data?.user ?? null;
  } catch (err) {
    // getUser() timed out or failed — proceed without user context.
    // Protected routes will redirect to /login (correct fallback for stuck sessions).
    // Auth routes (/login, /signup) will show their forms.
    console.warn('[middleware] getUser() timed out or failed, proceeding without auth:', err instanceof Error ? err.message : err);
  }

  const pathname = request.nextUrl.pathname;

  // Protected routes — redirect to login if not authenticated
  const protectedRoutes = ['/main-menu', '/input', '/narrative', '/dashboard', '/admin'];
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
}
