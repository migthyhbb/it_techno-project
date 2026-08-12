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
// Inisialisasi Supabase menggunakan Service Role agar aman dari RLS (Row Level Security) saat insert data internal
const supabase = createAdminClient();

export async function POST(request: Request) {
  try {
    // 1. Tangkap Payload dari Front-End
    const body = await request.json();
    const { id_perusahaan, deskripsi_input, berat_kg } = body;

    // Validasi input kosong (Keamanan Lapis 1)
    if (!id_perusahaan || !deskripsi_input || !berat_kg) {
      return NextResponse.json(
        { error: "Data tidak lengkap. id_perusahaan, deskripsi_input, dan berat_kg wajib diisi." },
        { status: 400 }
      );
    }

    // 2. HEURISTIC FILTER (Smart Router Jalur Cepat)
    // Kata kunci limbah aman yang bisa kita olah di pabrik internal
    const kataKunciAman = [
      'kardus', 'kertas', 'plastik', 'botol', 'kayu', 
      'serbuk', 'daun', 'organik', 'besi', 'kaleng'
    ];
    
    // Ubah input pabrik jadi huruf kecil semua agar gampang dicocokkan
    const inputLowerCase = deskripsi_input.toLowerCase();
    
    // Cek apakah ada salah satu kata kunci aman di dalam deskripsi input pabrik
    const isOtomatisAman = kataKunciAman.some(kata => inputLowerCase.includes(kata));

    let kategori = '';
    let jalur_proses = '';

    if (isOtomatisAman) {
      // Masuk Jalur Hijau (Non-B3) -> Hilirisasi Internal
      kategori = 'NON_B3';
      jalur_proses = 'IN_HOUSE';
    } else {
      // ---------------------------------------------------------
      // TODO (FASE 2): Integrasi Gemini AI & Upstash QStash di sini
      // ---------------------------------------------------------
      // Jika kata tidak dikenali, anggap sebagai B3 dulu demi keamanan (Fail-Safe),
      // Nantinya, kodingan AI akan mengambil alih keputusan di blok ini.
      const workerUrl = process.env.NODE_ENV === 'production' 
        ? 'https://domain-itechno-abang.com/api/limbah/worker-ai'
        : 'https://[URL-NGROK-ABANG]/api/limbah/worker-ai';

      await qstash.publishJSON({
        url: workerUrl,
        body: { id_perusahaan, deskripsi_input, berat_kg },
        retries: 3 // Kalau AI error, QStash akan otomatis mencoba ulang 3 kali!
      });

      // Langsung kembalikan respons cepat ke user!
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
          status: 'menunggu_penjemputan' // Status awal
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Supabase Insert Error:", insertError);
      throw new Error("Gagal menyimpan data ke database.");
    }
    // ... (kodingan insert Supabase abang sebelumnya) ...
    if (insertError) {
      console.error("Supabase Insert Error:", insertError);
      throw new Error("Gagal menyimpan data ke database.");
    }

    // ==========================================
    // SUNTIKAN REDIS LEADERBOARD (GAMIFIKASI)
    // ==========================================
    // Kita HANYA memberikan poin jika limbahnya NON_B3 (Bisa diolah / Ramah lingkungan)
    let poinDidapat = 0;
    if (kategori === 'NON_B3') {
      // Rumus Poin: 1 Kg limbah = 10 Eco-Credits (Bisa abang ubah rumusnya)
      poinDidapat = Math.round(berat_kg * 10);
      
      // Tambahkan poin ke Leaderboard Redis secara real-time!
      await redis.zincrby('eco_credits_leaderboard', poinDidapat, id_perusahaan);

      // (Opsional tapi disarankan): Update juga kolom 'eco_credits' di tabel 'perusahaan' 
      // agar sinkron antara Redis (RAM) dan Supabase (Harddisk)
      const { data: currentPabrik } = await supabase
        .from('perusahaan')
        .select('eco-credits')
        .eq('id', id_perusahaan)
        .single();
        
        
     // Tambahkan Type Assertion (as any) agar TypeScript diam
      const currentData = currentPabrik as any;
      const saldoPoinLama = currentData ? Number(currentData['eco-credits']) : 0;
      
      const saldoPoinBaru = saldoPoinLama + poinDidapat;
      
      await supabase
        .from('perusahaan')
        .update({ 'eco-credits': saldoPoinBaru })
        .eq('id', id_perusahaan);
      await supabase.from('perusahaan').update({ 'eco-credits': saldoPoinBaru }).eq('id', id_perusahaan);
    }
    // ==========================================
    // 4. BERIKAN RESPON KE FRONT-END
    
   // 4. BERIKAN RESPON KE FRONT-END
    return NextResponse.json({
      message: "Setoran limbah berhasil dicatat.",
      routing_result: {
        kategori_terdeteksi: kategori,
        jalur_keputusan: jalur_proses
      },
      poin_tambahan: poinDidapat, // <-- Tambahkan info ini untuk UI Front-End
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