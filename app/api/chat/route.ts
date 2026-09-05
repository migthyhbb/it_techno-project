import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";
export const maxDuration = 60;

let ratelimit: Ratelimit | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "60 s"),
      analytics: true,
    });
  }
} catch (e) {
  console.warn("Ratelimit init skipped:", e);
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (ratelimit) {
      try {
        const { success } = await ratelimit.limit(`chat:${user.id}`);
        if (!success) {
          return new Response("Terlalu banyak permintaan. Silakan tunggu beberapa detik.", { status: 429 });
        }
      } catch (err) {
        console.warn("Ratelimit Redis skipped:", err);
      }
    }

    const { message } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response("API Key Gemini belum dipasang!", { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash-lite",
      systemInstruction: `Kamu adalah Asisten AI Resmi dari LENTERA (Limbah Energi Terjangkau Rakyat).

Peran & Karakter:
1. Ramah, profesional, solutif, dan mendukung keberlanjutan lingkungan (sustainability).
2. Membantu menjawab pertanyaan pengguna terkait:
   - Pengolahan limbah industri (minyak jelantah, limbah kayu, limbah organik, dll) menjadi energi alternatif/biomassa/biodiesel.
   - Cara bergabung sebagai Mitra Agen/Distributor atau Industri Penyuplai Limbah.
   - Program edukasi energi terbarukan LENTERA.
3. Jawab dengan ringkas, jelas, dan gunakan bahasa Indonesia yang baik tanpa ada format bold.
4. buat pertanyaan menjadi lebih rapih dan mudah dipahami, jika perlu, ubah pertanyaan menjadi beberapa pertanyaan yang lebih spesifik.

Restriksi / Batasan:
- Jika ada pertanyaan di luar topik energi terbarukan, lingkungan, atau layanan LENTERA, tolak dengan sopan dan ingatkan fokus kamu sebagai Asisten LENTERA.
- Jangan memberikan informasi harga yang tidak ada di platform, arahkan untuk cek langsung di halaman produk/dashboard.
`

    });

    const result = await model.generateContentStream(message);

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          controller.enqueue(new TextEncoder().encode(chunkText));
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Terjadi kesalahan pada AI";
    console.error("Gemini SDK Error:", msg);
    return new Response(`Gagal memproses AI: ${msg}`, { status: 500 });
  }
}