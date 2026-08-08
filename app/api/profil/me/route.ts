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

    if (typeof role !== 'string' || (role !== 'agen' && role !== 'perusahaan')) {
      return NextResponse.json({ error: 'Role pengguna tidak valid' }, { status: 400 });
    }

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

  } catch (err: unknown) {
    console.error('Failed to retrieve profile', err);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// ... (Kode fungsi GET kamu yang lama tetap ada di atas sini) ...

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // 1. Cek apakah user sudah login
    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak ada akses (Unauthorized)' }, { status: 401 });
    }

    const role = user.app_metadata?.role;
    if (!role) {
      return NextResponse.json({ error: 'Role pengguna tidak valid' }, { status: 400 });
    }

    // 2. Tangkap data dari frontend dengan aman
    let body: unknown;
    try {
      body = await request.json();
    } catch (err) {
      return NextResponse.json({ error: 'Format data tidak valid' }, { status: 400 });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Format data tidak valid' }, { status: 400 });
    }

    const payload = body as Record<string, unknown>;

    // 3. Filter data yang boleh di-update (Keamanan: Mencegah user mengubah ID atau status verifikasi secara paksa)
    const dataUpdate: Record<string, string> = {};
    
    // Semua role boleh update telepon dan alamat
    if (typeof payload.no_telepon === 'string' && payload.no_telepon.trim() !== '') {
      dataUpdate.no_telepon = payload.no_telepon.trim();
    }
    if (typeof payload.alamat_lengkap === 'string' && payload.alamat_lengkap.trim() !== '') {
      dataUpdate.alamat_lengkap = payload.alamat_lengkap.trim();
    }

    // Update nama sesuai role
    if (role === 'agen' && typeof payload.nama_agen === 'string' && payload.nama_agen.trim() !== '') {
      dataUpdate.nama_agen = payload.nama_agen.trim();
    } else if (role === 'perusahaan' && typeof payload.nama_perusahaan === 'string' && payload.nama_perusahaan.trim() !== '') {
      dataUpdate.nama_perusahaan = payload.nama_perusahaan.trim();
    }

    // Cek apakah ada data yang valid untuk diupdate
    if (Object.keys(dataUpdate).length === 0) {
      return NextResponse.json({ error: 'Tidak ada data valid yang dikirim untuk diperbarui' }, { status: 400 });
    }

    // 4. Update ke database sesuai role
    const tableName = role === 'agen' ? 'agen' : 'perusahaan_industri';
    
    const { data: updatedRow, error: updateError } = await supabase
      .from(tableName)
      .update(dataUpdate)
      .eq('auth_id', user.id)
      .select('auth_id')
      .maybeSingle();

    if (updateError) {
      console.error('Update profile failed:', updateError.message);
      return NextResponse.json({ error: 'Gagal memperbarui data profil' }, { status: 500 });
    }

    if (!updatedRow) {
      return NextResponse.json({ error: 'Profil belum tersedia' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Profil berhasil diperbarui!' }, { status: 200 });

  } catch (err: unknown) {
    console.error('System error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}