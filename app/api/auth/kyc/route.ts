import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // KITA BUANG ADMIN CLIENT!


export async function POST(request: Request) {
  try {
    const supabase = await createClient(); // Hanya mengandalkan RLS (Aman!)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const inputNpwp = formData.get('npwp') as string;
    const inputNama = formData.get('nama_perusahaan') as string;
    const fileDokumen = formData.get('dokumen_npwp') as File;

    if (!inputNpwp || !inputNama || !fileDokumen) {
      return NextResponse.json({ error: "Data KYC tidak lengkap." }, { status: 400 });
    }

    const bytes = await fileDokumen.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `${user.id}_${Date.now()}.${fileDokumen.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage
      .from('industri_documents')
      .upload(`npwp/${fileName}`, buffer, { contentType: fileDokumen.type });

    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from('industri_documents').getPublicUrl(`npwp/${fileName}`);

    // Update ke tabel Industri Profiles
    await supabase.from('industri_profiles').update({
      status_verifikasi: 'need_review',
      url_dokumen_npwp: urlData.publicUrl
    }).eq('user_id', user.id);

    return NextResponse.json({ message: "Dokumen diterima. Menunggu verifikasi AI/Admin." }, { status: 200 });
  } catch (error: unknown) {
    console.error("KYC Error:", error);
    return NextResponse.json({ error: "Gagal memproses dokumen." }, { status: 500 });
  }
}