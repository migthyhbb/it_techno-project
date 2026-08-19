import { NextResponse } from 'next/server';
import { createAdminClient} from '@/lib/supabase/server'; 

const supabase = createAdminClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id_agen, volume_terjual_kg } = body;

    // 1. TANGKAL NILAI NEGATIF / NOL
    if (!id_agen || !volume_terjual_kg || volume_terjual_kg <= 0) {
      return NextResponse.json(
        { error: "Data agen atau volume penjualan tidak valid." },
        { status: 400 }
      );
    }

    // 2. AMBIL HARGA HET TERBARU (Aman)
    const { data: hargaData } = await supabase
      .from('patokan_harga')
      .select('harga_rekomendasi_ai')
      .eq('status', 'Approved')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const harga_per_kg = hargaData ? hargaData.harga_rekomendasi_ai : 3000;
    const total_pendapatan = volume_terjual_kg * harga_per_kg;

    // ==========================================
    // 3. DELEGASIKAN KE DATABASE (ATOMIC TRANSACTION)
    // ==========================================
    // Cek stok, potong stok, tambah saldo, dan catat ledger dilakukan 
    // dalam 1 tarikan nafas di dalam database.
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('eksekusi_kasir_atomic', {
        p_id_agen: id_agen,
        p_volume_kg: volume_terjual_kg,
        p_harga_per_kg: harga_per_kg,
        p_total_pendapatan: total_pendapatan
      });

    if (rpcError) {
      throw rpcError;
    }

    // Membaca balasan dari fungsi SQL
    if (!rpcResult.success) {
      return NextResponse.json(
        { error: `Transaksi Gagal: ${rpcResult.message}` }, 
        { status: 400 }
      );
    }

    // 4. KEMBALIKAN STRUK DIGITAL KE FRONT-END
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

  } catch (error: any) {
    console.error("API POS/Order Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal saat memproses transaksi." }, 
      { status: 500 }
    );
  }
}