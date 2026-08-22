import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { jumlah_poin, metode_pencairan } = body;

    if (!jumlah_poin || jumlah_poin < 100) {
      return NextResponse.json({ error: "Minimal penukaran adalah 100 Poin Eco-Credits." }, { status: 400 });
    }


    // 1. Cek Saldo Poin Saat Ini di Database
    const { data: profile } = await supabase
      .from('perusahaan') // atau 'agen', sesuaikan dengan tabel profil
      .select('eco-credits')
      .eq('auth_id', user.id)
      .single();

    // 🛠️ PERBAIKAN: Beritahu TypeScript bentuk asli datanya
    const profileData = profile as { 'eco-credits': number } | null;
    
    // Sekarang TypeScript tidak akan protes lagi!
    const saldoSekarang = profileData?.['eco-credits'] || 0;

    if (saldoSekarang < jumlah_poin) {
      return NextResponse.json({ error: "Poin Eco-Credits tidak mencukupi!" }, { status: 400 });
    }

    if (saldoSekarang < jumlah_poin) {
      return NextResponse.json({ error: "Poin Eco-Credits tidak mencukupi!" }, { status: 400 });
    }

    // 2. ATOMIC TRANSACTION: Potong Saldo & Catat Riwayat
    const saldoBaru = saldoSekarang - jumlah_poin;

    const { error: updateError } = await supabase
      .from('perusahaan')
      .update({ 'eco-credits': saldoBaru })
      .eq('auth_id', user.id);

    if (updateError) throw updateError;

    // Catat ke tabel riwayat (Opsional tapi penting untuk audit)
    await supabase.from('riwayat_redeem').insert([{
      auth_id: user.id,
      poin_dipotong: jumlah_poin,
      metode: metode_pencairan, // e.g., 'Transfer Bank', 'Voucher Briket'
      status: 'diproses'
    }]);

    // 3. SINKRONISASI KE REDIS LEADERBOARD (Turunkan Peringkatnya!)
    // Menggunakan angka negatif untuk mengurangi score di Sorted Set Redis
    await redis.zincrby('eco_credits_leaderboard', -Math.abs(jumlah_poin), user.id);

    return NextResponse.json({ 
      message: `Berhasil menukar ${jumlah_poin} poin! Permintaan sedang diproses tim keuangan.`,
      sisa_poin: saldoBaru
    }, { status: 200 });

  } catch (error: unknown) { // <-- PERBAIKAN DI SINI: ganti 'any' jadi 'unknown'
    // PERBAIKAN PENGOLAHAN ERROR
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Redeem API Error:", errorMessage);
    
    return NextResponse.json(
      { error: "Gagal memproses penukaran poin." }, 
      { status: 500 }
    );
  }
}