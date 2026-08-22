import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pertanyaan } = body;

    if (!pertanyaan) {
      return NextResponse.json({ error: 'Pertanyaan kosong' }, { status: 400 });
    }

    // Menggunakan Gemini generasi terbaru (2.5 Flash)
    // GANTI BARIS INI:
const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash', // <--- INI DIA MODEL TERBARUNYA!
  systemInstruction: `Kamu adalah asisten ahli dan konsultan resmi dalam bidang pengelolaan limbah industri. 
  Tugasmu adalah membantu perusahaan dan agen dalam memahami regulasi limbah, jenis-jenis limbah (B3 dan Non-B3), serta prosedur daur ulang.
  Gunakan bahasa Indonesia yang profesional, sopan, dan ringkas.
  Jika pengguna bertanya di luar topik pengelolaan limbah, industri, atau lingkungan hidup, tolak dengan sopan dan arahkan kembali ke topik pengelolaan limbah.`
});
    
    const result = await model.generateContent(pertanyaan);
    const jawabanAI = result.response.text();

    return NextResponse.json({ jawaban: jawabanAI }, { status: 200 });

  } catch (error: any) {
    console.error('Error Detail dari Google:', error.message);
    return NextResponse.json({ 
      error: 'Gagal menghubungi AI',
      detail: error.message 
    }, { status: 500 });
  }
}