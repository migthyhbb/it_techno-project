import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server'; 


export async function POST(request: Request) {
  try {
    // 1. Parsing body dengan aman
    let body: unknown;
    try {
      body = await request.json();
    } catch (err) {
      return NextResponse.json({ error: 'Body request tidak valid' }, { status: 400 });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Body request tidak valid' }, { status: 400 });
    }

    const { email, password, namaAgen, nikNib, alamatLengkap, noTelepon } = body as Record<string, unknown>;

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      typeof namaAgen !== 'string' ||
      typeof nikNib !== 'string' ||
      typeof alamatLengkap !== 'string' ||
      typeof noTelepon !== 'string' ||
      !email.trim() ||
      !password.trim() ||
      !namaAgen.trim() ||
      !nikNib.trim() ||
      !alamatLengkap.trim() ||
      !noTelepon.trim()
    ) {
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

    if (authError) {
      console.error('Signup failed:', authError.message);
      return NextResponse.json(
        { error: 'Registrasi gagal. Periksa kembali email dan password Anda.' },
        { status: 400 }
      );
    }

    const userId = authData.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Gagal mendapatkan ID pengguna.' }, { status: 500 });
    }
    // PENGAMAN DARI CODERABBIT: Cek apakah email sudah terdaftar (identities kosong)
    if (!authData.user?.identities || authData.user.identities.length === 0) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar. Silakan gunakan email lain atau login.' },
        { status: 400 }
      );
    }

    // Gunakan fungsi admin yang baru
    const supabaseAdmin = createAdminClient();

    // MASUKKAN ROLE KE APP_METADATA (Sangat Aman)
    const { error: roleError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      app_metadata: { role: 'agen' } // Ganti 'agen' jadi 'perusahaan' untuk file registrasi_perusahaan
    });

    if (roleError) {
      const { error: rollbackError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (rollbackError) {
        console.error('Rollback failed, orphan auth user:', userId, rollbackError.message);
      }
      return NextResponse.json({ error: 'Registrasi dibatalkan saat mengatur hak akses.' }, { status: 500 });
    }

    // Lanjut masukkan data ke tabel profil (agen / perusahaan_industri)
    // Lanjut masukkan data ke tabel profil
    const { error: profileError } = await supabaseAdmin
      .from('agen')
      .insert([
        {
          auth_id: userId,
          nama_agen: namaAgen,
          nik_nib: nikNib,
          alamat_lengkap: alamatLengkap,
          no_telepon: noTelepon,
          status_verifikasi: 'pending',
        }
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