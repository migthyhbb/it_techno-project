import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak ada akses (Unauthorized)' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const kategori = searchParams.get('kategori'); // misal: 'pembelian' atau 'setoran_limbah'
    let query = supabase
      .from('transaksi_limbah')
      .select('*')
      .eq('id_perusahaan', user.id) // Filter hanya transaksi milik user ini
      .order('created_at', { ascending: false })
      .limit(limit);

    if (kategori) {
      query = query.eq('kategori', kategori);
    }

    const { data: riwayat, error: dbError } = await query;

    if (dbError) throw dbError;
    return NextResponse.json({
      message: "Berhasil mengambil riwayat transaksi",
      total_data: riwayat?.length || 0,
      orders: riwayat || []
    }, { status: 200 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error("Riwayat API Error:", message);
    return NextResponse.json(
      { error: "Gagal mengambil riwayat transaksi dari server." },
      { status: 500 }
    );
  }
}