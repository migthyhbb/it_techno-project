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
    const role = user.user_metadata?.role;
    let profileData = null;

    // 3. Tarik data dari tabel yang sesuai menggunakan .single() karena data pasti unik
    if (role === 'agen') {
      const { data, error } = await supabase
        .from('agen')
        .select('*')
        .eq('auth_id', user.id)
        .single();
      
      if (error) throw error;
      profileData = data;

    } else if (role === 'perusahaan') {
      const { data, error } = await supabase
        .from('perusahaan_industri')
        .select('*')
        .eq('auth_id', user.id)
        .single();
        
      if (error) throw error;
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

  } catch (err: unknown) { 
    const message = err instanceof Error ? err.message : 'Unknown server error';
    console.error("System Error:", message); // Supaya tetap terekam di terminal server
    
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem, silakan coba lagi nanti.' }, // Pesan yang aman untuk user
      { status: 500 }
    );
  }
}