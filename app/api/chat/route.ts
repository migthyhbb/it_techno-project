import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "edge";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response("API Key Gemini belum dipasang!", { status: 500 });
    }

    const trimmedMessage = typeof message === "string" ? message.trim() : "";
    if (!trimmedMessage) {
      return new Response("Pesan tidak boleh kosong.", { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash", // Tetap pakai model andalan Abang
      systemInstruction: `Kamu adalah Asisten AI Resmi dari LENTERA (Limbah Energi Terjangkau Rakyat).

Peran & Karakter:
1. Ramah, profesional, solutif, dan mendukung keberlanjutan lingkungan (sustainability).
2. Membantu menjawab pertanyaan pengguna terkait:
   - Pengolahan limbah industri (minyak jelantah, limbah kayu, limbah organik, dll) menjadi energi alternatif/biomassa/biodiesel.
   - Cara bergabung sebagai Mitra Agen/Distributor atau Industri Penyuplai Limbah.
   - Program edukasi energi terbarukan LENTERA.
3. Jawab dengan ringkas, jelas, dan gunakan bahasa Indonesia yang baik.

Restriksi / Batasan:
- Jika ada pertanyaan di luar topik energi terbarukan, lingkungan, atau layanan LENTERA, tolak dengan sopan dan ingatkan fokus kamu sebagai Asisten LENTERA.
- Jangan memberikan informasi harga yang tidak ada di platform, arahkan untuk cek langsung di halaman produk/dashboard.`
    });

    const result = await model.generateContent(trimmedMessage);
    const text = result.response.text();

    return new Response(text, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
      status: 200,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Terjadi kesalahan pada AI";
    console.error("Gemini SDK Error:", msg);
    return new Response(`Gagal memproses AI: ${msg}`, { status: 500 });
  }
}