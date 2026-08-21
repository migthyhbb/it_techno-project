import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server'; 
import { Redis } from '@upstash/redis';
import { Client as QStashClient } from "@upstash/qstash";

const qstash = new QStashClient({ token: process.env.QSTASH_TOKEN! });
const redis = Redis.fromEnv(); // Lebih bersih pakai fromEnv() bawaan SDK
const supabase = createAdminClient();

export async function POST(request: Request) {
  try {
    const { id_perusahaan, deskripsi_input, berat_kg } = await request.json();

    if (!id_perusahaan || !deskripsi_input || !berat_kg) {
      return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
    }

    const kataKunciAman = ['kardus', 'kertas', 'plastik', 'botol', 'kayu', 'serbuk', 'daun', 'organik', 'besi', 'kaleng'];
    const isOtomatisAman = kataKunciAman.some(kata => deskripsi_input.toLowerCase().includes(kata));

    let kategori = '';
    let jalur_proses = '';

    if (isOtomatisAman) {
      kategori = 'NON_B3';
      jalur_proses = 'IN_HOUSE';
    } else {
      const workerUrl = process.env.NODE_ENV === 'production' 
        ? 'https://domain-itechno-abang.com/api/limbah/worker-ai'
        : 'https://[URL-NGROK-ABANG]/api/limbah/worker-ai';

      await qstash.publishJSON({ url: workerUrl, body: { id_perusahaan, deskripsi_input, berat_kg }, retries: 3 });

      return NextResponse.json({
        message: "Limbah ambigu. Sedang dianalisis oleh AI di latar belakang.",
        status: "processing"
      }, { status: 202 });
    }

    // 1. SIMPAN TRANSAKSI
    const { data: insertData, error: insertError } = await supabase
      .from('transaksi_limbah')
      .insert([{ id_perusahaan, deskripsi_input, berat_kg, kategori, jalur_proses, status: 'menunggu_penjemputan' }])
      .select().single();

    if (insertError) throw new Error("Gagal menyimpan data ke database.");

    // 2. BERIKAN POIN JIKA NON B3
    let poinDidapat = 0;
    if (kategori === 'NON_B3') {
      poinDidapat = Math.round(berat_kg * 10);
      
      // Update Redis (Super Cepat)
      await redis.zincrby('eco_credits_leaderboard', poinDidapat, id_perusahaan);

      // Sinkronkan ke Supabase (Source of Truth)
    // Sinkronkan ke Supabase (Source of Truth)
const { data: currentData } = await supabase.from('perusahaan').select('eco-credits').eq('id', id_perusahaan).single();

// === GANTI BARIS INI ===
const saldoBaru = Number((currentData as any)?.['eco-credits'] || 0) + poinDidapat;

await supabase.from('perusahaan').update({ 'eco-credits': saldoBaru }).eq('id', id_perusahaan);
      await supabase.from('perusahaan').update({ 'eco-credits': saldoBaru }).eq('id', id_perusahaan);
    }
    
    return NextResponse.json({
      message: "Setoran limbah berhasil dicatat.",
      routing_result: { kategori_terdeteksi: kategori, jalur_keputusan: jalur_proses },
      poin_tambahan: poinDidapat,
      data: insertData
    }, { status: 201 });

  } catch (error: any) {
    console.error("API Setoran Limbah Error:", error.message);
    return NextResponse.json({ error: "Terjadi kesalahan pada server (Smart Router)." }, { status: 500 });
  }
}