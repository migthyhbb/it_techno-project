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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

  // PERBAIKAN: Gunakan app_metadata untuk keamanan tingkat tinggi, bukan user_metadata
  const role = user?.app_metadata?.role;
  const url = request.nextUrl.pathname;

  // Fungsi khusus untuk Redirect sambil tetap membawa Cookie Login yang sudah di-refresh
  const redirectSambilBawaCookie = (tujuan: string) => {
    const redirectRes = NextResponse.redirect(new URL(tujuan, request.url));
    supabaseResponse.cookies.getAll().forEach(cookie => {
      redirectRes.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectRes;
  }

  // Aturan A: Mau masuk dashboard tapi belum login? Tendang ke halaman login!
  if (url.startsWith('/dashboard') && !user) {
    return redirectSambilBawaCookie('/login');
  }

  // Aturan B: Orang sudah login, tapi buka halaman '/login' lagi? Kembalikan ke dashboard.
  if (url === '/login' && user) {
    if (role === 'agen') {
      return redirectSambilBawaCookie('/dashboard/agen');
    } else if (role === 'perusahaan') {
      return redirectSambilBawaCookie('/dashboard/perusahaan');
    } else if (role === 'admin') {
      return redirectSambilBawaCookie('/dashboard/admin');
    }
  }

  // Aturan C & D: Setiap area dashboard hanya boleh diakses oleh role yang cocok (Sistem Default Deny).
  const areaByRole: Record<string, string> = {
    agen: '/dashboard/agen',
    perusahaan: '/dashboard/perusahaan',
    admin: '/dashboard/admin',
  };

  if (url.startsWith('/dashboard')) {
    const allowedArea = role ? areaByRole[role] : undefined;

    // Role tidak dikenal atau kosong: tolak akses ke seluruh area dashboard!
    if (!allowedArea) {
      return redirectSambilBawaCookie('/login');
    }

    const isAllowedPath =
      url === allowedArea || url.startsWith(`${allowedArea}/`);

    if (!isAllowedPath) {
      return redirectSambilBawaCookie(allowedArea);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Regex diperbaiki agar tidak memblokir rute seperti /apidocs
    '/((?!_next/static|_next/image|favicon.ico|api(?:/|$)|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}