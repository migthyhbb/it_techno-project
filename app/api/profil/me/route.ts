import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // 1. Ambil data user yang sedang login dari token JWT yang sudah aman di cookies
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // Jika tidak ada token (belum login), tolak aksesnya!
    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak ada akses (Unauthorized)' }, { status: 401 });
    }

    // 2. Cek identitas jabatannya dari metadata JWT
    const role = user.app_metadata?.role;
    let profileData = null;

    // 3. Tarik data dari tabel yang sesuai menggunakan .single() karena data pasti unik
   if (role === 'agen') {
      const { data, error } = await supabase
        .from('agen')
        .select('*')
        .eq('auth_id', user.id)
        .maybeSingle(); // Pakai maybeSingle!

      if (error) throw error;
      if (!data) return NextResponse.json({ error: 'Profil belum tersedia' }, { status: 404 });
      profileData = data;

    } else if (role === 'perusahaan') {
      const { data, error } = await supabase
        .from('perusahaan_industri')
        .select('*')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return NextResponse.json({ error: 'Profil belum tersedia' }, { status: 404 });
      profileData = data;

    } else {
      return NextResponse.json({ error: 'Role pengguna tidak valid' }, { status: 400 });
    }
    // 4. Kirim datanya ke Frontend
    return NextResponse.json({
      message: 'Berhasil mengambil profil',
      role: role,
      data: profileData
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server: ' + err.message },
      { status: 500 }
    );
  }
}