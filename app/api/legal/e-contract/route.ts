import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH() {
  try {
    const supabase = await createClient();

    // 1. Pastikan yang menekan tombol ini sudah login
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak ada akses (Unauthorized)' }, { status: 401 });
    }

    // 2. Cek role-nya, ini khusus untuk Agen
    if (user.app_metadata?.role !== 'agen') {
      return NextResponse.json({ error: 'Hanya Agen yang perlu menyetujui E-Contract' }, { status: 403 });
    }

    // 3. Catat waktu saat ini secara persis (Timestamp)
    const waktuSekarang = new Date().toISOString();

    // 4. Update tabel 'agen', ubah syarat_disetujui menjadi true hanya untuk baris yang belum disetujui
    const { data: updatedAgent, error: updateError } = await supabase
      .from('agen')
      .update({
        syarat_disetujui: true,
        waktu_persetujuan: waktuSekarang
      })
      .eq('auth_id', user.id)
      .eq('syarat_disetujui', false)
      .is('waktu_persetujuan', null)
      .select('auth_id')
      .maybeSingle();

    if (updateError) throw updateError;
    if (!updatedAgent) {
      return NextResponse.json(
        { error: 'E-Contract sudah disetujui atau tidak ditemukan.' },
        { status: 409 }
      );
    }

    return NextResponse.json({
      message: 'E-Contract berhasil disetujui secara digital!',
      waktu_persetujuan: waktuSekarang
    }, { status: 200 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    console.error('Error memproses E-Contract:', message);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memproses E-Contract.' },
      { status: 500 }
    );
  }
}