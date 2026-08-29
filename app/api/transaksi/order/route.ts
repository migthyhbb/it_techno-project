import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import midtransClient from 'midtrans-client';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '10 s'),
  prefix: 'transaksi-order',
});

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || '127.0.0.1';

    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan. Silakan tunggu beberapa detik.' },
        { status: 429 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Sesi habis, silakan login ulang." }, { status: 401 });

    const body = await request.json() as Record<string, unknown>;
    const volume_terjual_kg = Number(body.volume_terjual_kg);
    const produk_id = String(body.produk_id || "");

    if (!volume_terjual_kg || volume_terjual_kg <= 0 || !produk_id) {
      return NextResponse.json({ error: "Data pesanan tidak valid." }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // 1. Ambil data produk (Untuk tahu harganya)
    const { data: product } = await supabaseAdmin.from('products').select('*').eq('id', produk_id).single();
    const harga = product?.harga_default || product?.price || 15000; // Harga fallback
    const totalBayar = volume_terjual_kg * harga;
    const orderId = `AGEN-${Date.now()}`;

    // 2. Buat Transaksi Midtrans
    const snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
    });

    const parameter = {
      transaction_details: { order_id: orderId, gross_amount: totalBayar },
      customer_details: { first_name: "Mitra", email: user.email }
    };
    const transaction = await snap.createTransaction(parameter);

    // 3. Catat ke Database dengan status PENDING (Stok belum dikurangi! Dipotong nanti di Webhook setelah lunas)
    await supabaseAdmin.from('pesanan_mitra').insert([{
      id: orderId,
      user_id: user.id,
      produk_id: produk_id,
      jumlah: volume_terjual_kg,
      total_harga: totalBayar,
      status: 'PENDING'
    }]);

    // Kembalikan Token Pembayaran ke Front-End
    return NextResponse.json({ token: transaction.token, message: "Menunggu pembayaran" }, { status: 200 });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Kesalahan Internal Server";
    console.error("API Order Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}