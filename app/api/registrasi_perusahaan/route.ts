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

    const { email, password, namaPt, npwp, alamatKantor, noTelepon} = body;

    // Validasi field utama
    if (!email || !password || !namaPt || !npwp || !alamatKantor || !noTelepon) {
      return NextResponse.json(
        { error: 'Email, password, nama PT, dan NPWP wajib diisi!' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 2. Daftarkan User ke Supabase Auth dengan Metadata Role 'perusahaan'
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'perusahaan', // Diberi label peran perusahaan langsung di token JWT
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

    // 3. Inisialisasi Admin Client untuk bypass RLS
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: profileError } = await supabaseAdmin
      .from('perusahaan_industri')
      .insert([
        {
          auth_id: userId,
          nama_perusahaan: namaPt,
          npwp: npwp,
          alamat_lengkap: alamatKantor,
          no_telepon : noTelepon,
          status_verifikasi: 'pending', // Menunggu persetujuan Admin
        },
      ]);

    // 5. ROLLBACK JIKA GAGAL INSERT PROFIL
    if (profileError) {
      // Hapus kembali user dari Supabase Auth agar email tidak tersangkut
      await supabaseAdmin.auth.admin.deleteUser(userId);

      return NextResponse.json(
        { error: 'Gagal membuat profil perusahaan, registrasi dibatalkan: ' + profileError.message },
        { status: 500 }
      );
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