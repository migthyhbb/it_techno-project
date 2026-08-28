import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
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
    const poinNumber = Number(jumlah_poin);

    if (!poinNumber || poinNumber < 100) {
      return NextResponse.json({ error: "Minimal penukaran 100 Token." }, { status: 400 });
    }

    // 1. BACA SALDO SAAT INI DULU (Buat hitung-hitungan)
    const { data: profile } = await supabase
      .from('industri_profiles')
      .select('saldo_kredit')
      .eq('user_id', user.id)
      .single();

    const saldoSekarang = profile?.saldo_kredit || 0;

    if (saldoSekarang < poinNumber) {
      return NextResponse.json({ error: "Token tidak mencukupi!" }, { status: 400 });
    }

    // 2. ATOMIC TRANSACTION (ANTI RACE-CONDITION)
    // Cuma mau update KALAU saldonya masih benar-benar cukup saat query ini jalan (mencegah bot multi-klik)
    const supabaseAdmin = createAdminClient();
    const saldoBaru = saldoSekarang - poinNumber;

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('industri_profiles')
      .update({ saldo_kredit: saldoBaru })
      .eq('user_id', user.id)
      .gte('saldo_kredit', poinNumber) // JURUS SAKTI: Pastikan saldo di DB >= jumlah poin yang dicairkan
      .select('saldo_kredit')
      .maybeSingle();

    if (updateError) throw updateError;

    if (!updatedProfile) {
      // Kalau nilainya kosong, berarti filter .gte() di atas gagal (saldo sudah ditarik di request lain)
      return NextResponse.json({ error: "Transaksi digagalkan. Saldo berubah." }, { status: 409 });
    }

    // 3. Catat Riwayat Pencairan (Supaya bisa di-audit)
    await supabaseAdmin.from('pencairan_dana').insert([{
      id_agen: user.id,
      jumlah_tarik_tunai: poinNumber,
      bank_tujuan: metode_pencairan,
      status: 'Selesai'
    }]);

    // 4. SINKRONISASI KE REDIS LEADERBOARD (Turunkan Peringkatnya secara real-time)
    await redis.zincrby('eco_credits_leaderboard', -Math.abs(poinNumber), user.id);

    return NextResponse.json({
      message: `Berhasil menukar ${poinNumber} token!`,
      sisa_poin: updatedProfile.saldo_kredit
    }, { status: 200 });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Terjadi kesalahan internal";
    console.error("Redeem API Error:", msg);
    return NextResponse.json({ error: "Gagal memproses penukaran poin." }, { status: 500 });
  }
}