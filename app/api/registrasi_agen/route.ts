import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; 
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    // 1. Parsing body dengan aman
    let body;
    try {
      body = await request.json();
    } catch (err) {
      return NextResponse.json({ error: 'Body request tidak valid' }, { status: 400 });
    }

    // 2. Sesuaikan variabel dengan input dari Frontend
    const { email, password, namaAgen, nikNib, alamatLengkap, noTelepon } = body;

    // Validasi sederhana
    if (!email || !password || !namaAgen || !nikNib || !alamatLengkap || !noTelepon) {
      return NextResponse.json(
        { error: 'kamu harus mengsisi datamu secara lengkap' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 3. Daftarkan User ke Supabase Auth (Otomatis masuk tabel rahasia)
   const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    }); // Hapus blok options: { data: { role: ... } } dari sini!

    if (authError) throw authError;

    const userId = authData.user?.id;
    if (!userId) throw new Error('Gagal mendapatkan ID User');

    // Gunakan fungsi admin yang baru
    const supabaseAdmin = createAdminClient();

    // MASUKKAN ROLE KE APP_METADATA (Sangat Aman)
    const { error: roleError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      app_metadata: { role: 'agen' } // Ganti 'agen' jadi 'perusahaan' untuk file registrasi_perusahaan
    });

    if (roleError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: 'Registrasi dibatalkan saat mengatur hak akses.' }, { status: 500 });
    }

    // Lanjut masukkan data ke tabel profil (agen / perusahaan_industri)
    const { error: profileError } = await supabaseAdmin
      .from('agen') // Sesuaikan nama tabelnya di masing-masing file
      .insert([
        // ... (biarkan isian insert data kamu seperti aslinya di sini) ...
      ]);

    // PERBAIKAN ROLLBACK
    if (profileError) {
      console.error('Profile insert failed:', profileError.message);
      const { error: rollbackError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (rollbackError) {
        console.error('Rollback failed, orphan auth user:', userId, rollbackError.message);
      }

      return NextResponse.json(
        // Jangan bocorkan profileError.message ke client
        { error: 'Gagal membuat profil, registrasi dibatalkan.' }, 
        { status: 500 }
      );
    }


    return NextResponse.json(
      { message: 'Registrasi agen berhasil!', userId },
      { status: 201 }
    );
    
 } catch (err: unknown) { 
    const message = err instanceof Error ? err.message : 'Unknown server error';
    console.error("System Error:", message); // Supaya tetap terekam di terminal server
    
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem, silakan coba lagi nanti.' }, // Pesan yang aman untuk user
      { status: 500 }
    );
  }
}