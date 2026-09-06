import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import midtransClient from 'midtrans-client';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let ratelimit: Ratelimit | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
    ratelimit = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "60 s"), analytics: true });
  }
} catch {
  console.warn("Ratelimit init skipped");
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '127.0.0.1';
    if (ratelimit) {
      try {
        const { success } = await ratelimit.limit(ip);
        if (!success) return NextResponse.json({ error: 'Terlalu banyak permintaan. Tunggu sebentar.' }, { status: 429 });
      } catch {}
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sesi habis, silakan login ulang." }, { status: 401 });

    const body = await request.json() as Record<string, unknown>;
    const produk_id = String(body.produk_id || body.product_id || "");
    const jumlah = Number(body.jumlah || body.volume_terjual_kg || 0);
    if (!jumlah || jumlah <= 0 || !produk_id) return NextResponse.json({ error: "Data pesanan tidak valid." }, { status: 400 });

    const supabaseAdmin = createAdminClient();
    const { data: profile } = await supabaseAdmin.from('mitra_profiles').select('kota_kabupaten, nama_mitra').eq('user_id', user.id).maybeSingle();
    if (!profile?.kota_kabupaten) return NextResponse.json({ error: "Lokasi wilayah mitra tidak ditemukan." }, { status: 400 });

    const { data: regPrice } = await supabaseAdmin.from('regional_product_prices').select('id, harga, stok').eq('product_id', produk_id).ilike('kota', `%${profile.kota_kabupaten}%`).maybeSingle();
    if (!regPrice || !regPrice.harga) return NextResponse.json({ error: "Produk belum tersedia di wilayah Anda." }, { status: 400 });

    const regionalStock = Number(regPrice.stok ?? 0);
    if (regionalStock < jumlah) return NextResponse.json({ error: `Stok tidak mencukupi. Sisa stok: ${regionalStock} unit.` }, { status: 400 });

    const hargaWilayah = Number(regPrice.harga);
    const totalBayar = jumlah * hargaWilayah;
    if (totalBayar < 10000) return NextResponse.json({ error: `Total pemesanan minimal Rp 10.000` }, { status: 400 });

    const orderId = crypto.randomUUID();
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    let snapToken: string | null = null;

    if (serverKey && serverKey.trim().length > 0) {
      try {
        const snap = new midtransClient.Snap({ isProduction: false, serverKey: serverKey.trim(), clientKey: clientKey ? clientKey.trim() : "" });
        const parameter = {
          transaction_details: { order_id: orderId, gross_amount: Math.round(totalBayar) },
          customer_details: { first_name: profile.nama_mitra || "Mitra", email: user.email || "mitra@lentera.com" }
        };
        const transaction = await snap.createTransaction(parameter);
        snapToken = transaction.token;
      } catch (midtransErr: unknown) {
        console.error(midtransErr);
        return NextResponse.json({ error: "Gagal terhubung ke gerbang pembayaran." }, { status: 500 });
      }
    }

    const statusPesanan = snapToken ? 'PENDING' : 'DIPROSES';

    // 🔥 FIX: Suntikkan 'items' agar UI tahu ini produk apa. Hapus insert pesanan_mitra!
    const { error: orderError } = await supabaseAdmin.from('orders').insert([{ 
      id: orderId, 
      user_id: user.id, 
      total_harga: totalBayar, 
      status: statusPesanan,
      items: { product_id: produk_id, jumlah: jumlah } 
    }]);
    
    if (orderError) throw orderError;

    return NextResponse.json({ token: snapToken, order_id: orderId, message: "Pesanan berhasil dibuat!" }, { status: 200 });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Kesalahan Internal Server";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}