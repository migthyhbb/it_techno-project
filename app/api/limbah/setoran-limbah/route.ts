import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { Client as QStashClient } from "@upstash/qstash";
import { Redis } from "@upstash/redis";

const qstash = new QStashClient({ token: process.env.QSTASH_TOKEN! });
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(request: Request) {
  try {
    // 1. Ambil Token Autentikasi dari Header
    const authHeader = request.headers.get("Authorization");
    const supabase = await createClient();
    
    let userId: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) userId = user.id;
    }

    // Fallback jika token dikirim via Cookie Sesi Server
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) userId = user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "Sesi tidak valid / Belum login." }, { status: 401 });
    }

    // Rate Limiting via Redis
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";
    const rateLimitKey = `rate-limit:setoran-limbah:${ip}`;
    const requestCount = await redis.incr(rateLimitKey);
    if (requestCount === 1) await redis.expire(rateLimitKey, 60);
    if (requestCount > 5) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Coba lagi dalam satu menit." },
        { status: 429 }
      );
    }

    // 2. Tangkap Payload Lengkap (Biasa & B3)
    const {
      deskripsi_input,
      berat_kg,
      lokasi,
      foto_url,
      is_b3,
      kategori_b3,
      biaya_pengolahan,
      status
    } = await request.json();

    if (!deskripsi_input || !berat_kg || !lokasi) {
      return NextResponse.json({ error: "Data limbah tidak lengkap." }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // 3. JIKA PERMINTAAN LIMBAH B3: LANGSUNG CATAT DENGAN STATUS "Menunggu Pembayaran"
    if (is_b3) {
      const { data, error } = await supabaseAdmin.from('waste_shipments').insert([{
        user_id: userId,
        nama_limbah: deskripsi_input,
        perkiraan_berat: berat_kg,
        lokasi_penjemputan: lokasi,
        kategori: 'B3',
        kategori_b3: kategori_b3 || null,
        biaya_pengolahan: biaya_pengolahan || null,
        is_b3: true,
        foto_url: foto_url || "",
        status: status || 'Menunggu Pembayaran'
      }]).select().single();

      if (error) throw error;

      return NextResponse.json({
        message: "Limbah B3 berhasil didaftarkan.",
        data
      }, { status: 201 });
    }

    // 4. HEURISTIC FILTER (Jalur Cepat Non-B3)
    const kataKunciAman = ['kardus', 'kertas', 'plastik', 'botol', 'kayu', 'serbuk', 'daun', 'organik'];
    const inputLowerCase = deskripsi_input.toLowerCase();
    const isOtomatisAman = kataKunciAman.some(kata => inputLowerCase.includes(kata));

    if (isOtomatisAman) {
      const poin = Math.round(berat_kg * 10);

      const { data, error } = await supabaseAdmin.from('waste_shipments').insert([{
        user_id: userId,
        nama_limbah: deskripsi_input,
        perkiraan_berat: berat_kg,
        lokasi_penjemputan: lokasi,
        kategori: 'NON_B3',
        jalur_proses: 'IN_HOUSE',
        poin_didapat: poin,
        foto_url: foto_url || "",
        status: 'Menunggu Penjemputan'
      }]).select().single();

      if (error) throw error;

      return NextResponse.json({
        message: "Setoran limbah dicatat. Menunggu penjemputan.",
        kategori: "NON_B3",
        poin_tambahan: poin,
        data
      }, { status: 201 });

    } else {
      // 5. PROSES AMBIGU: Lempar ke AI Worker (QStash)
      const workerUrl = process.env.NODE_ENV === 'production'
        ? `https://${process.env.VERCEL_URL}/api/limbah/worker`
        : process.env.NGROK_URL + '/api/limbah/worker';

      await qstash.publishJSON({
        url: workerUrl,
        body: { user_id: userId, deskripsi_input, berat_kg, lokasi, foto_url },
        retries: 3
      });

      return NextResponse.json({
        message: "Limbah sedang dianalisis secara mendalam oleh AI LENTERA.",
        status: "processing"
      }, { status: 202 });
    }

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Kesalahan server internal.";
    console.error("API Setoran Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}