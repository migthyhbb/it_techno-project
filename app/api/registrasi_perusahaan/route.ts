import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; 
import { createAdminClient } from '@/lib/supabase/server'; 

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

    const { email, password, nama_perusahaan, npwp, alamat_lengkap, noTelepon } = body as Record<string, unknown>;

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      typeof nama_perusahaan !== 'string' ||
      typeof npwp !== 'string' ||
      typeof alamat_lengkap
       !== 'string' ||
      typeof noTelepon !== 'string' ||
      !email.trim() ||
      !password.trim() ||
      !nama_perusahaan.trim() ||
      !npwp.trim() ||
      !alamat_lengkap.trim() ||
      !noTelepon.trim()
    ) {
      return NextResponse.json(
        { error: 'Email, password, nama perusahaan, NPWP, alamat lengkap, dan no telepon wajib diisi!' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 2. Daftarkan User ke Supabase Auth dengan Metadata Role 'perusahaan'
   const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

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

    const supabaseAdmin = createAdminClient();

    // Set role pakai admin client
    const { error: roleError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      app_metadata: { role: 'perusahaan' },
    });

    if (roleError) {
      console.error('Role assignment failed:', roleError.message);
      const { error: rollbackError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (rollbackError) console.error('Rollback failed:', rollbackError.message);
      return NextResponse.json({ error: 'Registrasi dibatalkan saat mengatur hak akses.' }, { status: 500 });
    }

    const { error: profileError } = await supabaseAdmin
      .from('perusahaan_industri')
      .insert([
        {
          auth_id: userId,
          nama_perusahaan: nama_perusahaan,
          npwp: npwp,
          alamat_lengkap: alamat_lengkap,
          no_telepon: noTelepon,
          status_verifikasi: 'pending',
        }
      ]);

    if (profileError) {
      console.error('Profile insert failed:', profileError.message);
      const { error: rollbackError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (rollbackError) console.error('Rollback failed:', rollbackError.message);
      
      return NextResponse.json({ error: 'Gagal membuat profil perusahaan, registrasi dibatalkan.' }, { status: 500 });
    }

    return NextResponse.json(
      { message: 'Registrasi perusahaan berhasil!', userId },
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