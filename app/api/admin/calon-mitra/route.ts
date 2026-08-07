import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // Sesuaikan path jika beda

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak ada akses (Unauthorized)' }, { status: 401 });
    }

    // WAJIB CEK: Apakah dia benar-benar Admin?
    if (user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak! Anda bukan admin.' }, { status: 403 });
    }

    // Tarik semua agen dan perusahaan yang statusnya 'pending'
    const [agen, perusahaan] = await Promise.all([
      supabase.from('agen').select('*').eq('status_verifikasi', 'pending'),
      supabase.from('perusahaan_industri').select('*').eq('status_verifikasi', 'pending'),
    ]);

    if (agen.error) throw agen.error;
    if (perusahaan.error) throw perusahaan.error;

    return NextResponse.json(
      { message: 'Berhasil mengambil calon mitra', agen: agen.data, perusahaan: perusahaan.data },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    console.error("Error di calon mitra:", message);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}