import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const url = request.nextUrl.pathname;

  // Helper Redirect bawa Cookie
  const redirectSambilBawaCookie = (tujuan: string) => {
    const redirectRes = NextResponse.redirect(new URL(tujuan, request.url));
    supabaseResponse.cookies.getAll().forEach(cookie => {
      redirectRes.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectRes;
  }

  // Aturan A: Belum login tapi mau masuk area dashboard?
  const isDashboardRoute = url.startsWith('/dashboard') || url.startsWith('/dashboard-admin') || url.startsWith('/dashboard-industri');

  if (isDashboardRoute && !user) {
    return redirectSambilBawaCookie('/masuk');
  }

  // Jika user terautentikasi, tentukan role secara dinamis dari Database
  let role = 'mitra';

  if (user) {
    // 1. Cek Admin
    const { data: adminRow } = await supabase
      .from('admin_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (adminRow) {
      role = 'admin';
    } else {
      // 2. Cek Industri
      const { data: industriRow } = await supabase
        .from('industri_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (industriRow) {
        role = 'industri';
      }
    }
  }

  // Aturan B: Sudah login tapi membuka halaman /masuk atau /login
  if ((url === '/masuk' || url === '/login') && user) {
    if (role === 'admin') return redirectSambilBawaCookie('/dashboard-admin');
    if (role === 'industri') return redirectSambilBawaCookie('/dashboard-industri');
    return redirectSambilBawaCookie('/dashboard');
  }

  // Aturan C: Pemetaan area dashboard sesuai Role (Rute Fix: /dashboard-admin)
  const areaByRole: Record<string, string> = {
    mitra: '/dashboard',
    industri: '/dashboard-industri',
    admin: '/dashboard-admin',
  };

  // Pengecekan Akses Rute Dashboard
  if (isDashboardRoute) {
    const allowedArea = areaByRole[role] || '/dashboard';

    // Cek apakah halaman yang dibuka sesuai dengan area role user
    const isAllowedPath = url === allowedArea || url.startsWith(`${allowedArea}/`);

    if (!isAllowedPath) {
      return redirectSambilBawaCookie(allowedArea);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api(?:/|$)|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}