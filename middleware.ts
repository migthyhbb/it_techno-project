import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // 1. Siapkan response bawaan Next.js untuk menitipkan tiket (cookie) baru
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. Panggil Supabase SSR khusus untuk Middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          supabaseResponse = NextResponse.next({
            request: { headers: request.headers },
          });
          supabaseResponse.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          supabaseResponse = NextResponse.next({
            request: { headers: request.headers },
          });
          supabaseResponse.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // 3. Ambil data user yang sedang mencoba masuk (PENTING: gunakan getUser agar cookie ter-refresh)
  const { data: { user } } = await supabase.auth.getUser();

  // 4. LOGIKA SATPAM (Role-Based Access Control)
  const url = request.nextUrl.pathname;
  const role = user?.user_metadata?.role;

  // Aturan A: Mau masuk dashboard tapi belum login? Tendang ke halaman login!
  if (url.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Aturan B: Orang sudah login, tapi sok-sokan buka halaman '/login' lagi?
  // Kembalikan mereka ke dashboard masing-masing.
  if (url === '/login' && user) {
    if (role === 'agen') {
      return NextResponse.redirect(new URL('/dashboard/agen', request.url));
    } else if (role === 'perusahaan') {
      return NextResponse.redirect(new URL('/dashboard/perusahaan', request.url));
    }
  }

  // Aturan C: Agen dilarang keras masuk ke dashboard perusahaan!
  if (url.startsWith('/dashboard/perusahaan') && role === 'agen') {
    return NextResponse.redirect(new URL('/dashboard/agen', request.url));
  }

  // Aturan D: Perusahaan dilarang keras masuk ke dashboard agen!
  if (url.startsWith('/dashboard/agen') && role === 'perusahaan') {
    return NextResponse.redirect(new URL('/dashboard/perusahaan', request.url));
  }

  return supabaseResponse;
}

// 5. Konfigurasi Rute Mana Saja yang Dijaga Satpam
export const config = {
  matcher: [
    /*
     * Satpam akan menjaga semua rute KECUALI:
     * - File statis & gambar (_next/static, _next/image, favicon.ico, dll)
     * - Jalur API (/api/...) karena API punya sistem keamanannya sendiri
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};