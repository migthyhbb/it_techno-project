import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createAdminClient } from '@/lib/supabase/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const formData = await request.formData();
    
    const id_perusahaan = formData.get('id_perusahaan') as string;
    const inputNpwp = formData.get('npwp') as string;
    const inputNama = formData.get('nama_perusahaan') as string;
    const fileDokumen = formData.get('dokumen_npwp') as File;

    if (!id_perusahaan || !inputNpwp || !inputNama || !fileDokumen) {
      return NextResponse.json(
        { error: "Data tidak lengkap. Wajib mengirim id_perusahaan, npwp, nama_perusahaan, dan dokumen_npwp." }, 
        { status: 400 }
      );
    }

    // 1. Siapkan Buffer Gambar
    const bytes = await fileDokumen.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ==========================================
    // 2. UPLOAD GAMBAR KE SUPABASE STORAGE
    // ==========================================
    // Buat nama file unik (ID Perusahaan + Timestamp) agar tidak bentrok
    const fileExt = fileDokumen.name.split('.').pop();
    const fileName = `${id_perusahaan}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('npwp_bucket')
      .upload(fileName, buffer, {
        contentType: fileDokumen.type,
        upsert: false // Jangan timpa file yang sudah ada
      });

    if (uploadError) {
      console.error("Gagal Upload Storage:", uploadError);
      return NextResponse.json({ error: "Gagal mengunggah foto dokumen ke server." }, { status: 500 });
    }

    // Dapatkan Public URL dari gambar yang baru diupload
    const { data: urlData } = supabase.storage
      .from('npwp_bucket')
      .getPublicUrl(fileName);
      
    const publicDocumentUrl = urlData.publicUrl;

    // ==========================================
    // 3. ANALISIS AI GEMINI
    // ==========================================
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      Kamu asisten KYC. Baca dokumen legal (NPWP/Izin Usaha) ini.
      Ekstrak 'Nomor NPWP' (angka saja) dan 'Nama Perusahaan'.
      Jawab dengan JSON murni tanpa markdown:
      {
        "npwp_ditemukan": "123456789012345",
        "nama_ditemukan": "PT MAJU JAYA",
        "is_dokumen_jelas": true
      }
    `;

    const imageParts = [{ inlineData: { data: buffer.toString("base64"), mimeType: fileDokumen.type } }];
    const result = await model.generateContent([prompt, ...imageParts]);
    
    let responseText = result.response.text().trim();
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    const extractedData = JSON.parse(responseText);

    // ==========================================
    // 4. KEPUTUSAN & UPDATE DATABASE
    // ==========================================
    // Skenario A: Buram
    if (!extractedData.is_dokumen_jelas) {
      await updateDataKYC(supabase, id_perusahaan, 'need_review', publicDocumentUrl);
      return NextResponse.json({ 
        message: "Dokumen buram. Diteruskan ke Admin.", status: "need_review" 
      }, { status: 202 });
    }

    // Pembersihan & Pencocokan
    const cleanInputNpwp = inputNpwp.replace(/\D/g, '');
    const cleanExtractedNpwp = (extractedData.npwp_ditemukan || '').replace(/\D/g, '');
    const inputNamaLower = inputNama.toLowerCase().replace(/pt\.?|cv\.?|ud\.?/g, '').trim();
    const extractedNamaLower = (extractedData.nama_ditemukan || '').toLowerCase();
    
    const isNpwpMatch = cleanInputNpwp === cleanExtractedNpwp && cleanInputNpwp.length > 0;
    const isNamaMatch = extractedNamaLower.includes(inputNamaLower);

    // Skenario B: Lulus
    if (isNpwpMatch && isNamaMatch) {
      await updateDataKYC(supabase, id_perusahaan, 'verified', publicDocumentUrl);
      return NextResponse.json({ 
        message: "Verifikasi Berhasil!", status: "verified", data: extractedData
      }, { status: 200 });
    } 
    
    // Skenario C: Typo / Beda Data
    else {
      await updateDataKYC(supabase, id_perusahaan, 'need_review', publicDocumentUrl);
      return NextResponse.json({ 
        message: "Data beda dengan dokumen. Menunggu verifikasi Admin.", status: "need_review",
      }, { status: 202 });
    }

  } catch (error: any) {
    console.error("KYC AI API Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 });
  }
}

// Helper Function: Sekarang menyimpan status DAN URL Gambar
async function updateDataKYC(supabaseAdmin: any, id: string, status: string, fotoUrl: string) {
  const { error } = await supabaseAdmin
    .from('perusahaan')
    .update({ 
      status_verifikasi: status,
      url_dokumen_npwp: fotoUrl // Menyimpan link gambar untuk dilihat Admin!
    })
    .eq('id', id);
  
  if (error) throw new Error("Database update failed");
}