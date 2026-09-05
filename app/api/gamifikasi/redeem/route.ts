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

    // 1. Hitung total kredit riil dari limbah terkirim (Status 'selesai')
    const { data: shipmentData } = await supabase
      .from("waste_shipments")
      .select("perkiraan_berat, status")
      .eq("user_id", user.id);

    const totalKg = (shipmentData || [])
      .filter((s) => String(s.status).toLowerCase() === "selesai")
      .reduce((sum, s) => sum + Number(s.perkiraan_berat || 0), 0);

    const grossToken = totalKg * 100;

    // 2. Hitung total token yang sudah dicairkan sebelumnya
    const { data: withdrawData } = await supabase
      .from("pencairan_dana")
      .select("jumlah_tarik_tunai")
      .eq("id_agen", user.id);

    const totalDicairkan = (withdrawData || []).reduce(
      (sum, w) => sum + Number(w.jumlah_tarik_tunai || 0),
      0
    );

    const saldoTersedia = grossToken - totalDicairkan;

    if (saldoTersedia < poinNumber) {
      return NextResponse.json({ error: `Token tidak mencukupi! Saldo Anda: ${saldoTersedia}` }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // 3. Catat transaksi pencairan baru
    const { error: insertError } = await supabaseAdmin.from('pencairan_dana').insert([{
      id_agen: user.id,
      jumlah_tarik_tunai: poinNumber,
      bank_tujuan: metode_pencairan,
      status: 'Selesai'
    }]);

    if (insertError) throw insertError;

    // 4. Update saldo_kredit di profil jika kolomnya dipakai
    const { data: profile } = await supabase
      .from('industri_profiles')
      .select('saldo_kredit')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profile) {
      const currentKreditDB = Number(profile.saldo_kredit || 0);
      await supabaseAdmin
        .from('industri_profiles')
        .update({ saldo_kredit: Math.max(0, currentKreditDB - poinNumber) })
        .eq('user_id', user.id);
    }

    // 5. Update Leaderboard Redis (Abaikan jika Redis offline)
    try {
      await redis.zincrby('eco_credits_leaderboard', -Math.abs(poinNumber), user.id);
    } catch (redisErr) {
      console.warn("Redis Update Warning:", redisErr);
    }

    return NextResponse.json({
      message: `Berhasil menukar ${poinNumber} token!`,
      sisa_poin: saldoTersedia - poinNumber
    }, { status: 200 });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Terjadi kesalahan internal";
    console.error("Redeem API Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}