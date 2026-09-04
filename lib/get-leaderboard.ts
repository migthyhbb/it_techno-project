import { getUpstashClient, getIoRedisClient } from "./redis";
import { getSupabaseClient } from "./supabase";
import { leaderboardEntries as dummyLeaderboardEntries, type LeaderboardEntry } from "./leaderboard-data";
const REDIS_KEY = "leaderboard:entries";

/**
 * Tiap member di sorted set diasumsikan berupa JSON string berisi field
 * LeaderboardEntry TANPA "rank" (mis. {"name":"...","initials":"...",...}),
 * dengan score = volume dalam angka (mis. 1480), supaya ZREVRANGE otomatis
 * mengurutkan dari yang terbesar. Rank diisi berdasarkan urutan hasilnya.
 * Kalau struktur data di Redis kamu beda, sesuaikan fungsi ini.
 */
function parseRedisMembers(members: string[]): LeaderboardEntry[] {
  return members.map((item, i) => {
    const parsed = JSON.parse(item);
    return { rank: i + 1, ...parsed };
  });
}

/**
 * Mengambil data papan peringkat, dengan urutan prioritas:
 *   1. Redis via Upstash (REST), jika UPSTASH_REDIS_REST_URL +
 *      UPSTASH_REDIS_REST_TOKEN sudah diisi — cocok untuk deploy
 *      serverless/edge (mis. Vercel Edge Runtime).
 *   2. Redis via koneksi TCP langsung (ioredis), jika REDIS_URL sudah
 *      diisi — cocok untuk Redis self-hosted / Redis Cloud / server
 *      Node.js biasa.
 *   3. Supabase, jika NEXT_PUBLIC_SUPABASE_URL + (SUPABASE_SERVICE_ROLE_KEY
 *      atau NEXT_PUBLIC_SUPABASE_ANON_KEY) sudah diisi.
 *   4. REST API custom, jika LEADERBOARD_API_URL sudah diisi.
 *   5. Data dummy di lib/leaderboard-data.ts (supaya halaman tidak pernah
 *      rusak walau backend belum siap / lagi down).
 *
 * Dipanggil dari Server Component (app/page.tsx), hasilnya dioper sebagai
 * prop ke <Leaderboard entries={...} /> — komponennya sendiri tetap
 * "use client" karena butuh animasi Motion, jadi fetching harus terjadi
 * di luar komponen itu.
 */
export async function getLeaderboardEntries(): Promise<LeaderboardEntry[]> {
  const upstash = getUpstashClient();
  if (upstash) {
    try {
      const raw = await upstash.zrange<string[]>(REDIS_KEY, 0, 4, { rev: true });
      if (raw.length > 0) return parseRedisMembers(raw);
    } catch (err) {
      console.error("Gagal mengambil leaderboard dari Redis (Upstash), pakai data dummy:", err);
    }
    return dummyLeaderboardEntries;
  }

  const ioredis = getIoRedisClient();
  if (ioredis) {
    try {
      const raw = await ioredis.zrevrange(REDIS_KEY, 0, 4);
      if (raw.length > 0) return parseRedisMembers(raw);
    } catch (err) {
      console.error("Gagal mengambil leaderboard dari Redis (TCP), pakai data dummy:", err);
    }
    return dummyLeaderboardEntries;
  }

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
