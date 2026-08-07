import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server'; // Sesuaikan path jika berbeda
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function PATCH(request: Request) {
  try {
    // 1. CEK IDENTITAS (SATPAM)
    // 1. CEK IDENTITAS (SATPAM)
    const cookieStore = await cookies(); // <-- Wajib tambah 'await' di sini untuk Next.js 15

    const supabaseUser = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { 
            return cookieStore.getAll() 
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                // Format penulisan .set yang benar (dipisah koma, bukan di dalam kurung kurawal)
                cookieStore.set(name, value, options)
              })
            } catch (error) {
              // Kalau Next.js protes "readonly", biarkan saja (diabaikan).
              // Karena Middleware kita yang sebenarnya bertugas merestart/mengupdate cookie-nya.
            }
          }
        }
      }
    );
      

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    
    // Cek apakah user ada dan punya role admin di app_metadata (Bukan user_metadata yang bisa dipalsukan)
    if (authError || !user || user.app_metadata?.role !== 'admin') {
        return NextResponse.json({ error: 'Akses ditolak! Anda bukan admin.' }, { status: 403 });
    }

    // 2. PARSING BODY
    let body;
    try {
      body = await request.json();
    } catch (err) {
      return NextResponse.json({ error: 'Body request tidak valid' }, { status: 400 });
    }

    const { id_target, tipe, status_baru } = body;

    if (!id_target || !tipe || !status_baru) {
      return NextResponse.json(
        { error: 'id_target, tipe, dan status_baru wajib dikirim!' },
        { status: 400 }
      );
    }

    if (!['approved', 'rejected'].includes(status_baru)) {
      return NextResponse.json({ error: 'Status tidak valid!' }, { status: 400 });
    }

    // 3. GUNAKAN KUNCI SAKTI SETELAH LOLOS PENGECEKAN
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

    const { data,error } = await supabaseAdmin
      .from(tableName)
      .update({ status_verifikasi: status_baru })
      .eq('id', id_target)
      .select('id');
    if (error) throw error;

    // Tambahkan blok ini: Cek apakah mitranya beneran ada?
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Mitra tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Status berhasil diubah' }, { status: 200 });
    

  } catch (err: unknown) { // Perbaikan tipe 'any' ke 'unknown' sesuai saran CodeRabbit
    const message = err instanceof Error ? err.message : 'Unknown server error';
    console.error("Error di verifikasi:", err); // Log di server
    return NextResponse.json(
      { error: 'Terjadi kesalahan server saat verifikasi.' }, // Jangan bocorkan err.message ke publik
      { status: 500 }
    );
  }
}