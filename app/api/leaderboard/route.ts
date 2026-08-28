import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { createAdminClient } from '@/lib/supabase/server';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const LEADERBOARD_KEY = 'eco_credits_leaderboard';

export async function GET() {
  try {
    const supabase = createAdminClient();

    const topFactories: string[] = await redis.zrange(LEADERBOARD_KEY, 0, 9, {
      rev: true,
      withScores: true,
    });

    const leaderboardData = [];
    const companyIds = [];

    for (let i = 0; i < topFactories.length; i += 2) {
      const id = topFactories[i];
      const score = topFactories[i + 1];
      leaderboardData.push({ id_perusahaan: id, total_poin: Number(score) });
      companyIds.push(id);
    }

    if (leaderboardData.length === 0) {
      return NextResponse.json({ message: "Leaderboard kosong.", data: [] }, { status: 200 });
    }

    // UPDATE PENTING: Ambil data dari industri_profiles
    const { data: companies, error } = await supabase
      .from('industri_profiles')
      .select('user_id, nama_perusahaan, url_dokumen_npwp')
      .in('user_id', companyIds);

    if (error) throw error;

    const finalLeaderboard = leaderboardData.map(item => {
      const company = companies.find(c => c.user_id === item.id_perusahaan);
      return {
        peringkat: 0,
        id_perusahaan: item.id_perusahaan,
        nama_perusahaan: company?.nama_perusahaan || 'Pabrik Anonim',
        poin_eco_credits: item.total_poin,
        avatar: company?.url_dokumen_npwp || null,
      };
    });

    finalLeaderboard.sort((a, b) => b.poin_eco_credits - a.poin_eco_credits);
    finalLeaderboard.forEach((item, index) => { item.peringkat = index + 1; });

    return NextResponse.json({ data: finalLeaderboard }, { status: 200 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error("Leaderboard API Error:", message);
    return NextResponse.json({ error: "Gagal memuat papan peringkat." }, { status: 500 });
  }
}