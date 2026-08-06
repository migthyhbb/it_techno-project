import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function PATCH(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (err) {
      return NextResponse.json({ error: 'Body request tidak valid' }, { status: 400 });
    }

    // Frontend harus mengirimkan 3 data ini:
    // id_target = UUID milik agen atau perusahaan
    // tipe = 'agen' atau 'perusahaan'
    // status_baru = 'approved' atau 'rejected'
    const { id_target, tipe, status_baru } = body;

    if (!id_target || !tipe || !status_baru) {
      return NextResponse.json(
        { error: 'id_target, tipe, dan status_baru wajib dikirim!' },
        { status: 400 }
      );
    }

    // Pastikan status yang dikirim hanya dua kemungkinan ini
    if (!['approved', 'rejected'].includes(status_baru)) {
      return NextResponse.json({ error: 'Status tidak valid!' }, { status: 400 });
    }

    // Gunakan Kunci Sakti Admin
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let tableName = '';
    if (tipe === 'agen') {
      tableName = 'agen';
    } else if (tipe === 'perusahaan') {
      tableName = 'perusahaan_industri';
    } else {
      return NextResponse.json({ error: 'Tipe mitra tidak dikenal!' }, { status: 400 });
    }

    // Eksekusi perubahan data di database
    const { error } = await supabaseAdmin
      .from(tableName)
      .update({ status_verifikasi: status_baru })
      .eq('id', id_target);

    if (error) throw error;

    return NextResponse.json({
      message: `Berhasil mengubah status ${tipe} menjadi ${status_baru}!`,
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server: ' + err.message },
      { status: 500 }
    );
  }
}