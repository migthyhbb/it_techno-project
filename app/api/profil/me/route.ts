import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = user.app_metadata?.role;
    let profileData = null;

    if (role === 'agen' || role === 'mitra') {
      const { data, error } = await supabase.from('mitra_profiles').select('*').eq('user_id', user.id).maybeSingle();
      if (error) throw error;
      profileData = data;
    } else if (role === 'perusahaan' || role === 'industri') {
      const { data, error } = await supabase.from('industri_profiles').select('*').eq('user_id', user.id).maybeSingle();
      if (error) throw error;
      profileData = data;
    }

    if (!profileData) return NextResponse.json({ error: 'Profil belum tersedia' }, { status: 404 });
    return NextResponse.json({ message: 'Berhasil', role, data: profileData }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = user.app_metadata?.role;
    const body = await request.json() as Record<string, string>;
    const dataUpdate: Record<string, string> = {};

    if (body.telepon) dataUpdate.telepon = body.telepon;
    if (body.alamat) dataUpdate.alamat = body.alamat;
    if ((role === 'agen' || role === 'mitra') && body.nama_mitra) dataUpdate.nama_mitra = body.nama_mitra;
    else if ((role === 'perusahaan' || role === 'industri') && body.nama_perusahaan) dataUpdate.nama_perusahaan = body.nama_perusahaan;

    if (Object.keys(dataUpdate).length === 0) return NextResponse.json({ error: 'Tidak ada data valid' }, { status: 400 });

    const tableName = (role === 'agen' || role === 'mitra') ? 'mitra_profiles' : 'industri_profiles';
    const { data: updatedRow, error: updateError } = await supabase.from(tableName).update(dataUpdate).eq('user_id', user.id).select('user_id').maybeSingle();

    if (updateError) throw updateError;
    if (!updatedRow) return NextResponse.json({ error: 'Profil belum tersedia' }, { status: 404 });

    return NextResponse.json({ message: 'Profil berhasil diperbarui!' }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}