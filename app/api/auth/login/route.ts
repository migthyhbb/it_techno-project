import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    // 1. Parsing body dengan aman
    let body;
    try {
      body = await request.json();
    } catch (err) {
      return NextResponse.json({ error: 'Body request tidak valid' }, { status: 400 });
    }

    const { email, password } = body;

    // Validasi input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi!' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 2. Proses Login ke Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // 3. Tangani Error (Termasuk Rate Limit yang kamu buat tadi)
    if (error) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'Terlalu banyak percobaan. Silakan coba lagi nanti.' }, 
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: 'Email atau password salah!' }, 
        { status: 401 }
      );
    }

    // 4. Baca identitas jabatan dari token
    const role = data.user?.user_metadata?.role;

    // 5. Kembalikan data ke Frontend agar Frontend yang melakukan Redirect
    return NextResponse.json(
      { 
        message: 'Login berhasil!', 
        role: role, 
        userId: data.user?.id 
      },
      { status: 200 }
    );
    
  }  catch (err: unknown) { 
    const message = err instanceof Error ? err.message : 'Unknown server error';
    console.error("System Error:", message); // Supaya tetap terekam di terminal server
    
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem, silakan coba lagi nanti.' }, // Pesan yang aman untuk user
      { status: 500 }
    );
  }
}
