import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const url = request.nextUrl.pathname;

  const redirectSambilBawaCookie = (tujuan: string) => {
    const redirectRes = NextResponse.redirect(new URL(tujuan, request.url));
    supabaseResponse.cookies.getAll().forEach(cookie => {
      redirectRes.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectRes;
  };

  const isDashboardRoute = url.startsWith('/dashboard') || url.startsWith('/dashboard-admin') || url.startsWith('/dashboard-industri');
  if (isDashboardRoute && !user) return redirectSambilBawaCookie('/masuk');

  const role = user?.app_metadata?.role || 'mitra';

  if ((url === '/masuk' || url === '/login' || url === '/daftar') && user) {
    if (role === 'admin') return redirectSambilBawaCookie('/dashboard-admin');
    if (role === 'industri') return redirectSambilBawaCookie('/dashboard-industri');
    return redirectSambilBawaCookie('/dashboard');
  }

  const areaByRole: Record<string, string> = {
    mitra: '/dashboard',
    agen: '/dashboard',
    industri: '/dashboard-industri',
    admin: '/dashboard-admin',
  };

  if (isDashboardRoute) {
    const allowedArea = areaByRole[role] || '/dashboard';
    const isAllowedPath = url === allowedArea || url.startsWith(`${allowedArea}/`);

    if (!isAllowedPath) return redirectSambilBawaCookie(allowedArea);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api(?:/|$)|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};