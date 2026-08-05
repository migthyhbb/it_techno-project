import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Kita pakai POST karena calon agen akan mengirim data form ke server
export async function POST(request: Request) {
  try {
    // 1. Menangkap data yang diketik oleh calon agen dari Frontend
    const dataKirim: any = await request.json(); 
    
    // 2. Membongkar isi datanya
    const { nama_toko, lokasi, nik_nib, setuju_kontrak } = dataKirim;

    // Validasi super simpel (KISS)
    if (!nama_toko || !lokasi || !nik_nib || !setuju_kontrak) {
      return NextResponse.json(
        { pesan: "Data tidak lengkap atau E-Contract belum disetujui!" }, 
        { status: 400 }
      );
    }

    // 3. Memasukkan data ke tabel 'calon_mitra' di Supabase
    const { data, error } = await supabase
      .from('calon_mitra')
      .insert([
        { 
          nama_toko: nama_toko, 
          lokasi: lokasi, 
          nik_nib: nik_nib, 
          status_kontrak: setuju_kontrak,
          status_verifikasi: 'pending' // Otomatis pending nunggu Admin
        }
      ])
      .select();

    if (error) throw error;

    // 4. Beri jawaban sukses ke Frontend
    return NextResponse.json({ 
      pesan: "Pendaftaran berhasil! Menunggu verifikasi Admin.",
      data_baru: data 
    });

  } catch (error) {
    return NextResponse.json(
      { pesan: "Gagal menyimpan pendaftaran", error }, 
      { status: 500 }
    );
  }
}

