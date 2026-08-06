import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; 
import { createClient as createAdminClient } from '@supabase/supabase-js';

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
    if (!email || !password || !namaAgen || !nikNib || alamatLengkap || noTelepon) {
      return NextResponse.json(
        { error: 'kamu harus mengsisi datamu' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 3. Daftarkan User ke Supabase Auth (Otomatis masuk tabel rahasia)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'agen',
        },
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Gagal mendapatkan ID pengguna.' }, { status: 500 });
    }

    // 4. Gunakan Admin Client untuk bypass RLS
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 5. Simpan data ke tabel 'agen' (NAMA TABEL SUDAH DISESUAIKAN)
    const { error: profileError } = await supabaseAdmin
      .from('agen')
      .insert([
        {
          auth_id: userId,
          nama_agen: namaAgen,             // Disesuaikan dengan kolom tabelmu
          nik_nib: nikNib,
          alamat_lengkap: alamatLengkap,   // Disesuaikan dengan kolom tabelmu
          no_telepon: noTelepon,           // Ditambahkan sesuai tabelmu
          status_verifikasi: 'pending',
        },
      ]);

    // 6. ROLLBACK JIKA GAGAL
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      
      return NextResponse.json(
        { error: 'Gagal membuat profil agen, registrasi dibatalkan: ' + profileError.message }, 
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Registrasi agen berhasil!', userId },
      { status: 201 }
    );
    
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server: ' + err.message },
      { status: 500 }
    );
  }
}