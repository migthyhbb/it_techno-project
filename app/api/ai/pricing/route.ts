import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createAdminClient } from '@/lib/supabase/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// CRON Job biasanya menggunakan metode GET
export async function GET(request: Request) {
  try {
    // ==========================================
    // 1. KEAMANAN ENDPOINT (ANTI-HACK)
    // ==========================================
    // Hanya server terpercaya yang punya CRON_SECRET yang bisa menjalankan AI ini
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: "Akses Ditolak. Endpoint ini hanya untuk sistem otomatisasi (CRON)." }, 
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    // ==========================================
    // 2. ANALISIS PASAR OLEH GEMINI AI
    // ==========================================
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: { responseMimeType: "application/json" } // Paksa AI HANYA balas JSON!
});    
    // Prompt ini bisa abang modifikasi nanti dengan menyuntikkan cuaca asli atau total stok gudang
    const prompt = `
      Kamu adalah AI Economist untuk platform Waste-to-Energy di Palembang.
      Tugasmu adalah menentukan Harga Eceran Tertinggi (HET) produk olahan hari ini.
      Kondisi hari ini: Permintaan stabil, pasokan limbah cukup baik.
      Hasilkan rentang harga dalam Rupiah (kisaran Rp 2.500 - Rp 4.500 per Kg).
      
      Jawab HANYA dalam format JSON murni tanpa markdown, ikuti struktur ini:
      {
        "harga_rekomendasi_ai": 3200,
        "batas_bawah_floor": 2500,
        "batas_atas_ceiling": 4000,
        "alasan": "Pasokan limbah stabil dan operasional pabrik optimal hari ini."
      }
    `;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text().trim();
    
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    
    const aiData = JSON.parse(responseText);

    // ==========================================
    // 3. SIMPAN KE DATABASE (Tabel patokan_harga)
    // ==========================================
    // Sesuai dengan skema tabel abang sebelumnya!
    const { data, error } = await supabase
      .from('patokan_harga')
      .insert([{
        harga_rekomendasi_ai: aiData.harga_rekomendasi_ai,
        batas_bawah_floor: aiData.batas_bawah_floor,
        batas_atas_ceiling: aiData.batas_atas_ceiling,
        status: 'Approved' // Kita set Approved agar langsung dipakai oleh API Kasir
      }])
      .select()
      .single();

    if (error) {
      console.error("Gagal simpan harga AI:", error);
      throw new Error("Database insert failed");
    }

    return NextResponse.json({
      message: "Berhasil! Harga harian telah diperbarui oleh AI.",
      data: data,
      insight_pasar: aiData.alasan
    }, { status: 200 });

  } catch (error: any) {
    console.error("AI Pricing CRON Error:", error);
    return NextResponse.json({ error: "Gagal memproses Dynamic Pricing." }, { status: 500 });
  }
}