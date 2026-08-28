import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();

    // Fungsi signOut() dari Supabase otomatis menghapus cookie dari browser
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error.message);
      return NextResponse.json({ error: 'Gagal melakukan logout' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Berhasil logout!' }, { status: 200 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    console.error('System error:', message);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}