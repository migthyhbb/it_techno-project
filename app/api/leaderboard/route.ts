import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { createAdminClient } from '@/lib/supabase/server';

export const revalidate = 30; // SUPER PENTING: Cache respon selama 30 detik (Meringankan Database 99%)

const redis = Redis.fromEnv();
const LEADERBOARD_KEY = 'eco_credits_leaderboard';

export async function GET() {
  try {
    const supabase = createAdminClient();

    // 1. Tarik dari Redis
    const topFactories: string[] = await redis.zrange(LEADERBOARD_KEY, 0, 9, { rev: true, withScores: true });

    if (topFactories.length === 0) {
      return NextResponse.json({ message: "Leaderboard masih kosong.", data: [] }, { status: 200 });
    }

    const leaderboardData = [];
    const companyIds = [];
    for (let i = 0; i < topFactories.length; i += 2) {
      leaderboardData.push({ id_perusahaan: topFactories[i], total_poin: Number(topFactories[i + 1]) });
      companyIds.push(topFactories[i]);
    }

    // 2. Tarik Profil dari Supabase (Di-cache Next.js!)
    const { data: companies, error } = await supabase
      .from('perusahaan')
      .select('id, nama_perusahaan, url_dokumen_npwp')
      .in('id', companyIds);

    if (error) throw new Error("Supabase fetch failed");

    const finalLeaderboard = leaderboardData.map((item, index) => {
      const company = companies.find(c => c.id === item.id_perusahaan);
      return {
        peringkat: index + 1,
        id_perusahaan: item.id_perusahaan,
        nama_perusahaan: company?.nama_perusahaan || 'Pabrik Anonim',
        poin_eco_credits: item.total_poin,
        avatar: company?.url_dokumen_npwp || null,
      };
    });

    return NextResponse.json({ message: "Data Leaderboard berhasil diambil.", data: finalLeaderboard }, { status: 200 });

  } catch (error: any) {
    console.error("Leaderboard API Error:", error.message);
    return NextResponse.json({ error: "Terjadi kesalahan saat memuat papan peringkat." }, { status: 500 });
  }
}