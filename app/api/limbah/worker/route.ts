import { NextResponse } from 'next/server';
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createAdminClient } from '@/lib/supabase/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function handler(request: Request) {
  try {
    const supabase = createAdminClient();
    const { user_id, deskripsi_input, berat_kg, lokasi, foto_url } = await request.json();

    // 1. Prompt Gemini AI (Paksa format JSON ketat)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" } // Fitur baru Gemini: Anti gagal JSON!
    });

    const prompt = `Analisis limbah: "${deskripsi_input}". Apakah ini Berbahaya (B3) atau bisa didaur ulang biasa (NON_B3)? Jawab dengan format JSON: {"kategori": "B3" atau "NON_B3", "jalur_proses": "FORWARD_PIHAK_3" atau "IN_HOUSE", "alasan": "..."}`;

    const result = await model.generateContent(prompt);
    const aiData = JSON.parse(result.response.text());

    // 2. Hitung Tagihan vs Poin
    const isB3 = aiData.kategori === 'B3';
    const totalTagihan = isB3 ? (berat_kg * 50000) : 0; // Rp 50.000 per kg untuk B3
    const poinDidapat = isB3 ? 0 : Math.round(berat_kg * 10);
    const statusAwal = isB3 ? 'menunggu_pembayaran' : 'menunggu_konfirmasi';

    // 3. Simpan Keputusan ke Tabel Utama
    const { error: insertError } = await supabase.from('waste_shipments').insert([{
      user_id: user_id,
      nama_limbah: deskripsi_input,
      perkiraan_berat: berat_kg,
      lokasi_penjemputan: lokasi,
      foto_url: foto_url,
      kategori: aiData.kategori,
      jalur_proses: aiData.jalur_proses,
      keputusan_ai: aiData.alasan,
      total_biaya: totalTagihan,
      poin_didapat: poinDidapat,
      status: statusAwal
    }]);

    if (insertError) throw insertError;

    return NextResponse.json({ success: true });

 } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Gagal memproses AI";
    console.error("Worker AI Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const POST = verifySignatureAppRouter(handler);