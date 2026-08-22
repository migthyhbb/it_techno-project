import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server'; 
import { Redis } from '@upstash/redis';
import { Client as QStashClient } from "@upstash/qstash";

const qstash = new QStashClient({ token: process.env.QSTASH_TOKEN! });

// Inisialisasi Redis (Pastikan env sudah terpasang)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Inisialisasi Supabase menggunakan Service Role agar aman
const supabase = createAdminClient();

export async function POST(request: Request) {
  try {
    // 1. Tangkap Payload dari Front-End
    const body = await request.json();
    const { id_perusahaan, deskripsi_input, berat_kg } = body;

    // Validasi input kosong
    if (!id_perusahaan || !deskripsi_input || !berat_kg) {
      return NextResponse.json(
        { error: "Data tidak lengkap. id_perusahaan, deskripsi_input, dan berat_kg wajib diisi." },
        { status: 400 }
      );
    }

    // 2. HEURISTIC FILTER (Smart Router Jalur Cepat)
    const kataKunciAman = [
      'kardus', 'kertas', 'plastik', 'botol', 'kayu', 
      'serbuk', 'daun', 'organik', 'besi', 'kaleng'
    ];
    
    const inputLowerCase = deskripsi_input.toLowerCase();
    const isOtomatisAman = kataKunciAman.some(kata => inputLowerCase.includes(kata));

    let kategori = '';
    let jalur_proses = '';

    if (isOtomatisAman) {
      kategori = 'NON_B3';
      jalur_proses = 'IN_HOUSE';
    } else {
      // Jika kata tidak dikenali, lemparkan ke AI (QStash)
      const workerUrl = process.env.NODE_ENV === 'production' 
        ? 'https://domain-itechno-abang.com/api/limbah/worker-ai'
        : 'https://[URL-NGROK-ABANG]/api/limbah/worker-ai';

      await qstash.publishJSON({
        url: workerUrl,
        body: { id_perusahaan, deskripsi_input, berat_kg },
        retries: 3 
      });

      return NextResponse.json({
        message: "Limbah ambigu. Sedang dianalisis oleh AI di latar belakang.",
        status: "processing"
      }, { status: 202 });
    }

    // 3. SIMPAN KE DATABASE (Tabel transaksi_limbah)
    const { data: insertData, error: insertError } = await supabase
      .from('transaksi_limbah')
      .insert([
        {
          id_perusahaan: id_perusahaan,
          deskripsi_input: deskripsi_input,
          berat_kg: berat_kg,
          kategori: kategori,
          jalur_proses: jalur_proses,
          status: 'menunggu_penjemputan' 
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Supabase Insert Error:", insertError);
      throw new Error("Gagal menyimpan data ke database.");
    }

    // ==========================================
    // SUNTIKAN REDIS LEADERBOARD (GAMIFIKASI)
    // ==========================================
    let poinDidapat = 0;
    if (kategori === 'NON_B3') {
      poinDidapat = Math.round(berat_kg * 10);
      
      // Tambahkan poin ke Leaderboard Redis
      await redis.zincrby('eco_credits_leaderboard', poinDidapat, id_perusahaan);

      const { data: currentPabrik } = await supabase
        .from('perusahaan')
        .select('eco-credits')
        .eq('id', id_perusahaan)
        .single();
        
      const currentData = currentPabrik as any;
      const saldoPoinLama = currentData ? Number(currentData['eco-credits']) : 0;
      const saldoPoinBaru = saldoPoinLama + poinDidapat;
      
      // Update poin di database Supabase (Cukup 1 kali eksekusi)
      await supabase
        .from('perusahaan')
        .update({ 'eco-credits': saldoPoinBaru })
        .eq('id', id_perusahaan);
    }
    
    // 4. BERIKAN RESPON KE FRONT-END
    return NextResponse.json({
      message: "Setoran limbah berhasil dicatat.",
      routing_result: {
        kategori_terdeteksi: kategori,
        jalur_keputusan: jalur_proses
      },
      poin_tambahan: poinDidapat,
      data: insertData
    }, { status: 201 });

  } catch (error: any) {
    console.error("API Setoran Limbah Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server (Smart Router)." },
      { status: 500 }
    );
  }
}