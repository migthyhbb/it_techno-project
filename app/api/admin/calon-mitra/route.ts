import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak (Unauthorized)' }, { status: 403 });
    }
    const [mitra, industri] = await Promise.all([
      supabase.from('mitra_profiles').select('*').eq('status_verifikasi', 'pending'),
      supabase.from('industri_profiles').select('*').eq('status_verifikasi', 'pending'),
    ]);

    if (mitra.error) throw mitra.error;
    if (industri.error) throw industri.error;

    return NextResponse.json(
      { message: 'Berhasil mengambil calon mitra', agen: mitra.data, perusahaan: industri.data },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    console.error("Error di calon mitra:", message);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}