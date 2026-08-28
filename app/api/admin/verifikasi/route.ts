import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export async function PATCH(request: Request) {
  try {
    const supabaseUser = await createClient();
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user || user.app_metadata?.role !== 'admin') {
        return NextResponse.json({ error: 'Akses ditolak!' }, { status: 403 });
    }

    const body = await request.json() as Record<string, unknown>;
    const { id_target, tipe, status_baru } = body;

    if (typeof id_target !== 'string' || typeof tipe !== 'string' || typeof status_baru !== 'string') {
      return NextResponse.json({ error: 'Data tidak valid!' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();
    const tableName = tipe === 'agen' ? 'mitra_profiles' : 'industri_profiles';

    const { data, error } = await supabaseAdmin
      .from(tableName)
      .update({ status_verifikasi: status_baru })
      .eq('user_id', id_target)
      .select('user_id');

    if (error) throw error;
    if (!data || data.length === 0) return NextResponse.json({ error: 'Mitra tidak ditemukan' }, { status: 404 });

    return NextResponse.json({ message: 'Status berhasil diubah' }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}