import { NextResponse } from 'next/server';
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createAdminClient } from '@/lib/supabase/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ==========================================
// FUNGSI UTAMA WORKER
// ==========================================
async function handler(request: Request) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const { id_perusahaan, deskripsi_input, berat_kg } = body;

    // 1. TANYA GEMINI AI
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      Analisis limbah pabrik ini: "${deskripsi_input}".
      Apakah ini masuk kategori limbah Berbahaya & Beracun (B3) atau bisa didaur ulang biasa (NON_B3)?
      Jawab dalam format JSON murni:
      {
        "kategori": "B3",
        "jalur_proses": "FORWARD_PIHAK_3",
        "alasan": "Mengandung bahan kimia berbahaya"
      }
      ATAU
      {
        "kategori": "NON_B3",
        "jalur_proses": "IN_HOUSE",
        "alasan": "Bisa diolah menjadi briket/kompos"
      }
    `;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text().trim();
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    const aiData = JSON.parse(responseText);

    // 2. SIMPAN HASIL KEPUTUSAN AI KE DATABASE
    const { error: insertError } = await supabase
      .from('transaksi_limbah')
      .insert([{
        id_perusahaan,
        deskripsi_input,
        berat_kg,
        kategori: aiData.kategori,
        jalur_proses: aiData.jalur_proses,
        status: 'menunggu_penjemputan'
      }]);

    if (insertError) throw new Error("Gagal insert hasil AI ke Supabase");

    // Catatan: Jika AI memutuskan NON_B3, abang bisa sisipkan kodingan Redis ZINCRBY di sini
    // persis seperti yang kita buat di API setoran-limbah sebelumnya.

    return NextResponse.json({ success: true, ai_decision: aiData });

  } catch (error: any) {
    console.error("Worker AI Error:", error);
    // Jika kita return error (500), QStash tahu ini gagal dan akan mencoba lagi (Retry)
    return NextResponse.json({ error: "Gagal memproses AI" }, { status: 500 });
  }
}

// ==========================================
// MIDDLEWARE KEAMANAN QSTASH
// ==========================================
// Bungkus handler dengan verifySignature agar hacker tidak bisa tembak URL ini
export const POST = verifySignatureAppRouter(handler);