import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    // 1. KEAMANAN MUTLAK: Ambil ID dari Sesi Login, abaikan ID dari Front-End
    const supabaseUser = await createClient();
    const { data: { user } } = await supabaseUser.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sesi tidak valid / Belum login." }, { status: 401 });
    }
    const id_agen = user.id;

    const body = await request.json();
    const { volume_terjual_kg } = body;

    // Tangkal Nilai Negatif
    if (!volume_terjual_kg || Number(volume_terjual_kg) <= 0) {
      return NextResponse.json(
        { error: "Volume penjualan tidak valid." },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // 2. AMBIL HARGA HET TERBARU
    const { data: hargaData } = await supabaseAdmin
      .from('patokan_harga')
      .select('harga_rekomendasi_ai')
      .eq('status', 'Approved')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const harga_per_kg = hargaData ? hargaData.harga_rekomendasi_ai : 3000;
    const total_pendapatan = Number(volume_terjual_kg) * harga_per_kg;

    // 3. DELEGASIKAN KE DATABASE (ATOMIC TRANSACTION)
    const { data: rpcResult, error: rpcError } = await supabaseAdmin
      .rpc('eksekusi_kasir_atomic', {
        p_id_agen: id_agen,
        p_volume_kg: Number(volume_terjual_kg),
        p_harga_per_kg: harga_per_kg,
        p_total_pendapatan: total_pendapatan
      });

    if (rpcError) throw rpcError;

    if (!rpcResult.success) {
      return NextResponse.json(
        { error: `Transaksi Gagal: ${rpcResult.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Transaksi Kasir Berhasil!",
      struk_digital: {
        volume_kg: volume_terjual_kg,
        harga_satuan: harga_per_kg,
        total_bayar: total_pendapatan,
        sisa_stok_gudang: rpcResult.sisa_stok_gudang,
        saldo_dompet_sekarang: rpcResult.saldo_dompet_sekarang
      }
    }, { status: 201 });

  } catch (_err: unknown) { // <-- Kerapian: Ganti 'any' jadi 'unknown'
    const msg = _err instanceof Error ? _err.message : "Terjadi kesalahan internal";
    console.error("API POS/Order Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}