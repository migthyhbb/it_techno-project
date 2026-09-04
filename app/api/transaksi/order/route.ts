import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import midtransClient from 'midtrans-client';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let ratelimit: Ratelimit | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "60 s"),
      analytics: true,
    });
  }
} catch (e) {
  console.warn("Ratelimit init skipped:", e);
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || '127.0.0.1';

    if (ratelimit) {
      try {
        const { success } = await ratelimit.limit(ip);
        if (!success) {
          return NextResponse.json(
            { error: 'Terlalu banyak permintaan. Silakan tunggu beberapa detik.' },
            { status: 429 }
          );
        }
      } catch (err) {
        console.warn("Ratelimit Redis skipped:", err);
      }
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sesi habis, silakan login ulang." }, { status: 401 });
    }

    const body = await request.json() as Record<string, unknown>;
    const produk_id = String(body.produk_id || body.product_id || "");
    const volume_terjual_kg = Number(body.volume_terjual_kg || body.jumlah || 0);

    if (!volume_terjual_kg || volume_terjual_kg <= 0 || !produk_id) {
      return NextResponse.json({ error: "Data pesanan tidak valid." }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // 1. Ambil data profil mitra untuk mengetahui wilayah
    const { data: profile } = await supabaseAdmin
      .from('mitra_profiles')
      .select('kota_kabupaten, provinsi, nama_mitra')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile?.kota_kabupaten) {
      return NextResponse.json({ 
        error: "Lokasi wilayah mitra tidak ditemukan. Silakan lengkapi profil Anda." 
      }, { status: 400 });
    }

    // 2. Wajib ambil harga spesifik wilayah mitra
    const { data: regPrice } = await supabaseAdmin
      .from('regional_product_prices')
      .select('harga')
      .eq('product_id', produk_id)
      .ilike('kota', `%${profile.kota_kabupaten}%`)
      .maybeSingle();

    if (!regPrice || !regPrice.harga) {
      return NextResponse.json({ 
        error: "Produk ini belum tersedia atau belum memiliki penetapan harga di wilayah Anda." 
      }, { status: 400 });
    }

    const hargaWilayah = Number(regPrice.harga);
    const totalBayar = volume_terjual_kg * hargaWilayah;
    const orderId = `AGEN-${Date.now()}`;

    // 3. Batas minimal pembayaran Midtrans (Rp 10.000)
    if (totalBayar < 10000) {
      return NextResponse.json({
        error: `Total pemesanan minimal Rp 10.000 untuk memproses pembayaran Midtrans. (Total Anda saat ini: Rp ${totalBayar.toLocaleString("id-ID")})`
      }, { status: 400 });
    }

    // 4. Batas maksimal pembayaran Midtrans (Rp 99.999.999.999)
    if (totalBayar > 99999999999) {
      return NextResponse.json({
        error: `Total pemesanan melebihi batas maksimal pembayaran Midtrans (Maksimal Rp 99.999.999.999). Silakan kurangi jumlah pesanan.`
      }, { status: 400 });
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

    let snapToken: string | null = null;

    if (serverKey && serverKey.trim().length > 0) {
      try {
        const snap = new midtransClient.Snap({
          isProduction: false,
          serverKey: serverKey.trim(),
          clientKey: clientKey ? clientKey.trim() : ""
        });

        const parameter = {
          transaction_details: {
            order_id: orderId,
            gross_amount: Math.round(totalBayar)
          },
          customer_details: {
            first_name: profile.nama_mitra || "Mitra",
            email: user.email || "mitra@lentera.com"
          }
        };

        const transaction = await snap.createTransaction(parameter);
        snapToken = transaction.token;
      } catch (midtransErr: any) {
        console.error("Midtrans SDK Error:", midtransErr);
        return NextResponse.json({
          error: "Gagal terhubung ke gerbang pembayaran Midtrans. Silakan periksa kembali server key atau coba lagi."
        }, { status: 500 });
      }
    }

    const statusPesanan = snapToken ? 'menunggu_pembayaran' : 'diproses';

    // 5. Simpan ke tabel orders
    await supabaseAdmin.from('orders').insert([{
      id: orderId,
      user_id: user.id,
      total_harga: totalBayar,
      status: statusPesanan
    }]);

    // 6. Simpan ke tabel pesanan_mitra
    await supabaseAdmin.from('pesanan_mitra').insert([{
      id: orderId,
      user_id: user.id,
      produk_id: produk_id,
      jumlah: volume_terjual_kg,
      total_harga: totalBayar,
      status: statusPesanan.toUpperCase()
    }]);

    return NextResponse.json({
      token: snapToken,
      order_id: orderId,
      message: snapToken ? "Menunggu pembayaran" : "Pesanan berhasil dibuat!",
    }, { status: 200 });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Kesalahan Internal Server";
    console.error("API Order Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}