import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { reply: "API Key Gemini belum dipasang di .env.local!" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      systemInstruction:
        "Kamu adalah Asisten AI LENTERA, platform pengelolaan limbah industri menjadi bahan bakar energi terbarukan (biogas, bioetanol). " +
        "Tugasmu membantu Mitra dan Industri menjawab pertanyaan seputar pengolahan limbah, sistem token kredit (1 kg limbah = 100 token), " +
        "prosedur penjemputan limbah, pemesanan stok bahan energi, dan pencairan token. Jawablah dengan ramah, jelas, dan profesional dalam Bahasa Indonesia. " +
        "SANGAT PENTING: Jangan pernah menggunakan format markdown seperti tanda bintang double (**), hashtag (#), atau simbol format teks lainnya dalam jawabanmu. Gunakan teks polos biasa.",
    });

    const result = await model.generateContent(message);
    const reply = result.response.text();

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Gemini SDK Error:", error);
    return NextResponse.json(
      { reply: `Gagal memproses AI: ${error?.message || "Terjadi kesalahan"}` },
      { status: 500 }
    );
  }
}