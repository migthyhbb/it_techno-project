import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Pastikan user sudah login (Agen atau Perusahaan)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ambil data katalog yang aktif, diurutkan dari yang stoknya paling banyak
    const { data: produk, error: dbError } = await supabase
      .from('katalog_produk')
      .select('*')
      .eq('is_active', true)
      .order('stok', { ascending: false });

    if (dbError) throw dbError;

    return NextResponse.json({
      message: "Katalog berhasil dimuat",
      data: produk
    }, { status: 200 });

  } catch (error: unknown) {
    console.error("API Katalog Error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Gagal memuat katalog produk dari database." },
      { status: 500 }
    );
  }
}