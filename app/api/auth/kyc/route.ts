import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createAdminClient } from '@/lib/supabase/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // Maksimal 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

interface AIAnalysisResult {
  npwp_ditemukan: string;
  nama_ditemukan: string;
  is_dokumen_jelas: boolean;
}

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const formData = await request.formData();
    
    const id_perusahaan = formData.get('id_perusahaan') as string;
    const inputNpwp = formData.get('npwp') as string;
    const inputNama = formData.get('nama_perusahaan') as string;
    const fileDokumen = formData.get('dokumen_npwp') as File;

    // 1. VALIDASI INPUT AWAL
    if (!id_perusahaan || !inputNpwp || !inputNama || !fileDokumen) {
      return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
    }
    if (!ALLOWED_MIME_TYPES.includes(fileDokumen.type)) {
      return NextResponse.json({ error: "Format file wajib JPG, PNG, atau PDF." }, { status: 400 });
    }
    if (fileDokumen.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Ukuran dokumen maksimal 5MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await fileDokumen.arrayBuffer());

    // 2. EKSEKUSI PARALEL (Upload & AI Analisis berjalan bersamaan)
    const [publicDocumentUrl, extractedData] = await Promise.all([
      uploadToSupabase(supabase, buffer, fileDokumen, id_perusahaan),
      analyzeWithGemini(buffer, fileDokumen.type)
    ]);

    // 3. LOGIKA PENCOCOKAN DATA
    if (!extractedData.is_dokumen_jelas) {
      await updateDataKYC(supabase, id_perusahaan, 'need_review', publicDocumentUrl);
      return NextResponse.json({ message: "Dokumen buram. Diteruskan ke Admin.", status: "need_review" }, { status: 202 });
    }

    const cleanInputNpwp = inputNpwp.replace(/\D/g, '');
    const cleanExtractedNpwp = (extractedData.npwp_ditemukan || '').replace(/\D/g, '');
    const inputNamaLower = inputNama.toLowerCase().replace(/pt\.?|cv\.?|ud\.?/g, '').trim();
    const extractedNamaLower = (extractedData.nama_ditemukan || '').toLowerCase();
    
    const isMatch = (cleanInputNpwp === cleanExtractedNpwp && cleanInputNpwp.length > 0) && 
                    extractedNamaLower.includes(inputNamaLower);

    // 4. HASIL AKHIR
    const finalStatus = isMatch ? 'verified' : 'need_review';
    const finalMessage = isMatch ? "Verifikasi Berhasil!" : "Data berbeda dengan dokumen. Menunggu verifikasi Admin.";
    const statusCode = isMatch ? 200 : 202;

    await updateDataKYC(supabase, id_perusahaan, finalStatus, publicDocumentUrl);
    
    return NextResponse.json({ message: finalMessage, status: finalStatus, data: extractedData }, { status: statusCode });

  } catch (error: any) {
    console.error("KYC Process Error:", error.message);
    return NextResponse.json({ error: "Terjadi kesalahan internal server saat memproses KYC." }, { status: 500 });
  }
}

// --- HELPER FUNCTIONS ---
async function uploadToSupabase(supabaseAdmin: any, buffer: Buffer, file: File, id: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${id}_${Date.now()}.${fileExt}`;
  const { error } = await supabaseAdmin.storage.from('npwp_bucket').upload(fileName, buffer, { contentType: file.type, upsert: false });
  if (error) throw new Error("Gagal upload gambar ke Storage");
  
  const { data } = supabaseAdmin.storage.from('npwp_bucket').getPublicUrl(fileName);
  return data.publicUrl;
}

async function analyzeWithGemini(buffer: Buffer, mimeType: string): Promise<AIAnalysisResult> {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" } // Kunci kestabilan AI
  });

  const prompt = `Ekstrak data dari dokumen legal ini. Format HANYA JSON: {"npwp_ditemukan": "angka tanpa titik", "nama_ditemukan": "nama perusahaan", "is_dokumen_jelas": boolean}`;
  const result = await model.generateContent([prompt, { inlineData: { data: buffer.toString("base64"), mimeType } }]);
  return JSON.parse(result.response.text()) as AIAnalysisResult;
}

async function updateDataKYC(supabaseAdmin: any, id: string, status: string, fotoUrl: string) {
  const { error } = await supabaseAdmin.from('perusahaan').update({ status_verifikasi: status, url_dokumen_npwp: fotoUrl }).eq('id', id);
  if (error) throw new Error("Gagal update status KYC di database");
}