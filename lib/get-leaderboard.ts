import { getSupabaseClient } from "./supabase";
import { leaderboardEntries as dummyLeaderboardEntries, type LeaderboardEntry } from "./leaderboard-data";

/**
 * Mengambil data papan peringkat, dengan urutan prioritas:
 *   1. Supabase, jika NEXT_PUBLIC_SUPABASE_URL + (SUPABASE_SERVICE_ROLE_KEY
 *      atau NEXT_PUBLIC_SUPABASE_ANON_KEY) sudah diisi di .env.local
 *   2. REST API custom, jika LEADERBOARD_API_URL sudah diisi
 *   3. Data dummy di lib/leaderboard-data.ts (supaya halaman tidak pernah
 *      rusak walau backend belum siap / lagi down)
 *
 * Dipanggil dari Server Component (app/page.tsx), hasilnya dioper sebagai
 * prop ke <Leaderboard entries={...} /> — komponennya sendiri tetap
 * "use client" karena butuh animasi Motion, jadi fetching harus terjadi
 * di luar komponen itu.
 */
export async function getLeaderboardEntries(): Promise<LeaderboardEntry[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("leaderboard_entries")
        .select("rank, name, initials, industry, volume, logo_type, logo_url, accent")
        .order("rank", { ascending: true })
        .limit(5);

      if (error) throw error;
      if (data && data.length > 0) {
        return data.map((row) => ({
          rank: row.rank,
          name: row.name,
          initials: row.initials,
          industry: row.industry,
          volume: row.volume,
          logoType: row.logo_type,
          logoUrl: row.logo_url ?? undefined,
          accent: row.accent,
        }));
      }
    } catch (err) {
      console.error("Gagal mengambil leaderboard dari Supabase, pakai data dummy:", err);
    }
    return dummyLeaderboardEntries;
  }

  const apiUrl = process.env.LEADERBOARD_API_URL;
  if (apiUrl) {
    try {
      const res = await fetch(apiUrl, { next: { revalidate: 3600 } });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data: LeaderboardEntry[] = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    } catch (err) {
      console.error("Gagal mengambil leaderboard dari API custom, pakai data dummy:", err);
    }
    return dummyLeaderboardEntries;
  }

  return dummyLeaderboardEntries;
}
