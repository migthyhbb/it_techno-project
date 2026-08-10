import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    const { email, password } = body as Record<string, unknown>;

    // Validasi input
    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password.trim()
    ) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi!' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 2. Proses Login ke Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // 3. Tangani Error Auth (Termasuk Rate Limit)
    if (error) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'Terlalu banyak percobaan. Silakan coba lagi nanti.' }, 
          { status: 429 }
        );
      }
      
      if (error.status && error.status >= 500) {
        console.error('Supabase auth error:', error.message);
        return NextResponse.json(
          { error: 'Terjadi kesalahan sistem, silakan coba lagi nanti.' },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: 'Email atau password salah!' }, 
        { status: 401 }
      );
    }

    // 4. Baca identitas jabatan dari token
    const user = data.user;
    const role = user?.app_metadata?.role;

    // --- 5. TAMBAHAN BARU: PENGECEKAN STATUS VERIFIKASI ADMIN ---
    if (role === 'agen' || role === 'perusahaan') {
      const tableName = role === 'agen' ? 'agen' : 'perusahaan_industri';
      
      // Cek status di tabel profil
      const { data: profileData, error: profileError } = await supabase
        .from(tableName)
        .select('status_verifikasi')
        .eq('auth_id', user.id)
        .single();

      if (profileError || !profileData) {
        await supabase.auth.signOut(); // Kick user
        return NextResponse.json({ error: 'Data profil tidak ditemukan.' }, { status: 404 });
      }

      // Pastikan status_verifikasi adalah 'approved' (sesuaikan dengan isi database-mu)
      if (profileData.status_verifikasi !== 'approved') {
        await supabase.auth.signOut(); // Kick user karena belum di-acc
        return NextResponse.json(
          { error: 'Akun Anda belum disetujui oleh Admin. Harap tunggu proses verifikasi.' }, 
          { status: 403 }
        );
      }
    }
    // --- AKHIR PENGECEKAN STATUS ---

    // 6. Kembalikan data ke Frontend jika lulus semua pengecekan
    return NextResponse.json(
      { 
        message: 'Login berhasil!', 
        role: role, 
        userId: user.id 
      },
      { status: 200 }
    );
    
  } catch (err: unknown) { 
    const message = err instanceof Error ? err.message : 'Unknown server error';
    console.error("System Error:", message);
    
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem, silakan coba lagi nanti.' },
      { status: 500 }
    );
  }
}