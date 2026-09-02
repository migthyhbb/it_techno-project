import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createAdminClient, createClient } from '@/lib/supabase/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const formData = await request.formData();

    const id_agen = formData.get('id_agen') as string;
    const id_transaksi = formData.get('id_transaksi') as string;
    const deskripsi = formData.get('deskripsi') as string;
    const fileFoto = formData.get('foto_bukti') as File;

    if (!id_agen || !id_transaksi || !fileFoto) {
      return NextResponse.json(
        { error: "Data tidak lengkap. id_agen, id_transaksi, dan foto_bukti wajib ada." },
        { status: 400 }
      );
    }

    // 1. Siapkan Gambar untuk AI
    const bytes = await fileFoto.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 2. ANALISIS AI GEMINI (Screening Lapis 1)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      Kamu adalah inspektur Quality Control (QC). Analisis foto laporan kerusakan ini beserta keluhan dari agen: "${deskripsi}".
      Apakah di foto ini benar-benar terlihat produk energi (briket/cairan) yang rusak, hancur, atau tumpah?
      Atau ini hanya foto palsu/tidak jelas?

      Jawab dengan JSON murni tanpa markdown:
      {
        "is_valid": true,
        "tingkat_kerusakan": 15,
        "alasan_ai": "Terlihat 2 karung briket robek dan isinya hancur berserakan."
      }
      Catatan: tingkat_kerusakan adalah estimasi persentase kerusakan (0-100).
    `;

    const imageParts = [{ inlineData: { data: buffer.toString("base64"), mimeType: fileFoto.type } }];
    const result = await model.generateContent([prompt, ...imageParts]);

    let responseText = result.response.text().trim();
    if (responseText.startsWith('```json')) responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiData = JSON.parse(responseText);

    // 3. UPLOAD FOTO KE STORAGE (Hanya jika disetujui AI atau perlu Review)
    let publicUrl = "";
    if (aiData.is_valid) {
      const fileName = `report_${id_transaksi}_${Date.now()}.${fileFoto.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('laporan_bucket')
        .upload(fileName, buffer, { contentType: fileFoto.type });

      if (!uploadError) {
        publicUrl = supabase.storage.from('laporan_bucket').getPublicUrl(fileName).data.publicUrl;
      }
    }

    // 4. TRIAGE / PEMILAHAN STATUS OTOMATIS
    let finalStatus = 'manual_review';

    if (!aiData.is_valid) {
      // DITOLAK OTOMATIS: Foto tidak nyambung atau gelap
      finalStatus = 'rejected_by_ai';
    } else if (aiData.is_valid && aiData.tingkat_kerusakan <= 20) {
      // AUTO-APPROVAL: Kerusakan ringan di bawah 20%, langsung setujui tanpa admin!
      finalStatus = 'auto_approved';
    }

    // 5. SIMPAN KE DATABASE
    const { error: dbError } = await supabase
      .from('laporan_kendala')
      .insert([{
        id_agen,
        id_transaksi,
        deskripsi,
        foto_bukti: publicUrl,
        keputusan_ai: aiData.alasan_ai,
        estimasi_kerusakan_persen: aiData.tingkat_kerusakan,
        status: finalStatus
      }]);

    if (dbError) throw new Error("Gagal menyimpan laporan ke database");

    // 6. KEMBALIKAN RESPONS KE FRONT-END
    if (finalStatus === 'rejected_by_ai') {
      return NextResponse.json({
        message: "Laporan ditolak otomatis. Bukti foto tidak valid atau tidak menunjukkan kerusakan.",
        status: finalStatus
      }, { status: 400 });
    }

    return NextResponse.json({
      message: finalStatus === 'auto_approved' ? "Klaim kerusakan disetujui otomatis!" : "Laporan diterima, menunggu tinjauan admin.",
      status: finalStatus
    }, { status: 201 });

  } catch (error: unknown) {
    console.error("AI Report API Error:", error);
    return NextResponse.json({ error: "Gagal memproses laporan." }, { status: 500 });
  }
}