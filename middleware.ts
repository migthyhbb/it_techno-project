import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createServerClient } from "@supabase/ssr";

// ==========================================
// 1. SETUP SATPAM REDIS (ANTI-SPAM)
// ==========================================
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 s"),
  prefix: "middleware-ratelimit",
});

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.pathname;

  // ==========================================
  // 2. LOGIK RATE LIMITING (Khusus API)
  // ==========================================
  if (url.startsWith("/api/transaksi/") || url.startsWith("/api/daftar/")) {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "127.0.0.1";

    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: "Too Many Requests" },
        { status: 429 }
      );
    }
    // Kalau aman, langsung lolos ke API (nggak perlu dicek UI Auth)
    return NextResponse.next();
  }

  // Abaikan sisa rute API lainnya agar tidak dicegat oleh proxy halaman
  if (url.startsWith("/api/")) {
    return NextResponse.next();
  }

  // ==========================================
  // 3. LOGIK SUPABASE AUTH (Khusus Halaman Web)
  // ==========================================
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
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const redirectSambilBawaCookie = (tujuan: string) => {
    const redirectRes = NextResponse.redirect(new URL(tujuan, request.url));
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectRes;
  };

  const isDashboardRoute =
    url.startsWith("/dashboard") ||
    url.startsWith("/dashboard-admin") ||
    url.startsWith("/dashboard-industri");

  if (isDashboardRoute && !user) return redirectSambilBawaCookie("/masuk");

  const role = user?.app_metadata?.role || "mitra";

  if ((url === "/masuk" || url === "/login" || url === "/daftar") && user) {
    if (role === "admin") return redirectSambilBawaCookie("/dashboard-admin");
    if (role === "industri") return redirectSambilBawaCookie("/dashboard-industri");
    return redirectSambilBawaCookie("/dashboard");
  }

  const areaByRole: Record<string, string> = {
    mitra: "/dashboard",
    agen: "/dashboard",
    industri: "/dashboard-industri",
    admin: "/dashboard-admin",
  };

  if (isDashboardRoute) {
    const allowedArea = areaByRole[role] || "/dashboard";
    const isAllowedPath = url === allowedArea || url.startsWith(`${allowedArea}/`);

    if (!isAllowedPath) return redirectSambilBawaCookie(allowedArea);
  }

  return supabaseResponse;
}

// Matcher ini digabung! Menangkap SEMUA kecuali file statis (gambar, css, dll)
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};