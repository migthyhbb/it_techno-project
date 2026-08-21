import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { createAdminClient } from '@/lib/supabase/server';

// Inisialisasi koneksi ke Upstash Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Nama 'Kunci' (Key) untuk Sorted Set di Redis
const LEADERBOARD_KEY = 'eco_credits_leaderboard';

export async function GET() {
  try {
    const supabase = createAdminClient();

    // ==========================================
    // 1. TARIK DATA DARI REDIS (Secepat Kilat!)
    // ==========================================
    // ZREVRANGE: Ambil peringkat dari skor tertinggi ke terendah (Top 10)
    // WITHSCORES: Sertakan jumlah poinnya
    const topFactories: string[] = await redis.zrange(LEADERBOARD_KEY, 0, 9, {
      rev: true,
      withScores: true,
    });

    // Hasil dari Upstash formatnya array 1D: ["id-perusahaan-1", 500, "id-perusahaan-2", 300]
    // Kita harus merapikannya jadi array of objects agar Front-End gampang bacanya
    const leaderboardData = [];
    const companyIds = [];

    for (let i = 0; i < topFactories.length; i += 2) {
      const id = topFactories[i];
      const score = topFactories[i + 1];
      leaderboardData.push({ id_perusahaan: id, total_poin: Number(score) });
      companyIds.push(id);
    }

    if (leaderboardData.length === 0) {
      return NextResponse.json({ message: "Leaderboard masih kosong.", data: [] }, { status: 200 });
    }

    // ==========================================
    // 2. AMBIL NAMA PERUSAHAAN DARI SUPABASE
    // ==========================================
    // Redis sangat cepat, tapi hanya menyimpan ID dan Skor.
    // Kita ambil nama perusahaan aslinya dari database SQL untuk ditampilkan di UI.
    const { data: companies, error } = await supabase
      .from('perusahaan')
      .select('id, nama_perusahaan, url_dokumen_npwp') // Ambil foto juga buat avatar (kalau mau)
      .in('id', companyIds);

    if (error) {
      console.error("Gagal mengambil nama perusahaan:", error);
      throw new Error("Supabase fetch failed");
    }

    // Gabungkan data Skor (Redis) dengan Profil (Supabase)
    const finalLeaderboard = leaderboardData.map(item => {
      const company = companies.find(c => c.id === item.id_perusahaan);
      return {
        peringkat: 0, // Akan diisi di bawah
        id_perusahaan: item.id_perusahaan,
        nama_perusahaan: company?.nama_perusahaan || 'Pabrik Anonim',
        poin_eco_credits: item.total_poin,
        avatar: company?.url_dokumen_npwp || null,
      };
    });

    // Urutkan ulang memastikan posisinya tepat (karena query IN kadang acak) dan beri nomor urut
    finalLeaderboard.sort((a, b) => b.poin_eco_credits - a.poin_eco_credits);
    finalLeaderboard.forEach((item, index) => { item.peringkat = index + 1; });

    return NextResponse.json({
      message: "Data Leaderboard Real-time berhasil diambil.",
      data: finalLeaderboard
    }, { status: 200 });

  } catch (error: any) {
    console.error("Leaderboard API Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memuat papan peringkat." }, 
      { status: 500 }
    );
  }
}