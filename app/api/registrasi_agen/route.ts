import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server'; 


export async function POST(request: Request) {
  try {
    function cekKekuatanPassword(password: string): string[] {
  return [
    { valid: password.length >= 8, msg: "minimal 8 karakter" },
    { valid: /[A-Z]/.test(password), msg: "minimal 1 huruf besar (A-Z)" },
    { valid: /[a-z]/.test(password), msg: "minimal 1 huruf kecil (a-z)" },
    { valid: /[0-9]/.test(password), msg: "minimal 1 angka (0-9)" },
    { valid: /[^A-Za-z0-9]/.test(password), msg: "minimal 1 simbol khusus (contoh: @, !, #, $, dll)" }
  ]
  .filter(rule => !rule.valid)
  .map(rule => rule.msg);
}
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

    const { email, password, namaAgen, nik, alamatLengkap, noTelepon } = body as Record<string, unknown>;

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      typeof namaAgen !== 'string' ||
      typeof nik !== 'string' ||
      typeof alamatLengkap !== 'string' ||
      typeof noTelepon !== 'string' ||
      !email.trim() ||
      !password.trim() ||
      !namaAgen.trim() ||
      !nik.trim() ||
      !alamatLengkap.trim() ||
      !noTelepon.trim()
    ) {
      return NextResponse.json(
        { error: 'kamu harus mengsisi datamu secara lengkap' },
        { status: 400 }
      );
    }

    const daftarKelemahan = cekKekuatanPassword(password);

if (daftarKelemahan.length > 0) {
  // Menggabungkan pesan error agar user tahu apa yang kurang
  return NextResponse.json({ 
    error: `Password terlalu lemah! Harus memiliki: ${daftarKelemahan.join(', ')}.` 
  }, { status: 400 });
}
    const supabase = await createClient();

    let createdUser = false;

    // 3. Daftarkan User ke Supabase Auth (Otomatis masuk tabel rahasia)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    }); // Hapus blok options: { data: { role: ... } } dari sini!

    const duplicateSignup = authError && typeof authError === 'object' && 'code' in authError
      ? ['user_already_exists', 'email_exists'].includes((authError as { code?: string }).code ?? '')
      : false;

    const supabaseAdmin = createAdminClient();

    const handleDuplicateExisting = async () => {
      const { data: existingUser, error: existingUserError } = await supabaseAdmin
        .from('auth.users')
        .select('id, app_metadata')
        .eq('email', email)
        .maybeSingle();

      if (existingUserError) {
        console.error('Duplicate lookup failed:', existingUserError.message);
        return NextResponse.json(
          { error: 'Terjadi kesalahan saat memproses registrasi duplikat.' },
          { status: 500 }
        );
      }

      if (!existingUser || existingUser.app_metadata?.role !== 'agen') {
        return NextResponse.json(
          { error: 'Email sudah terdaftar pada akun lain.' },
          { status: 400 }
        );
      }

      const userId = existingUser.id;
      const { data: existingAgent, error: existingAgentError } = await supabaseAdmin
        .from('agen')
        .select('auth_id')
        .eq('auth_id', userId)
        .maybeSingle();

      if (existingAgentError) {
        console.error('Agent lookup failed:', existingAgentError.message);
        return NextResponse.json(
          { error: 'Terjadi kesalahan saat memverifikasi profil agen.' },
          { status: 500 }
        );
      }

      if (existingAgent) {
        return NextResponse.json({ message: 'Registrasi agen berhasil!' }, { status: 201 });
      }

      const { error: profileError } = await supabaseAdmin.from('agen').insert([
        {
          auth_id: userId,
          nama_agen: namaAgen,
          nik: nik,
          alamat_lengkap: alamatLengkap,
          no_telepon: noTelepon,
          status_verifikasi: 'pending',
        }
      ]);

      if (profileError) {
        console.error('Profile insert failed for duplicate signup:', profileError.message);
        return NextResponse.json(
          { error: 'Gagal membuat profil agen untuk akun duplikat.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: 'Registrasi agen berhasil!' }, { status: 201 });
    };

    if (authError) {
      if (duplicateSignup) {
        return await handleDuplicateExisting();
      }

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

    if (!authData.user?.identities || authData.user.identities.length === 0) {
      return await handleDuplicateExisting();
    }

    createdUser = true;

    // MASUKKAN ROLE KE APP_METADATA (Sangat Aman)
    const { error: roleError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      app_metadata: { role: 'agen' } // Ganti 'agen' jadi 'perusahaan' untuk file registrasi_perusahaan
    });

    if (roleError) {
      if (createdUser) {
        const { error: rollbackError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (rollbackError) {
          console.error('Rollback failed, orphan auth user:', userId, rollbackError.message);
        }
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
          nik: nik,
          alamat_lengkap: alamatLengkap,
          no_telepon: noTelepon,
          status_verifikasi: 'pending',
        }
      ]);

    // PERBAIKAN ROLLBACK
    if (profileError) {
      console.error('Profile insert failed:', profileError.message);
      if (createdUser) {
        const { error: rollbackError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (rollbackError) {
          console.error('Rollback failed, orphan auth user:', userId, rollbackError.message);
        }
      }

      return NextResponse.json(
        // Jangan bocorkan profileError.message ke client
        { error: 'Gagal membuat profil, registrasi dibatalkan.' },
        { status: 500 }
      );
    }


    return NextResponse.json(
      { message: 'Registrasi agen berhasil!' },
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