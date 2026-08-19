import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase khusus untuk dipakai di browser (client component) —
 * dipakai oleh form Masuk & Daftar untuk memanggil supabase.auth langsung.
 * Beda dari lib/supabase.ts yang dipakai di server (Server Component) untuk
 * membaca data leaderboard.
 *
 * Butuh NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY di
 * .env.local (sama seperti yang dipakai leaderboard).
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY belum diisi di .env.local"
    );
  }

  return createBrowserClient(url, key);
}
