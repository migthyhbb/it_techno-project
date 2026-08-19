import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Client Supabase dengan SERVICE ROLE KEY — akses penuh, melewati RLS.
 * HANYA boleh dipakai di server (Route Handler / Server Component), TIDAK
 * PERNAH diimpor dari file "use client", karena kalau bocor ke browser
 * siapapun bisa baca/tulis semua data.
 *
 * Ini dipakai khusus untuk proses pendaftaran (lihat app/api/daftar/...),
 * supaya pembuatan akun + penyimpanan profil terjadi dalam satu langkah di
 * server, tidak bergantung pada sesi login di browser yang belum tentu ada
 * (itu penyebab bug "akun kebuat tapi profil kosong" sebelumnya).
 */
export function getSupabaseAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diisi di .env.local"
    );
  }

  if (!client) {
    client = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return client;
}
