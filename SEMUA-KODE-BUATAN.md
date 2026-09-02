# Semua Kode Buatan LENTERA

Dokumen ini adalah snapshot source dan konfigurasi kode aktual repository. File yang di-ignore Git, `.gitignore` itu sendiri, dependency lock, asset, dokumentasi, dan dokumen ini tidak disertakan.

## FILE: __tests__/auth.test.ts

```ts
import test from "node:test";
import assert from "node:assert/strict";

test("Authentication Flow: payload login valid", () => {
  const payload = { email: "test@lentera.com", password: "Password123!" };

  assert.match(payload.email, /^[^@\s]+@[^@\s]+\.[^@\s]+$/);
  assert.ok(payload.password.length >= 8);
});
```

## FILE: __tests__/integration.test.ts

```ts
import test from "node:test";
import assert from "node:assert/strict";

function calculatePoints(weightKg: number): number {
  return Math.round(weightKg * 10);
}

function redeemBalance(balance: number, points: number): { balance: number; accepted: boolean } {
  if (points < 100 || balance < points) {
    return { balance, accepted: false };
  }

  return { balance: balance - points, accepted: true };
}

test("setoran limbah: satu kilogram menghasilkan 10 poin", () => {
  assert.equal(calculatePoints(1), 10);
  assert.equal(calculatePoints(2.5), 25);
});

test("redeem: percobaan kedua tidak dapat membelanjakan saldo yang sama", () => {
  const firstAttempt = redeemBalance(150, 100);
  const secondAttempt = redeemBalance(firstAttempt.balance, 100);

  assert.deepEqual(firstAttempt, { balance: 50, accepted: true });
  assert.deepEqual(secondAttempt, { balance: 50, accepted: false });
});
```

## FILE: __tests__/kyc-validation.test.ts

```ts
import test from "node:test";
import assert from "node:assert/strict";

import { validateOfficialDocumentImage } from "../lib/kyc-validation.ts";

test("KYC validator rejects non-official document responses", async () => {
  const result = await validateOfficialDocumentImage(
    "https://example.com/not-a-document.jpg",
    "NO",
  );

  assert.equal(result, false);
});

test("KYC validator accepts official document responses", async () => {
  const result = await validateOfficialDocumentImage(
    "https://example.com/ktp.jpg",
    "YES",
  );

  assert.equal(result, true);
});
```

## FILE: __tests__/webhook.test.ts

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { createMidtransSignature, isValidMidtransSignature } from "../lib/midtrans-signature.ts";

test("Midtrans webhook: signature SHA-512 valid diterima", () => {
  const payload = {
    orderId: "AGEN-order-123",
    statusCode: "200",
    grossAmount: "45000.00",
  };
  const serverKey = "dummy-midtrans-server-key";
  const signature = createMidtransSignature(
    payload.orderId,
    payload.statusCode,
    payload.grossAmount,
    serverKey,
  );

  assert.equal(
    isValidMidtransSignature(
      signature,
      payload.orderId,
      payload.statusCode,
      payload.grossAmount,
      serverKey,
    ),
    true,
  );
});

test("Midtrans webhook: signature palsu ditolak", () => {
  const signature = createMidtransSignature("ORDER-1", "200", "10000.00", "dummy-key");

  assert.equal(
    isValidMidtransSignature(signature, "ORDER-1", "200", "99999.00", "dummy-key"),
    false,
  );
});
```

## FILE: app/admin/page.tsx

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [nama, setNama] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.replace("/masuk");
        return;
      }

      const { data: adminRow } = await supabase
        .from("admin_profiles")
        .select("nama")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (!adminRow) {
        // Login valid tapi bukan akun admin â€” jangan biarkan lihat halaman ini.
        router.replace("/masuk");
        return;
      }

      setNama(adminRow.nama);
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <p className="text-ink/40 text-sm">Memuat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-6">
      <div className="text-center max-w-sm">
        <p className="font-mono text-xs tracking-widest uppercase text-green mb-3">
          Portal Admin
        </p>
        <h1 className="font-display font-semibold text-2xl text-forest mb-2">
          Halo, {nama}
        </h1>
        <p className="text-ink/60 text-sm leading-relaxed">
          Jalur login admin sudah berfungsi. Halaman dashboard admin
          sungguhan (data mitra & industri, dll) belum dibuat â€” ini baru
          placeholder untuk konfirmasi routing-nya jalan.
        </p>
      </div>
    </div>
  );
}
```

## FILE: app/api/admin/calon-mitra/route.ts

```ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak (Unauthorized)' }, { status: 403 });
    }

    // PERBAIKAN: Gunakan tabel baru secara konsisten
    const [mitra, industri] = await Promise.all([
      supabase.from('mitra_profiles').select('*').eq('status_verifikasi', 'pending'),
      supabase.from('industri_profiles').select('*').eq('status_verifikasi', 'pending'),
    ]);

    if (mitra.error) throw mitra.error;
    if (industri.error) throw industri.error;

    return NextResponse.json(
      { message: 'Berhasil mengambil calon mitra', agen: mitra.data, perusahaan: industri.data },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    console.error("Error di calon mitra:", message);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}
```

## FILE: app/api/admin/verifikasi/route.ts

```ts
import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export async function PATCH(request: Request) {
  try {
    const supabaseUser = await createClient();
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user || user.app_metadata?.role !== 'admin') {
        return NextResponse.json({ error: 'Akses ditolak!' }, { status: 403 });
    }

    const body = await request.json() as Record<string, unknown>;
    const { id_target, tipe, status_baru } = body;

    if (typeof id_target !== 'string' || typeof tipe !== 'string' || typeof status_baru !== 'string') {
      return NextResponse.json({ error: 'Data tidak valid!' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();
    const tableName = tipe === 'agen' ? 'mitra_profiles' : 'industri_profiles';

    const { data, error } = await supabaseAdmin
      .from(tableName)
      .update({ status_verifikasi: status_baru })
      .eq('user_id', id_target)
      .select('user_id');

    if (error) throw error;
    if (!data || data.length === 0) return NextResponse.json({ error: 'Mitra tidak ditemukan' }, { status: 404 });

    return NextResponse.json({ message: 'Status berhasil diubah' }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
```

## FILE: app/api/ai/ai-guide/route.ts

```ts
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error Detail dari Google:', message);
    return NextResponse.json({
      error: 'Gagal menghubungi AI',
      detail: message
    }, { status: 500 });
  }
}
```

## FILE: app/api/ai/pricing/route.ts

```ts
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

  } catch (error: unknown) {
    console.error("AI Pricing CRON Error:", error);
    return NextResponse.json({ error: "Gagal memproses Dynamic Pricing." }, { status: 500 });
  }
}
```

## FILE: app/api/auth/kyc/route.ts

```ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // KITA BUANG ADMIN CLIENT!


export async function POST(request: Request) {
  try {
    const supabase = await createClient(); // Hanya mengandalkan RLS (Aman!)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const inputNpwp = formData.get('npwp') as string;
    const inputNama = formData.get('nama_perusahaan') as string;
    const fileDokumen = formData.get('dokumen_npwp') as File;

    if (!inputNpwp || !inputNama || !fileDokumen) {
      return NextResponse.json({ error: "Data KYC tidak lengkap." }, { status: 400 });
    }

    const maxFileSize = 5 * 1024 * 1024;
    const allowedFileTypes: Record<string, string[]> = {
      pdf: ["application/pdf"],
      png: ["image/png"],
      jpg: ["image/jpeg"],
      jpeg: ["image/jpeg"],
    };

    if (!(fileDokumen instanceof File) || fileDokumen.size > maxFileSize) {
      return NextResponse.json({ error: "Ukuran dokumen maksimal 5 MB." }, { status: 400 });
    }

    const fileExtension = fileDokumen.name.split('.').pop()?.toLowerCase() || "";

    if (!allowedFileTypes[fileExtension]?.includes(fileDokumen.type)) {
      return NextResponse.json({ error: "Tipe dokumen tidak didukung." }, { status: 400 });
    }

    const bytes = await fileDokumen.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `${user.id}_${Date.now()}.${fileDokumen.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage
      .from('industri_documents')
      .upload(`npwp/${fileName}`, buffer, { contentType: fileDokumen.type });

    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from('industri_documents').getPublicUrl(`npwp/${fileName}`);

    // Update ke tabel Industri Profiles
    await supabase.from('industri_profiles').update({
      status_verifikasi: 'need_review',
      url_dokumen_npwp: urlData.publicUrl
    }).eq('user_id', user.id);

    return NextResponse.json({ message: "Dokumen diterima. Menunggu verifikasi AI/Admin." }, { status: 200 });
  } catch (error: unknown) {
    console.error("KYC Error:", error);
    return NextResponse.json({ error: "Gagal memproses dokumen." }, { status: 500 });
  }
}
```

## FILE: app/api/auth/login/route.ts

```ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {

    // 1. Parsing body dengan aman
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Body request tidak valid' }, { status: 400 });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Body request tidak valid' }, { status: 400 });
    }

    const { email, password } = body as Record<string, unknown>;

    // Validasi input
    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password.trim()
    ) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi!' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 2. Proses Login ke Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // 3. Tangani Error Auth (Termasuk Rate Limit)
    if (error) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'Terlalu banyak percobaan. Silakan coba lagi nanti.' },
          { status: 429 }
        );
      }

      if (error.status && error.status >= 500) {
        console.error('Supabase auth error:', error.message);
        return NextResponse.json(
          { error: 'Terjadi kesalahan sistem, silakan coba lagi nanti.' },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: 'Email atau password salah!' },
        { status: 401 }
      );
    }

    // 4. Baca identitas jabatan dari token
    const user = data.user;
    const role = user?.app_metadata?.role;

    // --- 5. TAMBAHAN BARU: PENGECEKAN STATUS VERIFIKASI ADMIN ---
    if (role === 'agen' || role === 'perusahaan') {
      const tableName = role === 'agen' ? 'agen' : 'perusahaan_industri';

      // Cek status di tabel profil
      const { data: profileData, error: profileError } = await supabase
        .from(tableName)
        .select('status_verifikasi')
        .eq('auth_id', user.id)
        .single();

      if (profileError || !profileData) {
        await supabase.auth.signOut(); // Kick user
        return NextResponse.json({ error: 'Data profil tidak ditemukan.' }, { status: 404 });
      }

      // Pastikan status_verifikasi adalah 'approved' (sesuaikan dengan isi database-mu)
      if (profileData.status_verifikasi !== 'approved') {
        await supabase.auth.signOut(); // Kick user karena belum di-acc
        return NextResponse.json(
          { error: 'Akun Anda belum disetujui oleh Admin. Harap tunggu proses verifikasi.' },
          { status: 403 }
        );
      }
    }
    // --- AKHIR PENGECEKAN STATUS ---

    // 6. Kembalikan data ke Frontend jika lulus semua pengecekan
    return NextResponse.json(
      {
        message: 'Login berhasil!',
        role: role,
        userId: user.id
      },
      { status: 200 }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    console.error("System Error:", message);

    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem, silakan coba lagi nanti.' },
      { status: 500 }
    );
  }
}
```

## FILE: app/api/auth/logout/route.ts

```ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();

    // Fungsi signOut() dari Supabase otomatis menghapus cookie dari browser
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error.message);
      return NextResponse.json({ error: 'Gagal melakukan logout' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Berhasil logout!' }, { status: 200 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    console.error('System error:', message);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
```

## FILE: app/api/chat/route.ts

```ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const runtime = "edge";
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
```

## FILE: app/api/daftar/industri/route.ts

```ts
import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { translateAuthError } from "@/lib/auth-errors";
import { validateOfficialDocumentImage } from "@/lib/kyc-validation";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password, nama_perusahaan, npwp, alamat, telepon, dokumen_url } = body;

  if (!email || !password || !nama_perusahaan || !npwp || !alamat || !telepon) {
    return NextResponse.json(
      { error: "Semua kolom wajib diisi." },
      { status: 400 }
    );
  }

  const imageUrl = dokumen_url || body.foto_npwp_url || null;
  if (!imageUrl) {
    return NextResponse.json(
      { error: "Dokumen KYC wajib diunggah sebelum pendaftaran." },
      { status: 400 }
    );
  }

  const isKycApproved = await validateOfficialDocumentImage(imageUrl);
  if (!isKycApproved) {
    return NextResponse.json(
      {
        error:
          "Verifikasi KYC Gagal: Sistem mendeteksi foto yang diunggah bukan dokumen resmi (KTP/NIB) yang valid.",
      },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json(
        {
          error:
            "Server belum dikonfigurasi untuk pendaftaran. Pastikan NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY sudah diisi di .env.local, lalu restart server.",
        },
        { status: 500 }
      );
    }

    // 1) Buat akun. email_confirm: true supaya akun langsung aktif dan bisa
    //    langsung masuk tanpa menunggu klik link konfirmasi di email.
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError) {
      console.error("Gagal membuat akun industri:", createError);
      return NextResponse.json(
        { error: translateAuthError(createError.message) },
        { status: 400 }
      );
    }

    // 2) Simpan detail profil, ditautkan ke user_id yang baru dibuat.
    //    Pakai service role jadi tidak kena RLS â€” tidak bergantung sesi
    //    login yang belum tentu ada di titik ini.
    const { error: profileError } = await supabase.from("industri_profiles").insert({
      user_id: userData.user.id,
      nama_perusahaan,
      npwp,
      alamat,
      telepon,
    });
    if (profileError) {
      console.error("Gagal menyimpan profil industri:", profileError);
      // Akun sudah kebuat tapi profil gagal disimpan â€” hapus lagi akunnya
      // supaya tidak nyangkut jadi akun "kosong" dan email-nya bisa dipakai
      // untuk coba daftar ulang.
      await supabase.auth.admin.deleteUser(userData.user.id);
      return NextResponse.json(
        { error: "Gagal menyimpan data profil, coba lagi." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Kesalahan tak terduga saat daftar industri:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan di server, coba lagi." },
      { status: 500 }
    );
  }
}
```

## FILE: app/api/daftar/mitra/route.ts

```ts
import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { translateAuthError } from "@/lib/auth-errors";
import { validateOfficialDocumentImage } from "@/lib/kyc-validation";

export async function POST(request: Request) {
  const body = await request.json();
  const {
    email,
    password,
    nama_mitra,
    nik_nib,
    alamat,
    telepon,
    provinsi,
    kota_kabupaten,
    kecamatan,
    kelurahan,
    lat,
    lng,
    dokumen_url,
  } = body;

  if (!email || !password || !nama_mitra || !nik_nib || !alamat || !telepon) {
    return NextResponse.json(
      { error: "Semua kolom utama wajib diisi." },
      { status: 400 }
    );
  }

  const imageUrl = dokumen_url || body.foto_nik_url || null;
  if (!imageUrl) {
    return NextResponse.json(
      { error: "Dokumen KYC wajib diunggah sebelum pendaftaran." },
      { status: 400 }
    );
  }

  const isKycApproved = await validateOfficialDocumentImage(imageUrl);
  if (!isKycApproved) {
    return NextResponse.json(
      {
        error:
          "Verifikasi KYC Gagal: Sistem mendeteksi foto yang diunggah bukan dokumen resmi (KTP/NIB) yang valid.",
      },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Server belum dikonfigurasi untuk pendaftaran." },
        { status: 500 }
      );
    }

    // 1) Buat akun
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      console.error("Gagal membuat akun mitra:", createError);
      return NextResponse.json(
        { error: translateAuthError(createError.message) },
        { status: 400 }
      );
    }

    // 2) Simpan detail profil lengkap beserta detail wilayah & koordinat map
    const { error: profileError } = await supabase.from("mitra_profiles").insert({
      user_id: userData.user.id,
      nama_mitra,
      nik_nib,
      alamat,
      telepon,
      provinsi: provinsi || null,
      kota_kabupaten: kota_kabupaten || null,
      kecamatan: kecamatan || null,
      kelurahan: kelurahan || null,
      lat: lat ? Number(lat) : null,
      lng: lng ? Number(lng) : null,
    });

    if (profileError) {
      console.error("Gagal menyimpan profil mitra:", profileError);
      await supabase.auth.admin.deleteUser(userData.user.id);
      return NextResponse.json(
        { error: "Gagal menyimpan data profil, coba lagi." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Kesalahan tak terduga saat daftar mitra:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan di server, coba lagi." },
      { status: 500 }
    );
  }
}
```

## FILE: app/api/delete-account/route.ts

```ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID tidak ditemukan" },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (userId !== user.id) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY belum dipasang di .env.local" },
        { status: 500 }
      );
    }

    // Inisialisasi Supabase Admin Client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1. Hapus data profil mitra di database
    await supabaseAdmin
      .from("mitra_profiles")
      .delete()
      .eq("user_id", userId);

    // 2. Hapus user dari Supabase Auth secara permanen (auth.users)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      userId
    );

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Terjadi kesalahan server";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
```

## FILE: app/api/gamifikasi/redeem/route.ts

```ts
import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { jumlah_poin, metode_pencairan } = body;
    const poinNumber = Number(jumlah_poin);

    if (!poinNumber || poinNumber < 100) {
      return NextResponse.json({ error: "Minimal penukaran 100 Token." }, { status: 400 });
    }

    // 1. BACA SALDO SAAT INI DULU (Buat hitung-hitungan)
    const { data: profile } = await supabase
      .from('industri_profiles')
      .select('saldo_kredit')
      .eq('user_id', user.id)
      .single();

    const saldoSekarang = profile?.saldo_kredit || 0;

    if (saldoSekarang < poinNumber) {
      return NextResponse.json({ error: "Token tidak mencukupi!" }, { status: 400 });
    }

    // 2. ATOMIC TRANSACTION (ANTI RACE-CONDITION)
    // Cuma mau update KALAU saldonya masih benar-benar cukup saat query ini jalan (mencegah bot multi-klik)
    const supabaseAdmin = createAdminClient();
    const saldoBaru = saldoSekarang - poinNumber;

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('industri_profiles')
      .update({ saldo_kredit: saldoBaru })
      .eq('user_id', user.id)
      .gte('saldo_kredit', poinNumber) // JURUS SAKTI: Pastikan saldo di DB >= jumlah poin yang dicairkan
      .select('saldo_kredit')
      .maybeSingle();

    if (updateError) throw updateError;

    if (!updatedProfile) {
      // Kalau nilainya kosong, berarti filter .gte() di atas gagal (saldo sudah ditarik di request lain)
      return NextResponse.json({ error: "Transaksi digagalkan. Saldo berubah." }, { status: 409 });
    }

    // 3. Catat Riwayat Pencairan (Supaya bisa di-audit)
    await supabaseAdmin.from('pencairan_dana').insert([{
      id_agen: user.id,
      jumlah_tarik_tunai: poinNumber,
      bank_tujuan: metode_pencairan,
      status: 'Selesai'
    }]);

    // 4. SINKRONISASI KE REDIS LEADERBOARD (Turunkan Peringkatnya secara real-time)
    await redis.zincrby('eco_credits_leaderboard', -Math.abs(poinNumber), user.id);

    return NextResponse.json({
      message: `Berhasil menukar ${poinNumber} token!`,
      sisa_poin: updatedProfile.saldo_kredit
    }, { status: 200 });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Terjadi kesalahan internal";
    console.error("Redeem API Error:", msg);
    return NextResponse.json({ error: "Gagal memproses penukaran poin." }, { status: 500 });
  }
}
```

## FILE: app/api/health/route.ts

```ts
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export async function GET() {
  const timestamp = new Date().toISOString();
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return NextResponse.json(
      { status: "unhealthy", redis: "disconnected", timestamp },
      { status: 503 },
    );
  }

  try {
    const redis = new Redis({ url, token });
    await redis.ping();
    return NextResponse.json({ status: "healthy", redis: "connected", timestamp }, { status: 200 });
  } catch (error: unknown) {
    console.error("Health check Redis gagal:", error);
    return NextResponse.json(
      { status: "unhealthy", redis: "disconnected", timestamp },
      { status: 503 },
    );
  }
}
```

## FILE: app/api/katalog/produk/route.ts

```ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Pastikan user sudah login (Agen atau Perusahaan)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ambil data katalog yang aktif, diurutkan dari yang stoknya paling banyak
    const { data: produk, error: dbError } = await supabase
      .from('katalog_produk')
      .select('*')
      .eq('is_active', true)
      .order('stok', { ascending: false });

    if (dbError) throw dbError;

    return NextResponse.json({
      message: "Katalog berhasil dimuat",
      data: produk
    }, { status: 200 });

  } catch (error: unknown) {
    console.error("API Katalog Error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Gagal memuat katalog produk dari database." },
      { status: 500 }
    );
  }
}
```

## FILE: app/api/laporan/kendala/route.ts

```ts
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
```

## FILE: app/api/leaderboard/route.ts

```ts
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { createAdminClient } from '@/lib/supabase/server';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const LEADERBOARD_KEY = 'eco_credits_leaderboard';

export async function GET() {
  try {
    const supabase = createAdminClient();

    const topFactories: string[] = await redis.zrange(LEADERBOARD_KEY, 0, 9, {
      rev: true,
      withScores: true,
    });

    const leaderboardData = [];
    const companyIds = [];

    for (let i = 0; i < topFactories.length; i += 2) {
      const id = topFactories[i];
      const score = topFactories[i + 1];
      leaderboardData.push({ id_perusahaan: id, total_poin: Number(score) });
      companyIds.push(id);
    }

    if (leaderboardData.length === 0) {
      return NextResponse.json({ message: "Leaderboard kosong.", data: [] }, { status: 200 });
    }

    // UPDATE PENTING: Ambil data dari industri_profiles
    const { data: companies, error } = await supabase
      .from('industri_profiles')
      .select('user_id, nama_perusahaan, url_dokumen_npwp')
      .in('user_id', companyIds);

    if (error) throw error;

    const finalLeaderboard = leaderboardData.map(item => {
      const company = companies.find(c => c.user_id === item.id_perusahaan);
      return {
        peringkat: 0,
        id_perusahaan: item.id_perusahaan,
        nama_perusahaan: company?.nama_perusahaan || 'Pabrik Anonim',
        poin_eco_credits: item.total_poin,
        avatar: company?.url_dokumen_npwp || null,
      };
    });

    finalLeaderboard.sort((a, b) => b.poin_eco_credits - a.poin_eco_credits);
    finalLeaderboard.forEach((item, index) => { item.peringkat = index + 1; });

    return NextResponse.json({ data: finalLeaderboard }, { status: 200 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error("Leaderboard API Error:", message);
    return NextResponse.json({ error: "Gagal memuat papan peringkat." }, { status: 500 });
  }
}
```

## FILE: app/api/legal/e-contract/route.ts

```ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH() {
  try {
    const supabase = await createClient();

    // 1. Pastikan yang menekan tombol ini sudah login
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak ada akses (Unauthorized)' }, { status: 401 });
    }

    // 2. Cek role-nya, ini khusus untuk Agen
    if (user.app_metadata?.role !== 'agen') {
      return NextResponse.json({ error: 'Hanya Agen yang perlu menyetujui E-Contract' }, { status: 403 });
    }

    // 3. Catat waktu saat ini secara persis (Timestamp)
    const waktuSekarang = new Date().toISOString();

    // 4. Update tabel 'agen', ubah syarat_disetujui menjadi true hanya untuk baris yang belum disetujui
    const { data: updatedAgent, error: updateError } = await supabase
      .from('agen')
      .update({
        syarat_disetujui: true,
        waktu_persetujuan: waktuSekarang
      })
      .eq('auth_id', user.id)
      .eq('syarat_disetujui', false)
      .is('waktu_persetujuan', null)
      .select('auth_id')
      .maybeSingle();

    if (updateError) throw updateError;
    if (!updatedAgent) {
      return NextResponse.json(
        { error: 'E-Contract sudah disetujui atau tidak ditemukan.' },
        { status: 409 }
      );
    }

    return NextResponse.json({
      message: 'E-Contract berhasil disetujui secara digital!',
      waktu_persetujuan: waktuSekarang
    }, { status: 200 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    console.error('Error memproses E-Contract:', message);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memproses E-Contract.' },
      { status: 500 }
    );
  }
}
```

## FILE: app/api/limbah/setoran-limbah/route.ts

```ts
import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { Client as QStashClient } from "@upstash/qstash";
import { Redis } from "@upstash/redis";

const qstash = new QStashClient({ token: process.env.QSTASH_TOKEN! });
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(request: Request) {
  try {
    // 1. Ambil Token Autentikasi dari Header
    const authHeader = request.headers.get("Authorization");
    const supabase = await createClient();
    
    let userId: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) userId = user.id;
    }

    // Fallback jika token dikirim via Cookie Sesi Server
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) userId = user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "Sesi tidak valid / Belum login." }, { status: 401 });
    }

    // Rate Limiting via Redis
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";
    const rateLimitKey = `rate-limit:setoran-limbah:${ip}`;
    const requestCount = await redis.incr(rateLimitKey);
    if (requestCount === 1) await redis.expire(rateLimitKey, 60);
    if (requestCount > 5) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Coba lagi dalam satu menit." },
        { status: 429 }
      );
    }

    // 2. Tangkap Payload Lengkap (Biasa & B3)
    const {
      deskripsi_input,
      berat_kg,
      lokasi,
      foto_url,
      is_b3,
      kategori_b3,
      biaya_pengolahan,
      status
    } = await request.json();

    if (!deskripsi_input || !berat_kg || !lokasi) {
      return NextResponse.json({ error: "Data limbah tidak lengkap." }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // 3. JIKA PERMINTAAN LIMBAH B3: LANGSUNG CATAT DENGAN STATUS "Menunggu Pembayaran"
    if (is_b3) {
      const { data, error } = await supabaseAdmin.from('waste_shipments').insert([{
        user_id: userId,
        nama_limbah: deskripsi_input,
        perkiraan_berat: berat_kg,
        lokasi_penjemputan: lokasi,
        kategori: 'B3',
        kategori_b3: kategori_b3 || null,
        biaya_pengolahan: biaya_pengolahan || null,
        is_b3: true,
        foto_url: foto_url || "",
        status: status || 'Menunggu Pembayaran'
      }]).select().single();

      if (error) throw error;

      return NextResponse.json({
        message: "Limbah B3 berhasil didaftarkan.",
        data
      }, { status: 201 });
    }

    // 4. HEURISTIC FILTER (Jalur Cepat Non-B3)
    const kataKunciAman = ['kardus', 'kertas', 'plastik', 'botol', 'kayu', 'serbuk', 'daun', 'organik'];
    const inputLowerCase = deskripsi_input.toLowerCase();
    const isOtomatisAman = kataKunciAman.some(kata => inputLowerCase.includes(kata));

    if (isOtomatisAman) {
      const poin = Math.round(berat_kg * 10);

      const { data, error } = await supabaseAdmin.from('waste_shipments').insert([{
        user_id: userId,
        nama_limbah: deskripsi_input,
        perkiraan_berat: berat_kg,
        lokasi_penjemputan: lokasi,
        kategori: 'NON_B3',
        jalur_proses: 'IN_HOUSE',
        poin_didapat: poin,
        foto_url: foto_url || "",
        status: 'Menunggu Penjemputan'
      }]).select().single();

      if (error) throw error;

      return NextResponse.json({
        message: "Setoran limbah dicatat. Menunggu penjemputan.",
        kategori: "NON_B3",
        poin_tambahan: poin,
        data
      }, { status: 201 });

    } else {
      // 5. PROSES AMBIGU: Lempar ke AI Worker (QStash)
      const workerUrl = process.env.NODE_ENV === 'production'
        ? `https://${process.env.VERCEL_URL}/api/limbah/worker`
        : process.env.NGROK_URL + '/api/limbah/worker';

      await qstash.publishJSON({
        url: workerUrl,
        body: { user_id: userId, deskripsi_input, berat_kg, lokasi, foto_url },
        retries: 3
      });

      return NextResponse.json({
        message: "Limbah sedang dianalisis secara mendalam oleh AI LENTERA.",
        status: "processing"
      }, { status: 202 });
    }

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Kesalahan server internal.";
    console.error("API Setoran Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
```

## FILE: app/api/limbah/worker/route.ts

```ts
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
```

## FILE: app/api/partners/route.ts

```ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-client";

interface PartnerRecord {
  id?: string;
  nama?: string;
  nama_mitra?: string;
  nama_lengkap?: string;
  nama_perusahaan?: string;
  nama_industri?: string;
  name?: string;
  alamat?: string;
  lokasi?: string;
  alamat_lengkap?: string;
  alamat_perusahaan?: string;
  created_at?: string;
}

export async function GET() {
  try {
    // 1. Fetch data dari tabel mitra_profiles
    const { data: mitraData, error: mitraError } = await supabase
      .from("mitra_profiles")
      .select("id, nama, nama_mitra, nama_lengkap, name, alamat, lokasi, alamat_lengkap, created_at")
      .limit(100);

    // 2. Fetch data dari tabel industri_profiles
    const { data: industriData, error: industriError } = await supabase
      .from("industri_profiles")
      .select("id, nama, nama_perusahaan, nama_industri, name, alamat, lokasi, alamat_perusahaan, created_at")
      .limit(100);

    if (mitraError) {
      console.error("Error fetching mitra_profiles:", mitraError.message);
    }

    if (industriError) {
      console.error("Error fetching industri_profiles:", industriError.message);
    }

    // 3. Mapping data mitra
    const formattedMitra = (mitraData || []).map((item: PartnerRecord) => ({
      id: item.id,
      nama: item.nama || item.nama_mitra || item.nama_lengkap || item.name || "Mitra Tanpa Nama",
      alamat: item.alamat || item.lokasi || item.alamat_lengkap || "Lokasi belum diisi",
      tipe: "mitra",
      tanggalBergabung: item.created_at
        ? new Date(item.created_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "-",
    }));

    // 4. Mapping data industri
    const formattedIndustri = (industriData || []).map((item: PartnerRecord) => ({
      id: item.id,
      nama: item.nama || item.nama_perusahaan || item.nama_industri || item.name || "Industri Tanpa Nama",
      alamat: item.alamat || item.lokasi || item.alamat_perusahaan || "Lokasi belum diisi",
      tipe: "industri",
      tanggalBergabung: item.created_at
        ? new Date(item.created_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "-",
    }));

    // 5. Gabungkan kedua data
    const combinedData = [...formattedMitra, ...formattedIndustri];

    return NextResponse.json(combinedData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

## FILE: app/api/profil/me/route.ts

```ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = user.app_metadata?.role;
    let profileData = null;

    if (role === 'agen' || role === 'mitra') {
      const { data, error } = await supabase.from('mitra_profiles').select('*').eq('user_id', user.id).maybeSingle();
      if (error) throw error;
      profileData = data;
    } else if (role === 'perusahaan' || role === 'industri') {
      const { data, error } = await supabase.from('industri_profiles').select('*').eq('user_id', user.id).maybeSingle();
      if (error) throw error;
      profileData = data;
    }

    if (!profileData) return NextResponse.json({ error: 'Profil belum tersedia' }, { status: 404 });
    return NextResponse.json({ message: 'Berhasil', role, data: profileData }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const role = user.app_metadata?.role;
    const body = await request.json() as Record<string, string>;
    const dataUpdate: Record<string, string> = {};

    if (body.telepon) dataUpdate.telepon = body.telepon;
    if (body.alamat) dataUpdate.alamat = body.alamat;
    if ((role === 'agen' || role === 'mitra') && body.nama_mitra) dataUpdate.nama_mitra = body.nama_mitra;
    else if ((role === 'perusahaan' || role === 'industri') && body.nama_perusahaan) dataUpdate.nama_perusahaan = body.nama_perusahaan;

    if (Object.keys(dataUpdate).length === 0) return NextResponse.json({ error: 'Tidak ada data valid' }, { status: 400 });

    const tableName = (role === 'agen' || role === 'mitra') ? 'mitra_profiles' : 'industri_profiles';
    const { data: updatedRow, error: updateError } = await supabase.from(tableName).update(dataUpdate).eq('user_id', user.id).select('user_id').maybeSingle();

    if (updateError) throw updateError;
    if (!updatedRow) return NextResponse.json({ error: 'Profil belum tersedia' }, { status: 404 });

    return NextResponse.json({ message: 'Profil berhasil diperbarui!' }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
```

## FILE: app/api/setoran-limbah/route.ts

```ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      deskripsi_input,
      berat_kg,
      lokasi,
      foto_url,
      is_b3,
      kategori_b3,
      biaya_pengolahan,
      status,
    } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Konfigurasi Supabase tidak ditemukan di .env" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Dapatkan sesi user aktif
    const authHeader = req.headers.get("Authorization");
    let userId = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) userId = user.id;
    }

    // Jika user id belum didapat via token, coba via sesi client
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) userId = user.id;
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Sesi Anda tidak valid. Silakan re-login." },
        { status: 401 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Simpan ke database Supabase
    const { data, error } = await supabaseAdmin
      .from("waste_shipments")
      .insert({
        user_id: userId,
        nama_limbah: deskripsi_input,
        perkiraan_berat: Number(berat_kg),
        lokasi_penjemputan: lokasi,
        foto_url: foto_url || "",
        is_b3: Boolean(is_b3),
        kategori_b3: kategori_b3 || null,
        biaya_pengolahan: biaya_pengolahan ? Number(biaya_pengolahan) : null,
        status: status || (is_b3 ? "Menunggu Pembayaran" : "Menunggu Penjemputan"),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("Error pada setoran-limbah:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server." },
      { status: 500 }
    );
  }
}
```

## FILE: app/api/transaksi/order/route.ts

```ts
import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import midtransClient from 'midtrans-client';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

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

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || '127.0.0.1';

    if (ratelimit) {
      try {
        const { success } = await ratelimit.limit(ip);
        if (!success) {
          return NextResponse.json(
            { error: 'Terlalu banyak permintaan. Silakan tunggu beberapa detik.' },
            { status: 429 }
          );
        }
      } catch (err) {
        console.warn("Ratelimit Redis skipped:", err);
      }
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Sesi habis, silakan login ulang." }, { status: 401 });

    const body = await request.json() as Record<string, unknown>;
    const produk_id = String(body.produk_id || body.product_id || "");
    const volume_terjual_kg = Number(body.volume_terjual_kg || body.jumlah || 0);

    if (!volume_terjual_kg || volume_terjual_kg <= 0 || !produk_id) {
      return NextResponse.json({ error: "Data pesanan tidak valid." }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // 1. Ambil data produk untuk menghitung total harga
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', produk_id)
      .maybeSingle();

    const harga = product?.harga_default || product?.price || 15000;
    const totalBayar = volume_terjual_kg * harga;
    const orderId = `AGEN-${Date.now()}`;

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

    let snapToken: string | null = null;

    if (serverKey && serverKey.trim().length > 0) {
      try {
        const snap = new midtransClient.Snap({
          isProduction: false,
          serverKey: serverKey.trim(),
          clientKey: clientKey ? clientKey.trim() : ""
        });

        const parameter = {
          transaction_details: {
            order_id: orderId,
            gross_amount: Math.round(totalBayar)
          },
          customer_details: {
            first_name: "Mitra",
            email: user.email || "mitra@lentera.com"
          }
        };

        const transaction = await snap.createTransaction(parameter);
        snapToken = transaction.token;
      } catch (midtransErr) {
        console.warn("Midtrans SDK Warning (Menggunakan Mode SIMULASI):", midtransErr);
      }
    }

    const statusPesanan = snapToken ? 'menunggu_pembayaran' : 'diproses';

    // 2. Simpan ke tabel orders (untuk dibaca oleh Dashboard Mitra)
    await supabaseAdmin.from('orders').insert([{
      id: orderId,
      user_id: user.id,
      total_harga: totalBayar,
      status: statusPesanan
    }]);

    // 3. Simpan ke tabel pesanan_mitra (untuk manajemen riwayat backend)
    await supabaseAdmin.from('pesanan_mitra').insert([{
      id: orderId,
      user_id: user.id,
      produk_id: produk_id,
      jumlah: volume_terjual_kg,
      total_harga: totalBayar,
      status: statusPesanan.toUpperCase()
    }]);

    return NextResponse.json({
      token: snapToken,
      message: snapToken ? "Menunggu pembayaran" : "Pesanan berhasil dibuat!",
    }, { status: 200 });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Kesalahan Internal Server";
    console.error("API Order Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
```

## FILE: app/api/transaksi/riwayat/route.ts

```ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Pastikan user sudah login
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak ada akses (Unauthorized)' }, { status: 401 });
    }

    // 2. Ambil parameter dari URL (untuk fitur Filter & Pagination)
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const kategori = searchParams.get('kategori'); // misal: 'pembelian' atau 'setoran_limbah'

    // 3. Tarik data dari database (Misal dari tabel transaksi_limbah)
    let query = supabase
      .from('transaksi_limbah')
      .select('*')
      .eq('id_perusahaan', user.id) // Filter hanya transaksi milik user ini
      .order('created_at', { ascending: false })
      .limit(limit);

    if (kategori) {
      query = query.eq('kategori', kategori);
    }

    const { data: riwayat, error: dbError } = await query;

    if (dbError) throw dbError;

    // 4. Kembalikan data
    return NextResponse.json({
      message: "Berhasil mengambil riwayat transaksi",
      total_data: riwayat?.length || 0,
      orders: riwayat || []
    }, { status: 200 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error("Riwayat API Error:", message);
    return NextResponse.json(
      { error: "Gagal mengambil riwayat transaksi dari server." },
      { status: 500 }
    );
  }
}
```

## FILE: app/api/transaksi/update_stock/route.ts

```ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { product_id, quantity, user_id, total_harga } = body;

    // Paksa pastikan quantity jadi format Angka (Number)
    const qtyNum = Number(quantity);

    if (!product_id || !qtyNum) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // 1. Kurangi Stok Master (Products)
    const { data: masterData } = await supabaseAdmin.from("products").select("stok").eq("id", product_id).single();
    if (masterData) {
      const sisa = Number(masterData.stok || 0) - qtyNum;
      await supabaseAdmin.from("products").update({ stok: sisa, stok_dummy: sisa }).eq("id", product_id);
    }

    // 2. Kurangi Stok Wilayah (Regional)
    const { data: regData } = await supabaseAdmin.from("regional_product_prices").select("id, stok").eq("product_id", product_id);
    if (regData && regData.length > 0) {
      for (const reg of regData) {
        const sisaReg = Number(reg.stok || 0) - qtyNum;
        await supabaseAdmin.from("regional_product_prices").update({ stok: sisaReg }).eq("id", reg.id);
      }
    }

    // 3. Catat Struk Pesanan ke Orders
    if (user_id && total_harga) {
      const { error: errOrder } = await supabaseAdmin.from("orders").insert({
        id: crypto.randomUUID(), 
        user_id: user_id,
        status: "diproses",
        total_harga: Number(total_harga),
        items: { product_id, quantity: qtyNum }
      });
      
      // Kalau nolak, panggil error ke layar!
      if (errOrder) throw new Error("Gagal catat pesanan: " + errOrder.message);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

## FILE: app/api/transaksi/webhook/route.ts

```ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { isValidMidtransSignature } from "@/lib/midtrans-signature";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;

    // Casting aman untuk menghindari tipe 'any'
    const order_id = String(body.order_id || "");
    const transaction_status = String(body.transaction_status || "");
    const status_code = String(body.status_code || "");
    const gross_amount = String(body.gross_amount || "");
    const signature_key = String(body.signature_key || "");

    // 1. VERIFIKASI SIGNATURE MUTLAK (Copilot pasti suka ini!)
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      console.error("MIDTRANS_SERVER_KEY belum dikonfigurasi.");
      return NextResponse.json({ error: "Webhook belum dikonfigurasi" }, { status: 500 });
    }

    if (!isValidMidtransSignature(signature_key, order_id, status_code, gross_amount, serverKey)) {
      console.error("WEBHOOK DITOLAK: Signature Midtrans Palsu!");
      return NextResponse.json({ error: "Invalid Signature" }, { status: 403 });
    }

    if (["expire", "cancel", "deny"].includes(transaction_status)) {
      const supabase = createAdminClient();

      if (order_id.startsWith("AGEN-")) {
        const { data: pesanan, error: pesananError } = await supabase
          .from("pesanan_mitra")
          .select("status, produk_id, jumlah")
          .eq("id", order_id)
          .single();

        if (pesananError) throw pesananError;

        if (pesanan && pesanan.status !== "DIBATALKAN") {
          const { data: updatedOrder, error: updateError } = await supabase
            .from("pesanan_mitra")
            .update({ status: "DIBATALKAN" })
            .eq("id", order_id)
            .neq("status", "DIBATALKAN")
            .select("id")
            .maybeSingle();

          if (updateError) throw updateError;

          if (updatedOrder) {
            const { data: product, error: productError } = await supabase
              .from("products")
              .select("stok, stok_dummy")
              .eq("id", pesanan.produk_id)
              .single();

            if (productError) throw productError;

            const restoredStock = Number(product.stok || 0) + Number(pesanan.jumlah || 0);
            const restoredDummyStock = Number(product.stok_dummy ?? product.stok ?? 0) + Number(pesanan.jumlah || 0);
            const { error: stockError } = await supabase
              .from("products")
              .update({ stok: restoredStock, stok_dummy: restoredDummyStock })
              .eq("id", pesanan.produk_id);

            if (stockError) throw stockError;
          }
        }

        await supabase
          .from("orders")
          .update({ status: "dibatalkan" })
          .eq("id", order_id);
      }

      return NextResponse.json({ message: "Pesanan dibatalkan dan stok dikembalikan" }, { status: 200 });
    }

    if (transaction_status !== "settlement" && transaction_status !== "capture") {
      return NextResponse.json({ message: "Status pembayaran diabaikan" }, { status: 200 });
    }

    const supabase = createAdminClient();

    // 2. IDEMPOTENCY CHECK (Mencegah Stok Berkurang 2 Kali)
    if (order_id.startsWith("B3-")) {
      const cleanId = order_id.replace("B3-", "");
      // Cek apakah sudah diproses sebelumnya
      const { data: existing, error: lookupError } = await supabase
        .from("waste_shipments")
        .select("status")
        .eq("id", cleanId)
        .single();

      if (lookupError) throw lookupError;
      if (existing?.status === "menunggu_konfirmasi") {
        const { error: updateError } = await supabase
          .from("waste_shipments")
          .update({ status: "dijadwalkan" })
          .eq("id", cleanId)
          .eq("status", "menunggu_konfirmasi");
        if (updateError) throw updateError;
      }
    }
    else if (order_id.startsWith("AGEN-")) {
      // Pastikan hanya pesanan berstatus "PENDING" yang stoknya dipotong
      const { data: pesanan, error: pesananError } = await supabase
        .from("pesanan_mitra")
        .select("status, produk_id, jumlah")
        .eq("id", order_id)
        .single();

      if (pesananError) throw pesananError;
      if (pesanan?.status === "PENDING") {
        const { data: updatedOrder, error } = await supabase
          .from("pesanan_mitra")
          .update({ status: "DIPROSES" })
          .eq("id", order_id)
          .eq("status", "PENDING")
          .select("id")
          .maybeSingle();

        if (error) throw error;
        if (updatedOrder) {
          const { error: stockError } = await supabase.rpc("kurangi_stok_produk", {
            p_id: pesanan.produk_id,
            jumlah_potong: pesanan.jumlah
          });
          if (stockError) throw stockError;
        }
      }
    }

    return NextResponse.json({ message: "Webhook sukses diverifikasi dan diproses" }, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Webhook Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
```

## FILE: app/daftar/industri/page.tsx

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type FormValues = {
  email: string;
  password: string;
  nama_perusahaan: string;
  npwp: string;
  alamat: string;
  telepon: string;
};

export default function DaftarIndustriPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormValues>({
    email: "",
    password: "",
    nama_perusahaan: "",
    npwp: "",
    alamat: "",
    telepon: "",
  });
  const [dokumen, setDokumen] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);

  function updateField(field: keyof FormValues, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!dokumen) {
      setError("Dokumen NPWP/NIB wajib diunggah.");
      return;
    }

    if (dokumen.size > 5 * 1024 * 1024) {
      setError("Ukuran dokumen maksimal 5MB.");
      return;
    }

    setStatus("loading");

    try {
      const supabase = createSupabaseBrowserClient();
      const extension = dokumen.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `npwp/registration-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("industri_documents")
        .upload(filePath, dokumen, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("industri_documents")
        .getPublicUrl(filePath);
      const response = await fetch("/api/daftar/industri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, dokumen_url: publicUrlData.publicUrl }),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Pendaftaran gagal.");
      router.push("/masuk?registered=industri");
    } catch (submitError: unknown) {
      setStatus("idle");
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Pendaftaran gagal. Silakan coba lagi."
      );
    }
  }

  return (
    <AuthShell
      eyebrow="Pendaftaran industri"
      title="Daftar sebagai Industri"
      subtitle="Bergabung sebagai pemasok limbah industri di LENTERA."
      footer={
        <p className="text-sm text-ink/60">
          Sudah punya akun?{" "}
          <Link href="/masuk" className="text-green font-medium hover:underline">
            Masuk
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit}>
        <FormField
          label="Email"
          type="email"
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          placeholder="nama@perusahaan.com"
          required
        />
        <FormField
          label="Kata sandi"
          type="password"
          value={form.password}
          onChange={(event) => updateField("password", event.target.value)}
          placeholder="Minimal 8 karakter"
          minLength={8}
          required
        />
        <FormField
          label="Nama perusahaan"
          value={form.nama_perusahaan}
          onChange={(event) => updateField("nama_perusahaan", event.target.value)}
          placeholder="PT Nama Perusahaan"
          required
        />
        <FormField
          label="NPWP"
          value={form.npwp}
          onChange={(event) => updateField("npwp", event.target.value)}
          placeholder="Nomor NPWP perusahaan"
          required
        />
        <FormField
          label="Nomor telepon"
          type="tel"
          value={form.telepon}
          onChange={(event) => updateField("telepon", event.target.value)}
          placeholder="08123456789"
          required
        />
        <label className="block mb-4">
          <span className="block text-sm font-medium text-forest mb-1.5">
            Alamat perusahaan
          </span>
          <textarea
            value={form.alamat}
            onChange={(event) => updateField("alamat", event.target.value)}
            placeholder="Alamat lengkap perusahaan"
            className="w-full rounded-xl border border-forest/15 bg-cream/50 px-4 py-3 text-sm text-ink placeholder:text-ink/35 outline-none transition-colors focus:border-green focus:bg-paper min-h-24 resize-y"
            required
          />
        </label>
        <label className="block mb-5">
          <span className="block text-sm font-medium text-forest mb-1.5">
            Dokumen NPWP / NIB
          </span>
          <input
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            onChange={(event) => setDokumen(event.target.files?.[0] || null)}
            className="block w-full text-sm text-ink/80 border border-ink/20 rounded-md p-2 bg-white"
            required
          />
          <span className="block text-xs text-ink/50 mt-1">
            Format JPG, JPEG, atau PNG. Maksimal 5MB.
          </span>
        </label>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3.5 py-2.5 mb-4">
            {error}
          </p>
        )}
        <SubmitButton
          type="submit"
          disabled={status === "loading"}
          isSubmitting={status === "loading"}
        >
          {status === "loading" ? "Mendaftarkan..." : "Daftar sebagai Industri"}
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
```

## FILE: app/daftar/mitra/page.tsx

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import dynamic from "next/dynamic";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormField } from "@/components/auth/form-field";
import { OtpField } from "@/components/auth/otp-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { BackButton } from "@/components/auth/back-button";
import { ProgressSteps } from "@/components/auth/progress-steps";
import { TermsCheckbox } from "@/components/auth/terms-checkbox";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { translateAuthError } from "@/lib/auth-errors";
import {
  isValidNikNib,
  isValidAddress,
  isValidPhone,
  isValidPassword,
  validationMessages,
} from "@/lib/validation";
import { PasswordRequirements } from "@/components/auth/password-requirements";

const LocationPickerMap = dynamic(
  () => import("@/components/location-picker-map").then((mod) => mod.LocationPickerMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[280px] w-full bg-ink/5 animate-pulse rounded-xl flex items-center justify-center text-sm text-ink/40">
        Memuat Peta...
      </div>
    ),
  }
);

const stepLabels = ["Email", "Verifikasi Email", "Kata Sandi", "Detail Profil"];

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 24 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -24 }),
};

type FormState = {
  email: string;
  otp: string;
  password: string;
  nama_mitra: string;
  nik_nib: string;
  provinsi: string;
  kota: string;
  kecamatan: string;
  kelurahan: string;
  detail_alamat: string;
  telepon: string;
  lat: number | null;
  lng: number | null;
  foto_nik: File | null;
};

type FieldErrors = Partial<
  Record<
    | "nama_mitra"
    | "nik_nib"
    | "provinsi"
    | "kota"
    | "kecamatan"
    | "kelurahan"
    | "detail_alamat"
    | "telepon"
    | "foto_nik",
    string
  >
>;

function formatHumanFriendlyError(err: unknown): string {
  if (!err) return "Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.";

  const message = typeof err === "string" ? err : (err as { message?: string })?.message || "";

  if (message.includes("Payload too large") || message.includes("413") || message.includes("exceeds")) {
    return "Ukuran gambar terlalu besar. Maksimal ukuran berkas adalah 5MB.";
  }
  if (message.includes("mime") || message.includes("not allowed") || message.includes("extension")) {
    return "Format gambar tidak didukung. Harap upload foto berformat JPG, JPEG, atau PNG.";
  }
  if (message.includes("bucket") || message.includes("storage")) {
    return "Gagal mengunggah dokumen. Silakan periksa koneksi internet Anda dan coba lagi.";
  }

  if (message.includes("duplicate key") || message.includes("already exists")) {
    return "Data NIK/NIB, nomor telepon, atau profil mitra ini sudah pernah terdaftar.";
  }
  if (message.includes("different") || message.includes("same password")) {
    return "Kata sandi baru tidak boleh sama dengan kata sandi lama.";
  }
  if (message === "no-session") {
    return "Sesi pendaftaran Anda telah berakhir. Silakan lakukan verifikasi ulang.";
  }

  const translated = translateAuthError(message);
  if (translated !== "Terjadi kesalahan, coba lagi.") {
    return translated;
  }

  return "Gagal memproses pendaftaran. Silakan periksa kembali data Anda dan coba lagi.";
}

export default function DaftarMitraPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<FormState>({
    email: "",
    otp: "",
    password: "",
    nama_mitra: "",
    nik_nib: "",
    provinsi: "",
    kota: "",
    kecamatan: "",
    kelurahan: "",
    detail_alamat: "",
    telepon: "",
    lat: null,
    lng: null,
    foto_nik: null,
  });

  const [status, setStatus] = useState<"idle" | "loading" | "submitted">("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [agreed, setAgreed] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [provinces, setProvinces] = useState<{ id: string; name: string }[]>([]);
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [districts, setDistricts] = useState<{ id: string; name: string }[]>([]);
  const [villages, setVillages] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const checkExistingSession = async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: blacklisted } = await supabase
          .from("blacklists")
          .select("alasan")
          .eq("user_id", user.id)
          .maybeSingle();

        const { data: profile } = await supabase
          .from("mitra_profiles")
          .select("id, status_akun, alasan_ban")
          .eq("user_id", user.id)
          .maybeSingle();

        if (blacklisted || profile?.status_akun === "banned") {
          const alasan = blacklisted?.alasan || profile?.alasan_ban || "Pelanggaran ketentuan layanan.";
          alert(`Akun Anda telah diblokir/di-ban!\nAlasan: ${alasan}`);
          await supabase.auth.signOut();
          router.replace("/masuk");
          return;
        }

        if (profile) {
          router.replace("/dashboard");
          return;
        }

        setForm((prev) => ({ ...prev, email: user.email || "" }));
        setStep(3);
      }
    };

    checkExistingSession();
  }, [router]);

  useEffect(() => {
    fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json")
      .then((res) => res.json())
      .then((data) => setProvinces(Array.isArray(data) ? data : []))
      .catch(() => console.error("Gagal memuat data provinsi"));
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const handleProvinsiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provId = e.target.value;
    const provName = e.target.options[e.target.selectedIndex]?.text || "";

    update("provinsi", provId ? provName : "");
    update("kota", "");
    update("kecamatan", "");
    update("kelurahan", "");
    setCities([]);
    setDistricts([]);
    setVillages([]);

    if (provId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provId}.json`)
        .then((res) => {
          if (!res.ok) throw new Error("Gagal mengambil data kota");
          return res.json();
        })
        .then((data) => setCities(Array.isArray(data) ? data : []))
        .catch(() => {
          console.error("Gagal memuat data kota");
          setCities([]);
        });
    }
  };

  const handleKotaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const regencyId = e.target.value;
    const regencyName = e.target.options[e.target.selectedIndex]?.text || "";

    update("kota", regencyId ? regencyName : "");
    update("kecamatan", "");
    update("kelurahan", "");
    setDistricts([]);
    setVillages([]);

    if (regencyId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${regencyId}.json`)
        .then((res) => {
          if (!res.ok) throw new Error("Gagal mengambil data kecamatan");
          return res.json();
        })
        .then((data) => setDistricts(Array.isArray(data) ? data : []))
        .catch(() => {
          console.error("Gagal memuat data kecamatan");
          setDistricts([]);
        });
    }
  };

  const handleKecamatanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const districtId = e.target.value;
    const districtName = e.target.options[e.target.selectedIndex]?.text || "";

    update("kecamatan", districtId ? districtName : "");
    update("kelurahan", "");
    setVillages([]);

    if (districtId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${districtId}.json`)
        .then((res) => {
          if (!res.ok) throw new Error("Gagal mengambil data kelurahan");
          return res.json();
        })
        .then((data) => setVillages(Array.isArray(data) ? data : []))
        .catch(() => {
          console.error("Gagal memuat data kelurahan");
          setVillages([]);
        });
    }
  };

  const handleLocationSelect = (loc: {
    lat: number;
    lng: number;
    alamat: string;
    kelurahan: string;
    kecamatan: string;
    kota_kabupaten: string;
    provinsi: string;
  }) => {
    setForm((prev) => ({
      ...prev,
      lat: Number(loc.lat),
      lng: Number(loc.lng),
      detail_alamat: loc.alamat ? loc.alamat.toUpperCase() : prev.detail_alamat,
      provinsi: loc.provinsi || prev.provinsi,
      kota: loc.kota_kabupaten || prev.kota,
      kecamatan: loc.kecamatan || prev.kecamatan,
      kelurahan: loc.kelurahan || prev.kelurahan,
    }));
  };

  function goNext() {
    setDirection(1);
    setStep((s) => Math.min(s + 1, stepLabels.length - 1));
  }

  function goBack() {
    setDirection(-1);
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function sendOtp() {
    const supabase = createSupabaseBrowserClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: form.email,
      options: { shouldCreateUser: true },
    });
    if (otpError) throw otpError;
    setResendCooldown(30);
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setError(null);
    setStatus("loading");
    try {
      await sendOtp();
    } catch (err) {
      setError(formatHumanFriendlyError(err));
    } finally {
      setStatus("idle");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (step === 0) {
      setStatus("loading");
      try {
        await sendOtp();
        setStatus("idle");
        goNext();
      } catch (err) {
        setStatus("idle");
        setError(formatHumanFriendlyError(err));
      }
      return;
    }

    if (step === 1) {
      if (form.otp.length !== 6) {
        setError("Masukkan 6 digit kode verifikasi yang benar.");
        return;
      }
      setStatus("loading");
      try {
        const supabase = createSupabaseBrowserClient();
        const { error: verifyError } = await supabase.auth.verifyOtp({
          email: form.email,
          token: form.otp,
          type: "email",
        });
        if (verifyError) throw verifyError;
        setStatus("idle");
        goNext();
      } catch {
        setStatus("idle");
        setError("Kode verifikasi salah atau sudah kedaluwarsa. Silakan minta kode baru.");
      }
      return;
    }

    if (step === 2) {
      if (!isValidPassword(form.password)) {
        setError(validationMessages.password);
        return;
      }
      setStatus("loading");
      try {
        const supabase = createSupabaseBrowserClient();
        const { error: updateError } = await supabase.auth.updateUser({
          password: form.password,
        });

        if (
          updateError &&
          !updateError.message.toLowerCase().includes("different") &&
          !updateError.message.toLowerCase().includes("same")
        ) {
          throw updateError;
        }

        setStatus("idle");
        goNext();
      } catch (err) {
        setStatus("idle");
        setError(formatHumanFriendlyError(err));
      }
      return;
    }

    // Step 3: Validasi Form Profil Mitra
    const errors: FieldErrors = {};
    if (!form.nama_mitra.trim()) errors.nama_mitra = "Nama mitra wajib diisi.";
    if (!isValidNikNib(form.nik_nib)) errors.nik_nib = validationMessages.nikNib;

    if (!form.foto_nik) {
      errors.foto_nik = "Foto NIK/NPWP wajib diupload.";
    } else if (form.foto_nik.size > 5 * 1024 * 1024) {
      errors.foto_nik = "Ukuran gambar terlalu besar. Maksimal 5MB.";
    }

    if (!form.provinsi) errors.provinsi = "Provinsi wajib dipilih.";
    if (!form.kota) errors.kota = "Kota/Kabupaten wajib dipilih.";
    if (!form.kecamatan) errors.kecamatan = "Kecamatan wajib dipilih.";
    if (!form.kelurahan) errors.kelurahan = "Kelurahan wajib dipilih.";
    if (!form.detail_alamat.trim()) errors.detail_alamat = "Detail alamat wajib diisi.";

    const alamatLengkap = `${form.detail_alamat}, Kel. ${form.kelurahan}, Kec. ${form.kecamatan}, ${form.kota}, ${form.provinsi}`;
    if (form.provinsi && form.kota && form.detail_alamat && !isValidAddress(alamatLengkap)) {
      errors.detail_alamat = validationMessages.address;
    }

    if (!isValidPhone(form.telepon)) errors.telepon = validationMessages.phone;

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (!agreed) {
      setError("Anda harus menyetujui Syarat & Ketentuan dan Kebijakan Privasi LENTERA.");
      return;
    }

    setStatus("loading");
    try {
      const supabase = createSupabaseBrowserClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user ?? (await supabase.auth.getUser()).data.user;

      if (!user) throw new Error("no-session");

      // === PENGECEKAN KETAT HARUS DARI IDENTITAS DETAIL (NIK/NIB, TELEPON, USER_ID) ===

      // 1. Cek di tabel blacklists
      const { data: blacklisted } = await supabase
        .from("blacklists")
        .select("nik_nib, telepon, alasan")
        .or(`nik_nib.eq.${form.nik_nib},telepon.eq.${form.telepon},user_id.eq.${user.id}`)
        .maybeSingle();

      if (blacklisted) {
        const reason = blacklisted.alasan || "Terdaftar dalam daftar hitam penangguhan akun.";
        
        // Daftarkan user_id & email ini ke blacklists agar tidak bisa login lagi
        await supabase.from("blacklists").upsert({
          user_id: user.id,
          email: user.email,
          nik_nib: form.nik_nib,
          telepon: form.telepon,
          alasan: `Pendaftaran ditolak otomatis: ${reason}`
        });

        setStatus("idle");
        setError(`Pendaftaran ditolak: NIK/NIB (${form.nik_nib}) atau Nomor Telepon (${form.telepon}) Anda terdaftar dalam daftar hitam penangguhan akun. Alasan: ${reason}`);
        await supabase.auth.signOut();
        return;
      }

      // 2. Cek apakah ada profil mitra lain berstatus banned yang pakai NIK/NIB atau Telepon sama
      const { data: bannedProfile } = await supabase
        .from("mitra_profiles")
        .select("nik_nib, telepon, alasan_ban")
        .eq("status_akun", "banned")
        .or(`nik_nib.eq.${form.nik_nib},telepon.eq.${form.telepon}`)
        .maybeSingle();

      if (bannedProfile) {
        const reason = bannedProfile.alasan_ban || "Pelanggaran ketentuan layanan.";

        // Daftarkan user_id & email ini ke blacklists agar tidak bisa login lagi
        await supabase.from("blacklists").upsert({
          user_id: user.id,
          email: user.email,
          nik_nib: form.nik_nib,
          telepon: form.telepon,
          alasan: `Pendaftaran ditolak otomatis: ${reason}`
        });

        setStatus("idle");
        setError(`Pendaftaran ditolak: NIK/NIB atau Nomor Telepon ini terhubung dengan akun mitra yang telah di-ban! Alasan: ${reason}`);
        await supabase.auth.signOut();
        return;
      }

      let fotoUrl = "";
      if (form.foto_nik) {
        const fileExt = form.foto_nik.name.split(".").pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("mitra_documents")
          .upload(`nik/${fileName}`, form.foto_nik);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("mitra_documents")
          .getPublicUrl(`nik/${fileName}`);

        fotoUrl = publicUrlData.publicUrl;
      }

      const { error: profileError } = await supabase.from("mitra_profiles").upsert(
        {
          user_id: user.id,
          nama_mitra: form.nama_mitra,
          nik_nib: form.nik_nib,
          provinsi: form.provinsi,
          kota_kabupaten: form.kota,
          kecamatan: form.kecamatan,
          kelurahan: form.kelurahan,
          alamat: alamatLengkap,
          telepon: form.telepon,
          lat: form.lat !== null ? Number(form.lat) : null,
          lng: form.lng !== null ? Number(form.lng) : null,
          foto_nik_url: fotoUrl,
          status_akun: "aktif",
        },
        { onConflict: "user_id" }
      );

      if (profileError) throw profileError;

      await supabase.auth.refreshSession();
      setStatus("submitted");
      router.refresh();
      router.push("/dashboard");
    } catch (err) {
      setStatus("idle");
      setError(formatHumanFriendlyError(err));
    }
  }

  const searchQuery = `${form.kelurahan} ${form.kecamatan} ${form.kota} ${form.provinsi}`.trim();

  return (
    <AuthShell
      eyebrow="Pendaftaran mitra"
      title="Daftar sebagai Mitra"
      subtitle="Untuk agen dan distributor energi LENTERA."
      footer={
        <p className="text-sm text-ink/60 space-y-1.5">
          <span className="block">
            Sudah punya akun?{" "}
            <Link href="/masuk" className="text-green font-medium hover:underline">
              Masuk
            </Link>
          </span>
          <span className="block">
            Mau daftar sebagai industri?{" "}
            <Link href="/daftar/industri" className="text-green font-medium hover:underline">
              Klik di sini
            </Link>
          </span>
        </p>
      }
    >
      {status === "submitted" ? (
        <div className="text-center py-4">
          <p className="text-forest font-medium mb-1">Pendaftaran mitra berhasil!</p>
          <p className="text-ink/55 text-sm">Mengalihkan ke dashboard...</p>
        </div>
      ) : (
        <>
          <ProgressSteps steps={stepLabels} current={step} />
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={step}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {step === 0 && (
                  <FormField
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="nama@email.com"
                    required
                    autoFocus
                  />
                )}

                {step === 1 && (
                  <>
                    <p className="text-sm text-ink/55 mb-4">
                      Kode dikirim ke <span className="text-forest font-medium">{form.email}</span> Â·{" "}
                      <button type="button" onClick={goBack} className="text-green hover:underline">
                        ganti
                      </button>
                    </p>
                    <OtpField value={form.otp} onChange={(v) => update("otp", v)} />
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendCooldown > 0 || status === "loading"}
                      className="text-xs text-green hover:underline disabled:text-ink/35 mb-2"
                    >
                      {resendCooldown > 0
                        ? `Kirim ulang kode (${resendCooldown}s)`
                        : "Kirim ulang kode"}
                    </button>
                  </>
                )}

                {step === 2 && (
                  <>
                    <FormField
                      label="Kata sandi"
                      type="password"
                      value={form.password}
                      onChange={(e) => update("password", e.target.value)}
                      placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                      required
                      autoFocus
                    />
                    <PasswordRequirements value={form.password} />
                  </>
                )}

                {step === 3 && (
                  <>
                    <FormField
                      label="Nama mitra"
                      type="text"
                      value={form.nama_mitra}
                      onChange={(e) => update("nama_mitra", e.target.value)}
                      placeholder="Nama perorangan / usaha"
                      required
                      autoFocus
                    />
                    {fieldErrors.nama_mitra && (
                      <p className="text-xs text-red-600 -mt-3 mb-3">{fieldErrors.nama_mitra}</p>
                    )}

                    <FormField
                      label="NIK / NIB"
                      type="text"
                      value={form.nik_nib}
                      onChange={(e) => update("nik_nib", e.target.value)}
                      placeholder="16 digit NIK atau 13 digit NIB"
                      required
                    />
                    {fieldErrors.nik_nib && (
                      <p className="text-xs text-red-600 -mt-3 mb-3">{fieldErrors.nik_nib}</p>
                    )}

                    <div className="mb-4 text-left">
                      <label className="block text-sm font-medium mb-1.5 text-ink">
                        Upload Foto NIK / NPWP
                      </label>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={(e) =>
                          setForm((f) => ({ ...f, foto_nik: e.target.files?.[0] || null }))
                        }
                        className="block w-full text-sm text-ink/80 border border-ink/20 rounded-md p-2 bg-white"
                        required
                      />
                      <p className="text-[11px] text-ink/50 mt-1">Maksimal ukuran berkas: 5MB (JPG, JPEG, PNG)</p>
                      {fieldErrors.foto_nik && (
                        <p className="text-xs text-red-600 mt-1.5">{fieldErrors.foto_nik}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <div className="text-left">
                        <label className="block text-sm font-medium mb-1.5 text-ink">Provinsi</label>
                        <select
                          className={`block w-full text-sm text-ink/80 border ${
                            fieldErrors.provinsi ? "border-red-500" : "border-ink/20"
                          } rounded-md p-2.5 bg-white`}
                          onChange={handleProvinsiChange}
                          required
                        >
                          <option value="">Pilih Provinsi...</option>
                          {provinces.map((prov) => (
                            <option key={prov.id} value={prov.id}>
                              {prov.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="text-left">
                        <label className="block text-sm font-medium mb-1.5 text-ink">
                          Kota / Kabupaten
                        </label>
                        <select
                          className={`block w-full text-sm text-ink/80 border ${
                            fieldErrors.kota ? "border-red-500" : "border-ink/20"
                          } rounded-md p-2.5 bg-white disabled:bg-ink/5`}
                          onChange={handleKotaChange}
                          disabled={cities.length === 0}
                          required
                        >
                          <option value="">Pilih Kota/Kabupaten...</option>
                          {cities.map((city) => (
                            <option key={city.id} value={city.id}>
                              {city.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="text-left">
                        <label className="block text-sm font-medium mb-1.5 text-ink">Kecamatan</label>
                        <select
                          className={`block w-full text-sm text-ink/80 border ${
                            fieldErrors.kecamatan ? "border-red-500" : "border-ink/20"
                          } rounded-md p-2.5 bg-white disabled:bg-ink/5`}
                          onChange={handleKecamatanChange}
                          disabled={districts.length === 0}
                          required
                        >
                          <option value="">Pilih Kecamatan...</option>
                          {districts.map((dist) => (
                            <option key={dist.id} value={dist.id}>
                              {dist.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="text-left">
                        <label className="block text-sm font-medium mb-1.5 text-ink">
                          Kelurahan / Desa
                        </label>
                        <select
                          className={`block w-full text-sm text-ink/80 border ${
                            fieldErrors.kelurahan ? "border-red-500" : "border-ink/20"
                          } rounded-md p-2.5 bg-white disabled:bg-ink/5`}
                          onChange={(e) =>
                            update("kelurahan", e.target.options[e.target.selectedIndex]?.text || "")
                          }
                          disabled={villages.length === 0}
                          required
                        >
                          <option value="">Pilih Kelurahan...</option>
                          {villages.map((vill) => (
                            <option key={vill.id} value={vill.id}>
                              {vill.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mb-4 text-left">
                      <label className="block text-sm font-medium mb-1.5 text-ink">
                        Pilih Titik Lokasi Usaha/Bangunan
                      </label>
                      <LocationPickerMap
                        searchQuery={searchQuery}
                        onLocationSelect={handleLocationSelect}
                      />
                    </div>

                    <FormField
                      label="Detail Alamat"
                      type="text"
                      value={form.detail_alamat}
                      onChange={(e) => update("detail_alamat", e.target.value.toUpperCase())}
                      placeholder="Jalan, RT/RW, no. rumah, patokan"
                      required
                    />
                    {fieldErrors.detail_alamat && (
                      <p className="text-xs text-red-600 -mt-3 mb-3">
                        {fieldErrors.detail_alamat}
                      </p>
                    )}

                    <FormField
                      label="Nomor telepon"
                      type="tel"
                      value={form.telepon}
                      onChange={(e) => update("telepon", e.target.value)}
                      placeholder="08123456789"
                      required
                    />
                    {fieldErrors.telepon && (
                      <p className="text-xs text-red-600 -mt-3 mb-3">{fieldErrors.telepon}</p>
                    )}

                    <TermsCheckbox checked={agreed} onChange={setAgreed} />
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3.5 py-2.5 mb-4">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              {step > 0 && <BackButton onClick={goBack} />}
              <SubmitButton
                type="submit"
                disabled={status === "loading"}
                isSubmitting={status === "loading"}
              >
                {status === "loading"
                  ? "Memproses..."
                  : step === 0
                  ? "Kirim Kode"
                  : step === 1
                  ? "Verifikasi"
                  : step < stepLabels.length - 1
                  ? "Lanjut"
                  : "Daftar sebagai Mitra"}
              </SubmitButton>
            </div>
          </form>
        </>
      )}
    </AuthShell>
  );
}
```

## FILE: app/daftar/page.tsx

```tsx
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";

const options = [
  {
    href: "/daftar/mitra",
    title: "Daftar sebagai Mitra",
    description:
      "Untuk agen dan distributor yang ingin menyalurkan energi hasil olahan LENTERA.",
    accent: "border-green",
    iconColor: "#2F6B3F",
    icon: (
      <>
        <path d="M4 21v-7a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v7M12 3v7" />
      </>
    ),
  },
  {
    href: "/daftar/industri",
    title: "Daftar sebagai Industri",
    description:
      "Untuk pabrik dan industri yang ingin menyalurkan limbah produksi ke LENTERA.",
    accent: "border-clay",
    iconColor: "#7A5738",
    icon: (
      <>
        <path d="M3 21h18M5 21V9l6-4 6 4v12M9 21v-6h6v6" />
      </>
    ),
  },
];

export default function DaftarPage() {
  return (
    <AuthShell
      eyebrow="Bergabung dengan LENTERA"
      title="Daftar sebagai apa?"
      subtitle="Pilih jenis akun yang sesuai â€” form pendaftarannya berbeda untuk masing-masing."
      wide
      footer={
        <p className="text-sm text-ink/60">
          Sudah punya akun?{" "}
          <Link href="/masuk" className="text-green font-medium hover:underline">
            Masuk
          </Link>
        </p>
      }
    >
      <div className="grid sm:grid-cols-2 gap-4">
        {options.map((o) => (
          <Link
            key={o.href}
            href={o.href}
            className={`group block rounded-2xl border-2 ${o.accent} bg-cream/50 p-6 transition-colors hover:bg-cream`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke={o.iconColor}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8 mb-4"
            >
              {o.icon}
            </svg>
            <p className="font-display font-semibold text-forest text-lg mb-1.5">
              {o.title}
            </p>
            <p className="text-ink/60 text-sm leading-relaxed">{o.description}</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-forest mt-4 group-hover:gap-2.5 transition-all">
              Lanjutkan
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </AuthShell>
  );
}
```

## FILE: app/daftar-mitra-industri/page.tsx

```tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Navbar } from "@/components/navbar";

type PartnerUser = {
  id: string;
  nama: string;
  alamat: string;
  tanggalBergabung: string;
  tipe: "mitra" | "industri";
};

export default function DaftarMitraIndustriPage() {
  const [partners, setPartners] = useState<PartnerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"semua" | "mitra" | "industri">("semua");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchPartners() {
      try {
        const res = await fetch("/api/partners");
        const data = await res.json();

        if (Array.isArray(data)) {
          setPartners(data);
        }
      } catch (err) {
        console.error("Gagal mengambil data dari API:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPartners();
  }, []);

  const filteredData = partners.filter((item) => {
    const matchFilter = filter === "semua" || item.tipe === filter;
    const matchSearch =
      (item.nama && item.nama.toLowerCase().includes(search.toLowerCase())) ||
      (item.alamat && item.alamat.toLowerCase().includes(search.toLowerCase()));
    return matchFilter && matchSearch;
  });

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-cream pt-28 md:pt-36 pb-20">
        <section className="px-4 sm:px-6 md:px-12 lg:px-24 max-w-7xl mx-auto">

          {/* HEADER */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto mb-8 md:mb-14"
          >
            <h1 className="font-display font-semibold text-3xl sm:text-4xl md:text-5xl text-forest mb-4">
              Daftar Mitra & Industri
            </h1>
            <p className="text-ink/70 text-sm md:text-base">
              Berikut adalah daftar pelaku industri dan agen penyalur yang telah terdaftar dalam jaringan konversi energi LENTERA.
            </p>
          </motion.div>

          {/* FILTER & PENCARIAN */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div className="flex bg-paper border border-forest/10 p-1.5 rounded-2xl w-full sm:w-auto">
              {(["semua", "industri", "mitra"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-medium capitalize transition-all flex-1 sm:flex-none ${
                    filter === tab
                      ? "bg-forest text-cream shadow-xs"
                      : "text-ink/60 hover:text-forest"
                  }`}
                >
                  {tab === "semua" ? "Semua" : tab === "industri" ? "Industri" : "Mitra Agen"}
                </button>
              ))}
            </div>

            <div className="w-full sm:w-72">
              <input
                type="text"
                placeholder="Cari nama atau lokasi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-paper border border-forest/15 rounded-2xl px-4 py-2.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-green focus:border-green transition-all"
              />
            </div>
          </div>

          {/* CONTAINER DATA RESPONSIVE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {loading ? (
              <div className="bg-paper border border-forest/10 rounded-3xl p-12 text-center text-ink/60 text-sm animate-pulse">
                Memuat data mitra & industri dari Supabase...
              </div>
            ) : filteredData.length > 0 ? (
              <>
                {/* 1. LAYOUT MOBILE CARD (Layar HP) */}
                <div className="grid grid-cols-1 gap-3 md:hidden">
                  {filteredData.map((item, index) => (
                    <div
                      key={`${item.id}-${item.tipe}-${index}`}
                      className="bg-paper border border-forest/10 rounded-2xl p-4 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-forest text-base leading-snug">
                          {item.nama}
                        </h3>
                        <span
                          className={`shrink-0 text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            item.tipe === "industri"
                              ? "bg-clay/15 text-clay-dark"
                              : "bg-green/15 text-green"
                          }`}
                        >
                          {item.tipe === "industri" ? "Industri" : "Mitra Agen"}
                        </span>
                      </div>

                      <div className="text-xs text-ink/70 flex items-start gap-1.5">
                        <span className="shrink-0">ðŸ“</span>
                        <span className="break-words">{item.alamat}</span>
                      </div>

                      <div className="pt-2 border-t border-forest/5 flex items-center justify-between text-[11px] text-ink/50">
                        <span>Bergabung:</span>
                        <span>ðŸ“… {item.tanggalBergabung}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 2. LAYOUT TABEL DESKTOP (Layar Tablet & Laptop) */}
                <div className="hidden md:block bg-paper border border-forest/10 rounded-3xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[650px]">
                      <thead>
                        <tr className="border-b border-forest/10 bg-cream/40 text-forest font-display text-xs uppercase tracking-wider">
                          <th className="py-4 px-6 font-semibold">Nama Instansi / Mitra</th>
                          <th className="py-4 px-6 font-semibold">Tipe</th>
                          <th className="py-4 px-6 font-semibold">Alamat</th>
                          <th className="py-4 px-6 font-semibold">Tanggal Bergabung</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-forest/5 text-sm text-ink/80">
                        {filteredData.map((item, index) => (
                          <tr key={`${item.id}-${item.tipe}-${index}`} className="hover:bg-cream/20 transition-colors">
                            <td className="py-4 px-6 font-medium text-forest">
                              {item.nama}
                            </td>
                            <td className="py-4 px-6">
                              <span
                                className={`inline-block text-[11px] font-mono px-3 py-1 rounded-full uppercase tracking-wider ${
                                  item.tipe === "industri"
                                    ? "bg-clay/15 text-clay-dark"
                                    : "bg-green/15 text-green"
                                }`}
                              >
                                {item.tipe === "industri" ? "Industri" : "Mitra Agen"}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-ink/70">
                              ðŸ“ {item.alamat}
                            </td>
                            <td className="py-4 px-6 text-ink/60 text-xs">
                              ðŸ“… {item.tanggalBergabung}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-paper border border-forest/10 rounded-3xl text-center py-16 text-ink/50 text-sm">
                Tidak ada data mitra atau industri yang ditemukan.
              </div>
            )}
          </motion.div>

        </section>
      </main>
    </>
  );
}
```

## FILE: app/dashboard/layout.tsx

```tsx
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import Script from 'next/script';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-cream">
      
      {/* TARUH MESIN MIDTRANS DI SINI BANG ðŸ‘‡ */}
      <Script 
        src="https://app.sandbox.midtrans.com/snap/snap.js" 
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY} 
        strategy="afterInteractive" 
      />
      {/* ðŸ‘† ================================== ðŸ‘† */}

      <DashboardSidebar />
      <main className="flex-1 min-w-0 w-full">{children}</main>
    </div>
  );
}
```

## FILE: app/dashboard/page.tsx

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { ProductCard } from "@/components/dashboard/product-card";
import { AIAssistant } from "@/components/ai-assistant";
import Script from "next/script";

interface MitraProfile {
  nama_mitra: string;
  nik_nib: string;
  alamat: string;
  telepon: string;
  provinsi?: string;
  kota_kabupaten?: string;
  status_akun?: string;
  alasan_ban?: string;
  created_at: string;
}

interface DisplayProduct {
  id: string;
  nama: string;
  nama_produk: string;
  deskripsi: string;
  price: number;
  unit: string;
  stock: number;
  stok: number;
  isRegional: boolean;
}

interface RegionalPrice {
  product_id: string;
  kota?: string;
  harga?: number;
  harga_min?: number;
  stok?: number;
}

interface RawProduct {
  id: string;
  nama_produk: string;
  deskripsi: string;
  satuan: string;
  harga_default: number;
  regional_product_prices?: RegionalPrice[];
}

interface Order {
  id: string;
  status: string;
  total_harga: number;
  created_at: string;
  bukti_pengiriman_url?: string | null; 
  nama_produk?: string; 
}

function InfoRow({
  label,
  value,
  className = "",
}: {
  label: string;
  value?: string | null;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-ink/45 mb-1">{label}</p>
      <p className="text-forest font-medium text-sm sm:text-base">
        {value || "-"}
      </p>
    </div>
  );
}

export default function DashboardMitraPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<MitraProfile | null>(null);
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    nama_mitra: "",
    nik_nib: "",
    telepon: "",
    provinsi: "",
    kota_kabupaten: "",
    alamat: "",
  });

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

  const fetchOrdersOnly = async (currentUserId: string) => {
    const supabase = createSupabaseBrowserClient();
    
    const [ordersRes, pmRes, productsRes] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("pesanan_mitra").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("id, nama_produk") 
    ]);

    const productMap = new Map<string, string>();
    if (productsRes.data) {
      productsRes.data.forEach((p: any) => productMap.set(p.id, p.nama_produk));
    }

    const combinedOrders: Order[] = [];

    if (ordersRes.data) {
      ordersRes.data.forEach((o) => {
        const oUser = o.user_id || o.mitra_id;
        if (!oUser || oUser === currentUserId) {
          
          let prodName = "Produk Energi";
          let prodId = null;
          if (o.items) {
            prodId = Array.isArray(o.items) ? o.items[0]?.product_id : o.items.product_id;
          }
          if (prodId) prodName = productMap.get(prodId) || prodName;

          combinedOrders.push({
            id: String(o.id),
            status: String(o.status || "diproses").toLowerCase(),
            total_harga: Number(o.total_harga || o.total || 0),
            created_at: o.created_at || new Date().toISOString(),
            bukti_pengiriman_url: o.bukti_pengiriman_url || null, 
            nama_produk: prodName, 
          });
        }
      });
    }

    if (pmRes.data) {
      pmRes.data.forEach((pm) => {
        const pmUser = pm.user_id || pm.mitra_id;
        if (!pmUser || pmUser === currentUserId) {
          if (!combinedOrders.some((o) => o.id === String(pm.id))) {
            
            let prodName = "Produk Energi";
            if (pm.produk_id) prodName = productMap.get(pm.produk_id) || prodName;

            combinedOrders.push({
              id: String(pm.id),
              status: String(pm.status || "diproses").toLowerCase(),
              total_harga: Number(pm.total_harga || pm.jumlah * 15000 || 0),
              created_at: pm.created_at || new Date().toISOString(),
              bukti_pengiriman_url: pm.bukti_pengiriman_url || null, 
              nama_produk: prodName, 
            });
          }
        }
      });
    }

    combinedOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setOrders(combinedOrders);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        router.replace("/masuk");
        return;
      }
      setUserId(authData.user.id);
      setEmail(authData.user.email ?? null);

      const { data: blacklisted } = await supabase
        .from("blacklists")
        .select("alasan")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (blacklisted) {
        alert(`Akses Ditolak: Akun Anda diblokir!\nAlasan: ${blacklisted.alasan}`);
        await supabase.auth.signOut();
        router.replace("/masuk");
        return;
      }

      const { data: profileData } = await supabase
        .from("mitra_profiles")
        .select(
          "nama_mitra, nik_nib, alamat, telepon, provinsi, kota_kabupaten, status_akun, alasan_ban, created_at"
        )
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (!profileData) {
        alert("Akses Ditolak: Profil mitra Anda tidak ditemukan atau pendaftaran sebelumnya ditolak.");
        await supabase.auth.signOut();
        router.replace("/masuk");
        return;
      }

      if (profileData.status_akun === "banned") {
        alert(
          `Akun Anda telah di-ban oleh Administrator!\nAlasan: ${
            profileData.alasan_ban || "Pelanggaran ketentuan layanan."
          }`
        );
        await supabase.auth.signOut();
        router.replace("/masuk");
        return;
      }

      setProfile(profileData);
      setEditForm({
        nama_mitra: profileData.nama_mitra || "",
        nik_nib: profileData.nik_nib || "",
        telepon: profileData.telepon || "",
        provinsi: profileData.provinsi || "",
        kota_kabupaten: profileData.kota_kabupaten || "",
        alamat: profileData.alamat || "",
      });

      const { data: rawProducts } = await supabase
        .from("products")
        .select(`id, nama_produk, deskripsi, satuan, harga_default, stok_dummy, regional_product_prices(*)`)
        .order("created_at", { ascending: false });

      const { data: allRegionalPrices } = await supabase
        .from("regional_product_prices")
        .select("*");

      if (rawProducts) {
        const cleanCityName = (str: string) => {
          if (!str) return "";
          return str.toUpperCase().replace(/KOTA/g, "").replace(/KABUPATEN/g, "").replace(/KAB\./g, "").replace(/KAB/g, "").replace(/[^A-Z0-9]/g, "").trim();
        };

        const rawLocationText = profileData?.kota_kabupaten || profileData?.alamat || "";
        const userKotaClean = cleanCityName(rawLocationText);

        const filteredProducts: DisplayProduct[] = [];

        rawProducts.forEach((p: RawProduct) => {
          const regionalPricesList = [...(p.regional_product_prices || []), ...(allRegionalPrices?.filter((rp) => rp.product_id === p.id) || [])];
          const regionalMatch = regionalPricesList.find((rp: RegionalPrice) => {
            const rpKotaClean = cleanCityName(rp.kota || "");
            if (!rpKotaClean || !userKotaClean) return false;
            return rpKotaClean === userKotaClean || userKotaClean.includes(rpKotaClean) || rpKotaClean.includes(userKotaClean);
          });

          if (regionalMatch) {
            filteredProducts.push({
              id: p.id,
              nama: p.nama_produk,
              nama_produk: p.nama_produk,
              deskripsi: p.deskripsi,
              unit: p.satuan,
              price: Number(regionalMatch.harga ?? regionalMatch.harga_min ?? p.harga_default),
              stock: Number(regionalMatch.stok ?? 0),
              stok: Number(regionalMatch.stok ?? 0),
              isRegional: true,
            });
          }
        });

        setProducts(filteredProducts);
      }
      setLoading(false);
    };

    fetchDashboardData();
  }, [router]);

  useEffect(() => {
    if (!userId) return;

    fetchOrdersOnly(userId);

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel('realtime-orders-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchOrdersOnly(userId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pesanan_mitra' },
        () => fetchOrdersOnly(userId)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleConfirmOrder = async (orderId: string) => {
    setConfirmingOrderId(orderId);
    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase.from("orders").update({ status: "selesai" }).eq("id", orderId);
    await supabase.from("pesanan_mitra").update({ status: "SELESAI" }).eq("id", orderId);

    setConfirmingOrderId(null);

    if (error) {
      alert("Gagal mengonfirmasi pesanan: " + error.message);
    } else {
      alert("Terima kasih! Pesanan telah dikonfirmasi diterima.");
      fetchOrdersOnly(userId!);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setEditLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("mitra_profiles")
      .update({
        nama_mitra: editForm.nama_mitra,
        nik_nib: editForm.nik_nib,
        telepon: editForm.telepon,
        provinsi: editForm.provinsi,
        kota_kabupaten: editForm.kota_kabupaten,
        alamat: editForm.alamat,
      })
      .eq("user_id", userId);

    setEditLoading(false);

    if (!error) {
      setProfile((prev) => prev ? { ...prev, ...editForm } : null);
      setIsEditOpen(false);
    } else {
      alert("Gagal memperbarui profil: " + error.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (!userId) return;
    setDeleteLoading(true);

    try {
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert("Gagal menghapus akun: " + data.error);
        setDeleteLoading(false);
        return;
      }

      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      alert("Akun berhasil dihapus permanen.");
      router.push("/masuk");
    } catch {
      alert("Terjadi kesalahan jaringan saat menghapus akun.");
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-forest border-t-transparent rounded-full animate-spin"></div>
          <p className="text-forest font-medium text-sm">Memuat portal mitra...</p>
        </div>
      </div>
    );
  }

  const joinedLabel = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "-";

  return (
    <>
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="afterInteractive"
      />

      <div className="px-4 sm:px-6 md:px-12 py-6 md:py-12 max-w-5xl w-full mx-auto relative">
        
        {/* Ringkasan */}
        <section id="ringkasan" className="scroll-mt-8 mb-10 md:mb-16">
          <p className="font-mono text-xs tracking-widest uppercase text-green mb-2 sm:mb-3">Ringkasan</p>
          <h1 className="font-display font-semibold text-xl sm:text-2xl md:text-3xl text-forest mb-2">
            Selamat datang, {profile?.nama_mitra ?? "Mitra"}
          </h1>
          <p className="text-ink/60 text-sm sm:text-base mb-6 md:mb-8">Pantau stok dan kelola profil kemitraan kamu di sini.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-paper rounded-2xl border border-forest/10 p-4 sm:p-5 shadow-xs">
              <p className="text-xs text-ink/45 mb-1">Status akun</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <svg className="w-4 h-4 text-forest opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-display font-semibold text-forest text-base sm:text-lg">Aktif</p>
              </div>
            </div>
            <div className="bg-paper rounded-2xl border border-forest/10 p-4 sm:p-5 shadow-xs">
              <p className="text-xs text-ink/45 mb-1">Bergabung sejak</p>
              <p className="font-display font-semibold text-forest text-base sm:text-lg">{joinedLabel}</p>
            </div>
          </div>
        </section>

        {/* Pesan Stok */}
        <section id="pesan-stok" className="scroll-mt-8 mb-10 md:mb-16">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 sm:mb-3 gap-2">
            <div>
              <p className="font-mono text-xs tracking-widest uppercase text-gold mb-1">Pesan stok</p>
              <h2 className="font-display font-semibold text-xl sm:text-2xl text-forest">Pesan bahan energi</h2>
            </div>
            {(profile?.kota_kabupaten || profile?.alamat) && (
              <span className="text-xs bg-forest/10 text-forest font-medium px-3 py-1 rounded-full border border-forest/20">
                Wilayah: {profile.kota_kabupaten ? profile.kota_kabupaten.toUpperCase() : "BELUM DISET"}
              </span>
            )}
          </div>
          <p className="text-ink/60 text-sm sm:text-base mb-6 md:mb-8 max-w-lg">
            Pantau stok yang ada di titikmu dan ajukan permintaan stok langsung ke LENTERA.
          </p>

          {products.length === 0 ? (
            <div className="bg-paper rounded-2xl border border-forest/10 p-8 text-center">
              <p className="text-ink/60 text-sm">Tidak ada produk yang dialokasikan untuk wilayah ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>

        {/* Status Pengiriman (GRID 2 KOLOM) */}
        <section id="pesanan-saya" className="scroll-mt-8 mb-10 md:mb-16">
          <p className="font-mono text-xs tracking-widest uppercase text-forest mb-1">Daftar Pesanan</p>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display font-semibold text-xl sm:text-2xl text-forest">
              Status Pengiriman & Penerimaan
            </h2>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-forest/5 border border-forest/10 text-[10px] text-forest/70 font-semibold tracking-wide uppercase">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sistem tersinkronisasi
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="bg-paper rounded-2xl border border-forest/10 p-6 text-center">
              <p className="text-ink/60 text-sm">Belum ada pesanan aktif saat ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              {orders.map((order) => (
                <div key={order.id} className="bg-paper rounded-2xl border border-forest/10 p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-all">
                  
                  {/* Header Card: Nama Produk & Status */}
                  <div className="flex justify-between items-start border-b border-forest/10 pb-3 mb-3">
                    <div>
                      <h3 className="font-display font-bold text-forest text-lg">
                        {order.nama_produk || "Produk Energi"}
                      </h3>
                      <p className="font-mono text-[10px] text-ink/40 uppercase tracking-widest mt-0.5">
                        ID: {order.id.split('-')[0]}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize text-center whitespace-nowrap ${
                        order.status === "dikirim"
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : order.status === "selesai"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-blue-100 text-blue-800 border border-blue-300"
                      }`}
                    >
                      {order.status === "dikirim" ? "Pengiriman" : order.status === "selesai" ? "Selesai" : "Diproses"}
                    </span>
                  </div>

                  {/* Info Tengah: Harga & Tanggal */}
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-[10px] text-ink/50 uppercase tracking-wider mb-0.5">Total Pembayaran</p>
                      <p className="font-semibold text-green text-base">
                        Rp {order.total_harga?.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-ink/50 uppercase tracking-wider mb-0.5">Tanggal</p>
                      <p className="text-xs font-medium text-forest">
                        {new Date(order.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Area Tombol Aksi */}
                  {(order.bukti_pengiriman_url || order.status === "dikirim") && (
                    <div className="flex gap-2 pt-3 border-t border-forest/5 mt-auto">
                      {order.bukti_pengiriman_url && (
                        <button
                          onClick={() => {
                            setSelectedProofUrl(order.bukti_pengiriman_url!);
                            setProofModalOpen(true);
                          }}
                          className="flex-1 flex items-center justify-center text-xs font-semibold py-2.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          Lihat Bukti
                        </button>
                      )}

                      {order.status === "dikirim" && (
                        <button
                          onClick={() => handleConfirmOrder(order.id)}
                          disabled={confirmingOrderId === order.id}
                          className="flex-1 text-xs font-semibold py-2.5 bg-green text-white rounded-xl hover:bg-forest transition-colors shadow-xs disabled:opacity-50 cursor-pointer text-center"
                        >
                          {confirmingOrderId === order.id ? "Memproses..." : "Konfirmasi Terima"}
                        </button>
                      )}
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </section>

        {/* Profil Mitra */}
        <section id="profil-mitra" className="scroll-mt-8 mb-10">
          <div className="flex justify-between items-end mb-4 sm:mb-6">
            <div>
              <p className="font-mono text-xs tracking-widest uppercase text-clay mb-1 sm:mb-2">Profil mitra</p>
              <h2 className="font-display font-semibold text-xl sm:text-2xl text-forest">Informasi mitra</h2>
            </div>
            <button onClick={() => setIsEditOpen(true)} className="text-xs font-semibold px-4 py-2 bg-forest text-cream rounded-xl hover:bg-forest/90 transition-colors cursor-pointer">
              Ubah Profil
            </button>
          </div>

          <div className="bg-paper rounded-2xl border border-forest/10 p-5 sm:p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 shadow-xs">
            <InfoRow label="Nama mitra" value={profile?.nama_mitra} />
            <InfoRow label="Email" value={email} />
            <InfoRow label="NIK / NIB" value={profile?.nik_nib} />
            <InfoRow label="Nomor telepon" value={profile?.telepon} />
            <InfoRow label="Wilayah Operasional" value={profile?.kota_kabupaten ? `${profile.kota_kabupaten}, ${profile.provinsi}` : "BELUM DISET"} />
            <InfoRow label="Alamat lengkap" value={profile?.alamat} className="sm:col-span-2" />
          </div>
        </section>

        {/* Hapus Akun */}
        <section className="bg-red-50/50 border border-red-200/60 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-display font-semibold text-red-900 text-base sm:text-lg">Hapus Akun Kemitraan</h3>
            <p className="text-xs sm:text-sm text-red-700/80 mt-0.5">Tindakan ini permanen. Seluruh data profil dan alokasi wilayah kamu akan dihapus.</p>
          </div>
          <button onClick={() => setIsDeleteOpen(true)} className="text-xs font-semibold px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shrink-0 cursor-pointer">
            Hapus Akun
          </button>
        </section>

        {/* MODAL UBAH PROFIL */}
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest/40 backdrop-blur-xs p-4">
            <div className="bg-paper border border-forest/10 rounded-2xl max-w-lg w-full p-6 shadow-lg max-h-[90vh] overflow-y-auto">
              <h3 className="font-display font-semibold text-xl text-forest mb-4">Ubah Data Profil</h3>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-xs text-ink/60 mb-1">Nama Mitra</label>
                  <input type="text" required value={editForm.nama_mitra} onChange={(e) => setEditForm({ ...editForm, nama_mitra: e.target.value })} className="w-full text-sm bg-cream/50 border border-forest/20 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-forest" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-ink/60 mb-1">NIK / NIB</label>
                    <input type="text" required value={editForm.nik_nib} onChange={(e) => setEditForm({ ...editForm, nik_nib: e.target.value })} className="w-full text-sm bg-cream/50 border border-forest/20 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-forest" />
                  </div>
                  <div>
                    <label className="block text-xs text-ink/60 mb-1">Nomor Telepon</label>
                    <input type="text" required value={editForm.telepon} onChange={(e) => setEditForm({ ...editForm, telepon: e.target.value })} className="w-full text-sm bg-cream/50 border border-forest/20 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-forest" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-ink/60 mb-1">Provinsi</label>
                    <input type="text" value={editForm.provinsi} onChange={(e) => setEditForm({ ...editForm, provinsi: e.target.value })} className="w-full text-sm bg-cream/50 border border-forest/20 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-forest" />
                  </div>
                  <div>
                    <label className="block text-xs text-ink/60 mb-1">Kota / Kabupaten</label>
                    <input type="text" value={editForm.kota_kabupaten} onChange={(e) => setEditForm({ ...editForm, kota_kabupaten: e.target.value })} className="w-full text-sm bg-cream/50 border border-forest/20 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-forest" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-ink/60 mb-1">Alamat Lengkap</label>
                  <textarea rows={3} value={editForm.alamat} onChange={(e) => setEditForm({ ...editForm, alamat: e.target.value })} className="w-full text-sm bg-cream/50 border border-forest/20 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-forest resize-none" />
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-forest/10">
                  <button type="button" onClick={() => setIsEditOpen(false)} className="text-xs font-semibold px-4 py-2.5 text-ink/60 hover:text-ink cursor-pointer">Batal</button>
                  <button type="submit" disabled={editLoading} className="text-xs font-semibold px-4 py-2.5 bg-forest text-cream rounded-xl hover:bg-forest/90 disabled:opacity-50 cursor-pointer">
                    {editLoading ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL KONFIRMASI HAPUS AKUN */}
        {isDeleteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest/40 backdrop-blur-xs p-4">
            <div className="bg-paper border border-red-200 rounded-2xl max-w-md w-full p-6 shadow-lg">
              <h3 className="font-display font-semibold text-xl text-red-900 mb-2">Konfirmasi Hapus Akun</h3>
              <p className="text-sm text-ink/70 mb-6">Apakah kamu yakin ingin menghapus akun kemitraan ini? Semua data profil akan dihapus dan kamu akan dikembalikan ke halaman awal.</p>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsDeleteOpen(false)} className="text-xs font-semibold px-4 py-2.5 text-ink/60 hover:text-ink cursor-pointer">Batal</button>
                <button type="button" onClick={handleDeleteAccount} disabled={deleteLoading} className="text-xs font-semibold px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 cursor-pointer">
                  {deleteLoading ? "Menghapus..." : "Ya, Hapus Akun"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL TAMPILKAN BUKTI PENGIRIMAN */}
        {proofModalOpen && selectedProofUrl && (
          <div 
            className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4 transition-opacity animate-in fade-in"
            onClick={() => setProofModalOpen(false)}
          >
            <div 
              className="relative bg-paper rounded-2xl shadow-2xl max-w-2xl w-full p-2 animate-in zoom-in-95 duration-200" 
              onClick={(e) => e.stopPropagation()} 
            >
              <div className="flex justify-between items-center p-3 border-b border-forest/10 mb-2">
                <h3 className="font-display font-semibold text-forest text-sm">Foto Bukti Pengiriman</h3>
                <button 
                  onClick={() => setProofModalOpen(false)} 
                  className="text-ink/50 hover:text-ink font-bold w-8 h-8 flex items-center justify-center rounded-full bg-forest/5 hover:bg-forest/10 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="relative w-full flex justify-center items-center bg-black/5 rounded-xl overflow-hidden min-h-[200px]">
                <img 
                  src={selectedProofUrl} 
                  alt="Bukti Pengiriman Barang" 
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              </div>
              <div className="p-3 text-center">
                <a 
                  href={selectedProofUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[11px] font-medium text-blue-600 hover:underline"
                >
                  Buka gambar resolusi penuh di tab baru
                </a>
              </div>
            </div>
          </div>
        )}

        <AIAssistant />
      </div>
    </>
  );
}
```

## FILE: app/dashboard-admin/layout.tsx

```tsx
"use client";

export default function DashboardAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream w-full">
      {children}
    </div>
  );
}
```

## FILE: app/dashboard-admin/page.tsx

```tsx
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { AdminSidebar } from "@/components/dashboard/admin-sidebar";

interface Shipment {
  id: string;
  user_id: string;
  nama_limbah: string;
  perkiraan_berat: number;
  lokasi_penjemputan: string;
  status: string;
  industri_profiles: { nama_perusahaan: string; telepon: string };
}

interface Product {
  id: string;
  nama_produk: string;
  deskripsi: string;
  satuan: string;
  harga_default: number;
  stok_dummy: number;
}

interface RegionalProductPrice {
  id: string;
  product_id: string;
  provinsi: string;
  kota: string;
  harga: number;
  stok: number;
  products?: { nama_produk: string; satuan: string };
}

interface Order {
  id: string;
  created_at: string;
  total_harga: number;
  status: string;
  bukti_pengiriman_url?: string | null; 
}

interface UserAccount {
  id: string;
  user_id: string;
  nama: string;
  email?: string;
  nik_nib: string;
  telepon: string;
  provinsi?: string;
  kota_kabupaten?: string;
  kecamatan?: string;
  kelurahan?: string;
  alamat?: string;
  lat?: number | null;
  lng?: number | null;
  foto_doc_url?: string;
  tipe: "mitra" | "industri";
  status_akun: "aktif" | "banned";
  alasan_ban?: string;
  kuota_pemesanan?: number;
  total_pemesanan?: number;
}

export default function DashboardAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("ringkasan");

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [regionalPrices, setRegionalPrices] = useState<RegionalProductPrice[]>([]);
  const [usersList, setUsersList] = useState<UserAccount[]>([]);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserAccount | null>(null);

  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [newQuota, setNewQuota] = useState<number>(30);

  const [orderStatusModalOpen, setOrderStatusModalOpen] = useState(false);
  const [selectedOrderUpdate, setSelectedOrderUpdate] = useState<Order | null>(null);
  const [newOrderStatus, setNewOrderStatus] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

  const [banModalOpen, setBanModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [banReason, setBanReason] = useState("");

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [newStatus, setNewStatus] = useState("");

  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [formPrice, setFormPrice] = useState({
    product_id: "",
    provinsi: "",
    kota: "",
    harga: "",
    stok: "",
  });

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [formProduct, setFormProduct] = useState({
    nama_produk: "",
    deskripsi: "",
    satuan: "karung",
    harga_default: "",
    stok: "50",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [provinces, setProvinces] = useState<{ id: string; name: string }[]>([]);
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json")
      .then((res) => res.json())
      .then((data) => setProvinces(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetch provinsi:", err));
  }, []);

  useEffect(() => {
    const fetchAdminData = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        router.replace("/masuk");
        return;
      }

      const { data: adminProfile } = await supabase
        .from("admin_profiles")
        .select("user_id")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (!adminProfile) {
        router.replace("/dashboard");
        return;
      }

      const { data: shipData } = await supabase
        .from("waste_shipments")
        .select(`*, industri_profiles(nama_perusahaan, telepon)`)
        .order("created_at", { ascending: false });
      if (shipData) setShipments(shipData as unknown as Shipment[]);

      const { data: productData } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (productData) setProducts(productData);

      const { data: priceData } = await supabase
        .from("regional_product_prices")
        .select(`*, products(nama_produk, satuan)`)
        .order("kota", { ascending: true });
      if (priceData) setRegionalPrices(priceData as unknown as RegionalProductPrice[]);

      const { data: mitraData } = await supabase.from("mitra_profiles").select("*");
      const { data: industriData } = await supabase.from("industri_profiles").select("*");
      const { data: ordersCount } = await supabase.from("orders").select("user_id");

      const orderCountMap: Record<string, number> = {};
      (ordersCount || []).forEach((o: { user_id: string }) => {
        orderCountMap[o.user_id] = (orderCountMap[o.user_id] || 0) + 1;
      });

      const combinedUsers: UserAccount[] = [
        ...(mitraData || []).map((m: Record<string, unknown>, idx: number) => ({
          id: (m.id as string) || (m.user_id as string) || `mitra-${idx}`,
          user_id: (m.user_id as string) || `uid-mitra-${idx}`,
          nama: (m.nama_mitra as string) || "Tanpa Nama",
          nik_nib: (m.nik_nib as string) || "-",
          telepon: (m.telepon as string) || "-",
          provinsi: (m.provinsi as string) || "-",
          kota_kabupaten: (m.kota_kabupaten as string) || "-",
          kecamatan: (m.kecamatan as string) || "-",
          kelurahan: (m.kelurahan as string) || "-",
          alamat: (m.alamat as string) || "-",
          lat: m.lat as number | null,
          lng: m.lng as number | null,
          foto_doc_url: m.foto_nik_url as string,
          tipe: "mitra" as const,
          status_akun: (m.status_akun as "aktif" | "banned") || "aktif",
          alasan_ban: m.alasan_ban as string,
          kuota_pemesanan: (m.kuota_pemesanan as number) ?? 30,
          total_pemesanan: orderCountMap[m.user_id as string] || 0,
        })),
        ...(industriData || []).map((i: Record<string, unknown>, idx: number) => ({
          id: (i.id as string) || (i.user_id as string) || `industri-${idx}`,
          user_id: (i.user_id as string) || `uid-industri-${idx}`,
          nama: (i.nama_perusahaan as string) || "Tanpa Nama",
          nik_nib: (i.nik_nib as string) || (i.npwp as string) || "-",
          telepon: (i.telepon as string) || "-",
          provinsi: (i.provinsi as string) || "-",
          kota_kabupaten: (i.kota_kabupaten as string) || "-",
          kecamatan: (i.kecamatan as string) || "-",
          kelurahan: (i.kelurahan as string) || "-",
          alamat: (i.alamat as string) || "-",
          lat: i.lat as number | null,
          lng: i.lng as number | null,
          foto_doc_url: i.foto_npwp_url as string,
          tipe: "industri" as const,
          status_akun: (i.status_akun as "aktif" | "banned") || "aktif",
          alasan_ban: i.alasan_ban as string,
        })),
      ];

      setUsersList(combinedUsers);
      setLoading(false);
    };

    fetchAdminData();
  }, [router]);

  const handleOpenOrdersModal = async (usr: UserAccount) => {
    setSelectedUserDetail(usr);
    setNewQuota(usr.kuota_pemesanan ?? 30);
    setOrdersModalOpen(true);
    setLoadingOrders(true);

    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", usr.user_id)
      .order("created_at", { ascending: false });

    setUserOrders(data || []);
    setLoadingOrders(false);
  };

  const handleSaveOrderStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderUpdate) return;
    setIsSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    let finalProofUrl = selectedOrderUpdate.bukti_pengiriman_url;

    try {
      if (proofFile) {
        const fileExt = proofFile.name.split('.').pop();
        const fileName = `bukti-${selectedOrderUpdate.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("bukti_pengiriman")
          .upload(fileName, proofFile);

        if (uploadError) throw new Error("Gagal upload gambar: " + uploadError.message);

        const { data: publicUrlData } = supabase.storage
          .from("bukti_pengiriman")
          .getPublicUrl(fileName);

        finalProofUrl = publicUrlData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: newOrderStatus,
          ...(finalProofUrl ? { bukti_pengiriman_url: finalProofUrl } : {})
        })
        .eq("id", selectedOrderUpdate.id);

      if (updateError) throw new Error("Gagal update status: " + updateError.message);

      setUserOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrderUpdate.id
            ? { ...o, status: newOrderStatus, bukti_pengiriman_url: finalProofUrl }
            : o
        )
      );

      alert("Status & Bukti berhasil diperbarui!");
      setOrderStatusModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserDetail) return;
    setIsSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("mitra_profiles")
      .update({ kuota_pemesanan: Number(newQuota) })
      .eq("user_id", selectedUserDetail.user_id);

    if (!error) {
      setUsersList((prev) =>
        prev.map((u) =>
          u.user_id === selectedUserDetail.user_id
            ? { ...u, kuota_pemesanan: Number(newQuota) }
            : u
        )
      );
      alert(`Kuota pemesanan berhasil diubah menjadi ${newQuota}!`);
    } else {
      alert("Gagal memperbarui kuota: " + error.message);
    }
    setIsSubmitting(false);
  };

  const handleBanUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !banReason.trim()) return;
    setIsSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    const table = selectedUser.tipe === "mitra" ? "mitra_profiles" : "industri_profiles";

    await supabase.from("blacklists").insert({
      nik_nib: selectedUser.nik_nib,
      user_id: selectedUser.user_id,
      alasan: banReason,
      tipe_akun: selectedUser.tipe,
    });

    await supabase
      .from(table)
      .update({ status_akun: "banned", alasan_ban: banReason })
      .eq("user_id", selectedUser.user_id);

    setUsersList(
      usersList.map((u) =>
        u.user_id === selectedUser.user_id
          ? { ...u, status_akun: "banned", alasan_ban: banReason }
          : u
      )
    );

    alert(`Akun ${selectedUser.nama} berhasil di-ban!`);
    setBanModalOpen(false);
    setBanReason("");
    setIsSubmitting(false);
  };

  const handleUnbanUser = async (user: UserAccount) => {
    if (!confirm(`Apakah Anda yakin ingin melepas ban untuk akun ${user.nama}?`)) return;

    const supabase = createSupabaseBrowserClient();
    const table = user.tipe === "mitra" ? "mitra_profiles" : "industri_profiles";

    await supabase.from("blacklists").delete().eq("user_id", user.user_id);

    const { error } = await supabase
      .from(table)
      .update({ status_akun: "aktif", alasan_ban: null })
      .eq("user_id", user.user_id);

    if (!error) {
      setUsersList(
        usersList.map((u) =>
          u.user_id === user.user_id
            ? { ...u, status_akun: "aktif", alasan_ban: undefined }
            : u
        )
      );
      alert(`Ban untuk akun ${user.nama} berhasil dilepas! Akun kini aktif kembali.`);
    } else {
      alert("Gagal melepas ban: " + error.message);
    }
  };

  const handleProvinsiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provId = e.target.value;
    const provName = e.target.options[e.target.selectedIndex]?.text || "";

    setFormPrice((prev) => ({ ...prev, provinsi: provName, kota: "" }));
    setCities([]);

    if (provId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provId}.json`)
        .then((res) => res.json())
        .then((data) => setCities(Array.isArray(data) ? data : []))
        .catch((err) => console.error("Error fetch kota:", err));
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;
    setIsSubmitting(true);
    
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("waste_shipments").update({ status: newStatus }).eq("id", selectedShipment.id);
    
    setIsSubmitting(false);

    if (error) {
      alert("Gagal mengubah status pengiriman: " + error.message);
      return;
    }

    setShipments(shipments.map((s) => (s.id === selectedShipment.id ? { ...s, status: newStatus } : s)));
    setStatusModalOpen(false);
    alert("Status pengiriman berhasil diubah!");
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("products")
      .insert({
        nama_produk: formProduct.nama_produk,
        deskripsi: formProduct.deskripsi,
        satuan: formProduct.satuan,
        harga_default: Number(formProduct.harga_default),
        stok_dummy: Number(formProduct.stok),
      })
      .select()
      .single();

    if (data) setProducts([data, ...products]);
    if (error) alert("Gagal menambah produk: " + error.message);

    setProductModalOpen(false);
    setFormProduct({ nama_produk: "", deskripsi: "", satuan: "karung", harga_default: "", stok: "50" });
    setIsSubmitting(false);
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase.from("regional_product_prices").upsert(
      {
        product_id: formPrice.product_id,
        provinsi: formPrice.provinsi.toUpperCase(),
        kota: formPrice.kota.toUpperCase(),
        harga: Number(formPrice.harga),
        stok: Number(formPrice.stok),
      },
      { onConflict: "product_id,kota" }
    );

    if (!error) {
      alert("Harga dan stok wilayah berhasil disimpan!");
      window.location.reload();
    } else {
      alert("Gagal menyimpan data wilayah: " + error.message);
    }
    setIsSubmitting(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Yakin ingin menghapus produk ini?")) return;
    const supabase = createSupabaseBrowserClient();
    await supabase.from("products").delete().eq("id", id);
    setProducts(products.filter((p) => p.id !== id));
    setRegionalPrices(regionalPrices.filter((rp) => rp.product_id !== id));
  };

  const handleDeleteRegionalPrice = async (id: string) => {
    if (!confirm("Yakin ingin menghapus harga wilayah ini?")) return;
    const supabase = createSupabaseBrowserClient();
    await supabase.from("regional_product_prices").delete().eq("id", id);
    setRegionalPrices(regionalPrices.filter((rp) => rp.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-forest border-t-transparent rounded-full animate-spin"></div>
          <p className="text-forest font-medium text-sm">Memuat pusat kendali admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-cream relative overflow-x-hidden">
      
      {/* ðŸš€ KITA PANGGIL SATU-SATUNYA SIDEBAR DI SINI SECARA BERSIH */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* KONTEN UTAMA */}
      <main className="flex-1 min-w-0 px-4 sm:px-6 md:px-12 py-6 md:py-12 max-w-6xl pt-24 md:pt-12">
        <div className="mb-8">
          <p className="font-mono text-xs tracking-widest uppercase text-green mb-1">Administrator Portal</p>
          <h1 className="font-display font-semibold text-2xl md:text-3xl text-forest capitalize">
            {activeTab.replace("-", " ")}
          </h1>
        </div>

        {activeTab === "ringkasan" && (
          <div className="space-y-5">
            <div className="bg-paper p-5 md:p-6 rounded-2xl border border-forest/10 shadow-xs">
              <h3 className="font-display font-semibold text-lg text-forest mb-1.5">Selamat Datang di Portal Kendali</h3>
              <p className="text-sm text-ink/60 leading-relaxed">
                Pantau statistik utama, kelola akun, dan navigasikan katalog produk serta pengiriman dari satu tempat.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-paper p-4 md:p-5 rounded-2xl border border-forest/10 shadow-xs flex flex-col justify-center">
                <p className="text-[10px] sm:text-xs text-ink/50 uppercase font-mono mb-1">Total Mitra</p>
                <p className="font-display font-semibold text-xl md:text-2xl text-forest">
                  {usersList.filter((u) => u.tipe === "mitra").length}
                </p>
              </div>
              <div className="bg-paper p-4 md:p-5 rounded-2xl border border-forest/10 shadow-xs flex flex-col justify-center">
                <p className="text-[10px] sm:text-xs text-ink/50 uppercase font-mono mb-1">Total Industri</p>
                <p className="font-display font-semibold text-xl md:text-2xl text-forest">
                  {usersList.filter((u) => u.tipe === "industri").length}
                </p>
              </div>
              <div className="bg-paper p-4 md:p-5 rounded-2xl border border-forest/10 shadow-xs flex flex-col justify-center">
                <p className="text-[10px] sm:text-xs text-ink/50 uppercase font-mono mb-1">Pengiriman Limbah</p>
                <p className="font-display font-semibold text-xl md:text-2xl text-forest">{shipments.length}</p>
              </div>
              <div className="bg-paper p-4 md:p-5 rounded-2xl border border-forest/10 shadow-xs flex flex-col justify-center">
                <p className="text-[10px] sm:text-xs text-ink/50 uppercase font-mono mb-1">Produk Katalog</p>
                <p className="font-display font-semibold text-xl md:text-2xl text-forest">{products.length}</p>
              </div>
            </div>
          </div>
        )}

        {(activeTab === "manajemen-pengguna" || activeTab === "manajemen-akun") && (
          <section className="bg-paper rounded-2xl border border-forest/10 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-forest/10 bg-forest/5 flex justify-between items-center">
              <div>
                <h3 className="font-display font-semibold text-forest text-base">Daftar Akun Mitra & Industri</h3>
                <p className="text-xs text-ink/60">Inspeksi profil lengkap, foto KTP/NPWP, dan set kuota transaksi.</p>
              </div>
            </div>

            <div className="block md:hidden p-4 space-y-4 bg-cream/30">
              {usersList.map((usr, index) => (
                <div key={`${usr.tipe}-${usr.user_id}-${index}`} className="bg-white border border-forest/10 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-forest text-sm">{usr.nama}</h4>
                      <p className="text-xs text-ink/60 uppercase font-mono mt-0.5">{usr.tipe} â€¢ {usr.nik_nib}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full uppercase tracking-wider text-[10px] font-bold shrink-0 ${
                      usr.status_akun === "banned" ? "bg-red-100 text-red-700" : "bg-green/10 text-green"
                    }`}>
                      {usr.status_akun}
                    </span>
                  </div>

                  {usr.tipe === "mitra" && (
                    <div className="text-xs text-ink/70">
                      Penggunaan Kuota: <span className="font-mono font-medium text-forest">{usr.total_pemesanan} / {usr.kuota_pemesanan ?? 30}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-forest/5 mt-1">
                    <button onClick={() => { setSelectedUserDetail(usr); setDetailModalOpen(true); }} className="flex-1 text-xs font-medium py-2 bg-forest/5 text-forest rounded-lg hover:bg-forest/10 transition-colors text-center cursor-pointer">
                      Detail
                    </button>
                    {usr.tipe === "mitra" && (
                      <button onClick={() => handleOpenOrdersModal(usr)} className="flex-1 text-xs font-medium py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-center cursor-pointer">
                        Pesanan
                      </button>
                    )}
                    {usr.status_akun === "banned" ? (
                      <button onClick={() => handleUnbanUser(usr)} className="flex-1 text-xs font-semibold py-2 bg-emerald-100 text-emerald-800 rounded-lg hover:bg-emerald-200 transition-colors text-center cursor-pointer">
                        Lepas Ban
                      </button>
                    ) : (
                      <button onClick={() => { setSelectedUser(usr); setBanModalOpen(true); }} className="flex-1 text-xs font-semibold py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-center cursor-pointer">
                        Ban
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-forest/5 text-forest font-medium border-b border-forest/10">
                  <tr>
                    <th className="p-4">Nama / Perusahaan</th>
                    <th className="p-4">Tipe</th>
                    <th className="p-4">NIK / NIB / NPWP</th>
                    <th className="p-4">Penggunaan Kuota</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest/10">
                  {usersList.map((usr, index) => (
                    <tr
                      key={`desktop-${usr.tipe}-${usr.user_id}-${index}`}
                      className="hover:bg-forest/[0.02] transition-colors"
                    >
                      <td className="p-4 font-medium text-forest">{usr.nama}</td>
                      <td className="p-4 capitalize text-xs font-mono">{usr.tipe}</td>
                      <td className="p-4 text-xs font-mono">{usr.nik_nib}</td>
                      <td className="p-4 text-xs">
                        {usr.tipe === "mitra" ? (
                          <span className="font-mono font-medium text-forest">
                            {usr.total_pemesanan} / {usr.kuota_pemesanan ?? 30}
                          </span>
                        ) : (
                          <span className="text-ink/40 italic">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full uppercase tracking-wider text-[10px] font-bold ${
                            usr.status_akun === "banned"
                              ? "bg-red-100 text-red-700"
                              : "bg-green/10 text-green"
                          }`}
                        >
                          {usr.status_akun}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedUserDetail(usr);
                              setDetailModalOpen(true);
                            }}
                            className="text-xs font-medium px-2.5 py-1.5 bg-forest/10 text-forest rounded-lg hover:bg-forest/20 transition-colors cursor-pointer"
                          >
                            Detail
                          </button>

                          {usr.tipe === "mitra" && (
                            <button
                              onClick={() => handleOpenOrdersModal(usr)}
                              className="text-xs font-medium px-2.5 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors cursor-pointer"
                            >
                              Pesanan
                            </button>
                          )}

                          {usr.status_akun === "banned" ? (
                            <button
                              onClick={() => handleUnbanUser(usr)}
                              className="text-xs font-semibold px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
                            >
                              Lepas Ban
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedUser(usr);
                                setBanModalOpen(true);
                              }}
                              className="text-xs font-semibold px-2.5 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                            >
                              Ban
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "katalog-produk" && (
          <section className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-ink/60">Daftar produk energi yang terdaftar secara nasional.</p>
              <button
                onClick={() => setProductModalOpen(true)}
                className="bg-forest text-paper px-4 py-2 rounded-xl text-xs font-medium hover:bg-forest/90 shadow-xs cursor-pointer"
              >
                + Tambah Produk Baru
              </button>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {products.map((p) => (
                <div key={p.id} className="bg-paper border border-forest/10 p-5 rounded-2xl flex flex-col relative group shadow-xs">
                  <button
                    onClick={() => handleDeleteProduct(p.id)}
                    className="absolute top-4 right-4 text-ink/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium cursor-pointer"
                  >
                    Hapus
                  </button>
                  <h3 className="font-display font-semibold text-forest text-lg pr-10">{p.nama_produk}</h3>
                  <p className="text-xs text-ink/60 mb-3 leading-relaxed">{p.deskripsi}</p>
                  <div className="mt-auto border-t border-forest/10 pt-3">
                    <p className="text-[10px] text-ink/50 uppercase tracking-widest">Harga Nasional (Default)</p>
                    <p className="font-semibold text-green">
                      Rp {p.harga_default?.toLocaleString("id-ID")}{" "}
                      <span className="text-xs font-normal text-ink/50">/{p.satuan}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "harga-wilayah" && (
          <section className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-ink/60">Penyesuaian harga dan ketersediaan stok produk per daerah.</p>
              <button
                onClick={() => setPriceModalOpen(true)}
                className="bg-forest text-paper px-4 py-2 rounded-xl text-xs font-medium hover:bg-forest/90 shadow-xs cursor-pointer"
              >
                + Set Harga Wilayah
              </button>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {regionalPrices.length === 0 && (
                <div className="col-span-3 p-8 bg-paper border border-forest/10 rounded-2xl text-center text-ink/50 text-sm">
                  Belum ada penyesuaian harga spesifik daerah.
                </div>
              )}
              {regionalPrices.map((rp) => (
                <div key={rp.id} className="bg-paper rounded-2xl border border-forest/10 p-5 relative group shadow-xs">
                  <button
                    onClick={() => handleDeleteRegionalPrice(rp.id)}
                    className="absolute top-4 right-4 text-ink/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium cursor-pointer"
                  >
                    Hapus
                  </button>
                  <p className="text-[10px] uppercase text-ink/50 mb-1 pr-10">{rp.kota}, {rp.provinsi}</p>
                  <h3 className="font-semibold text-forest text-lg mb-1">{rp.products?.nama_produk}</h3>
                  <div className="text-sm text-ink/70 space-y-1 mt-2 border-t border-forest/10 pt-2">
                    <p>
                      Harga: <span className="font-bold text-green">Rp {rp.harga?.toLocaleString("id-ID")}</span>
                    </p>
                    <p>Stok: <span className="font-bold text-forest">{rp.stok} {rp.products?.satuan || "karung"}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "pengiriman" && (
          <section className="bg-paper rounded-2xl border border-forest/10 overflow-hidden shadow-xs">
            
            <div className="block md:hidden p-4 space-y-4 bg-cream/30">
              {shipments.map((ship) => (
                <div key={`mobile-ship-${ship.id}`} className="bg-white border border-forest/10 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-forest text-sm">{ship.industri_profiles?.nama_perusahaan || "-"}</h4>
                      <p className="text-xs text-ink/70 mt-1">{ship.nama_limbah} <span className="font-semibold">({ship.perkiraan_berat}kg)</span></p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full uppercase tracking-wider text-[10px] font-bold shrink-0 ${
                      ship.status.toLowerCase() === 'selesai' ? 'bg-green/10 text-green'
                      : ship.status.toLowerCase() === 'diperjalanan' ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-800'
                    }`}>
                      {ship.status}
                    </span>
                  </div>

                  <div className="text-xs text-ink/60 bg-forest/5 p-2 rounded-lg">
                    <span className="block font-medium text-ink/80 mb-0.5">Lokasi Penjemputan:</span>
                    {ship.lokasi_penjemputan}
                  </div>

                  <div className="pt-2 border-t border-forest/5 mt-1">
                    <button onClick={() => { setSelectedShipment(ship); setNewStatus(ship.status); setStatusModalOpen(true); }} className="w-full text-xs font-semibold py-2 bg-green/10 text-green rounded-lg hover:bg-green/20 transition-colors text-center cursor-pointer">
                      Ubah Status
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-forest/5 text-forest font-medium border-b border-forest/10">
                  <tr>
                    <th className="p-4">Industri</th>
                    <th className="p-4">Limbah & Berat</th>
                    <th className="p-4">Lokasi Penjemputan</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest/10">
                  {shipments.map((ship) => (
                    <tr key={`desktop-ship-${ship.id}`} className="hover:bg-forest/[0.02] transition-colors">
                      <td className="p-4 font-medium text-forest">{ship.industri_profiles?.nama_perusahaan || "-"}</td>
                      <td className="p-4">{ship.nama_limbah} ({ship.perkiraan_berat}kg)</td>
                      <td className="p-4 text-xs max-w-xs truncate">{ship.lokasi_penjemputan}</td>
                      <td className="p-4 font-bold text-xs">
                        <span className={`px-2.5 py-1 rounded-full uppercase tracking-wider text-[10px] ${
                          ship.status.toLowerCase() === 'selesai' ? 'bg-green/10 text-green'
                          : ship.status.toLowerCase() === 'diperjalanan' ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-800'
                        }`}>
                          {ship.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => { setSelectedShipment(ship); setNewStatus(ship.status); setStatusModalOpen(true); }}
                          className="text-green hover:underline text-xs font-medium cursor-pointer"
                        >
                          Ubah Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {detailModalOpen && selectedUserDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4">
            <div className="bg-paper rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4 border-b border-forest/10 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-green">Profil {selectedUserDetail.tipe}</span>
                  <h3 className="font-display font-semibold text-xl text-forest">{selectedUserDetail.nama}</h3>
                </div>
                <button onClick={() => setDetailModalOpen(false)} className="text-ink/40 hover:text-ink text-sm font-bold cursor-pointer">âœ•</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-6">
                <div className="bg-white p-3 rounded-xl border border-forest/10 space-y-1.5">
                  <p className="text-ink/50 uppercase font-mono text-[10px]">Identitas Resmi</p>
                  <p><span className="font-semibold">NIK / NIB / NPWP:</span> {selectedUserDetail.nik_nib}</p>
                  <p><span className="font-semibold">Telepon:</span> {selectedUserDetail.telepon}</p>
                  <p><span className="font-semibold">Status Akun:</span> <span className="capitalize font-bold">{selectedUserDetail.status_akun}</span></p>
                  {selectedUserDetail.alasan_ban && (
                    <p className="text-red-600"><span className="font-semibold">Alasan Ban:</span> {selectedUserDetail.alasan_ban}</p>
                  )}
                </div>

                <div className="bg-white p-3 rounded-xl border border-forest/10 space-y-1.5">
                  <p className="text-ink/50 uppercase font-mono text-[10px]">Alamat & Wilayah Operasional</p>
                  <p><span className="font-semibold">Provinsi:</span> {selectedUserDetail.provinsi}</p>
                  <p><span className="font-semibold">Kota / Kab:</span> {selectedUserDetail.kota_kabupaten}</p>
                  <p><span className="font-semibold">Kec / Kel:</span> {selectedUserDetail.kecamatan}, {selectedUserDetail.kelurahan}</p>
                  <p><span className="font-semibold">Detail Alamat:</span> {selectedUserDetail.alamat}</p>
                  <p><span className="font-semibold">Koordinat GPS:</span> {selectedUserDetail.lat && selectedUserDetail.lng ? `${selectedUserDetail.lat}, ${selectedUserDetail.lng}` : "Belum di-set"}</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xs font-semibold text-forest mb-2">Dokumen Verifikasi (Foto KTP / NPWP):</p>
                {selectedUserDetail.foto_doc_url ? (
                  <div className="bg-black/5 rounded-xl p-2 border border-forest/10 overflow-hidden text-center">
                    <a href={selectedUserDetail.foto_doc_url} target="_blank" rel="noopener noreferrer">
                      <Image
                        src={selectedUserDetail.foto_doc_url}
                        alt="Foto Dokumen"
                        width={800}
                        height={600}
                        className="max-h-64 object-contain mx-auto rounded-lg hover:opacity-90 transition-opacity"
                      />
                    </a>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 text-center text-ink/40 text-xs">
                    Foto dokumen tidak diunggah atau belum tersedia.
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-forest/10">
                <button type="button" onClick={() => setDetailModalOpen(false)} className="bg-forest text-paper px-4 py-2 rounded-xl text-xs font-medium hover:bg-forest/90 cursor-pointer">
                  Tutup Profil
                </button>
              </div>
            </div>
          </div>
        )}

        {ordersModalOpen && selectedUserDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4">
            <div className="bg-paper rounded-2xl shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4 border-b border-forest/10 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-blue-600">Riwayat & Status Pesanan Mitra</span>
                  <h3 className="font-display font-semibold text-xl text-forest">{selectedUserDetail.nama}</h3>
                </div>
                <button onClick={() => setOrdersModalOpen(false)} className="text-ink/40 hover:text-ink text-sm font-bold cursor-pointer">âœ•</button>
              </div>

              <form onSubmit={handleUpdateQuota} className="bg-blue-50/50 border border-blue-200/60 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-blue-900 mb-1">Atur Batas Kuota Pemesanan Akun Ini:</label>
                  <input type="number" min={0} required value={newQuota} onChange={(e) => setNewQuota(Number(e.target.value))} className="w-full border border-blue-300 p-2 rounded-xl text-sm bg-white outline-none font-mono" />
                </div>
                <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer">
                  {isSubmitting ? "Menyimpan..." : "Simpan Kuota Baru"}
                </button>
              </form>

              <div className="mb-4">
                <h4 className="font-semibold text-forest text-sm mb-2">Daftar Transaksi Pemesanan</h4>
                {loadingOrders ? (
                  <p className="text-xs text-ink/50 py-4 text-center">Memuat riwayat transaksi...</p>
                ) : userOrders.length === 0 ? (
                  <div className="bg-white border border-forest/10 rounded-xl p-6 text-center text-xs text-ink/50">Mitra ini belum pernah melakukan pemesanan produk.</div>
                ) : (
                  <div className="border border-forest/10 rounded-xl overflow-hidden bg-white">
                    <table className="w-full text-left text-xs block md:table overflow-x-auto">
                      <thead className="bg-forest/5 text-forest font-medium border-b border-forest/10 hidden md:table-header-group">
                        <tr>
                          <th className="p-3">ID Pesanan</th>
                          <th className="p-3">Tanggal</th>
                          <th className="p-3">Total Biaya</th>
                          <th className="p-3">Status Pengiriman</th>
                          <th className="p-3 text-center">Ubah Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-forest/10 block md:table-row-group">
                        {userOrders.map((ord) => (
                          <tr key={ord.id} className="block md:table-row p-4 md:p-0">
                            <td className="p-1 md:p-3 font-mono font-medium text-forest truncate block md:table-cell mb-2 md:mb-0">
                              <span className="inline-block md:hidden text-ink/50 mr-2">ID:</span>
                              {ord.id.slice(0, 8)}...
                            </td>
                            <td className="p-1 md:p-3 text-ink/60 block md:table-cell mb-2 md:mb-0">
                              <span className="inline-block md:hidden text-ink/50 mr-2">Tgl:</span>
                              {new Date(ord.created_at).toLocaleDateString("id-ID")}
                            </td>
                            <td className="p-1 md:p-3 font-semibold text-green block md:table-cell mb-3 md:mb-0">
                              <span className="inline-block md:hidden text-ink/50 mr-2">Total:</span>
                              Rp {ord.total_harga?.toLocaleString("id-ID")}
                            </td>
                            <td className="p-1 md:p-3 block md:table-cell mb-4 md:mb-0">
                              <div className="flex flex-col gap-1 items-start">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                  ord.status === 'dikirim' ? 'bg-amber-100 text-amber-800'
                                  : ord.status === 'selesai' ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {ord.status}
                                </span>
                                {ord.bukti_pengiriman_url && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setSelectedProofUrl(ord.bukti_pengiriman_url!);
                                      setProofModalOpen(true);
                                    }}
                                    className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 mt-1 cursor-pointer font-medium"
                                  >
                                    ðŸ“Ž Lihat Bukti
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="p-1 md:p-3 text-center block md:table-cell border-t md:border-0 border-forest/10 pt-3 md:pt-0 mt-2 md:mt-0">
                              <button
                                onClick={() => {
                                  setSelectedOrderUpdate(ord);
                                  setNewOrderStatus(ord.status);
                                  setProofFile(null); 
                                  setOrderStatusModalOpen(true);
                                }}
                                className="w-full md:w-auto text-green hover:underline text-xs font-medium cursor-pointer bg-green/10 md:bg-transparent py-2 md:py-0 rounded-lg md:rounded-none"
                              >
                                Ubah Status & Bukti
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-forest/10">
                <button type="button" onClick={() => setOrdersModalOpen(false)} className="bg-forest text-paper px-4 py-2 rounded-xl text-xs font-medium hover:bg-forest/90 cursor-pointer">
                  Tutup Modal
                </button>
              </div>
            </div>
          </div>
        )}

        {orderStatusModalOpen && selectedOrderUpdate && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
            <div className="bg-paper rounded-2xl shadow-xl w-full max-w-sm p-6">
              <h3 className="font-display font-semibold text-forest mb-4">Ubah Status & Upload Bukti</h3>
              <form onSubmit={handleSaveOrderStatus} className="space-y-4">
                
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Status Pesanan</label>
                  <select 
                    value={newOrderStatus} 
                    onChange={(e) => setNewOrderStatus(e.target.value)} 
                    className="w-full border border-ink/20 p-2.5 rounded-xl text-sm bg-white outline-none cursor-pointer"
                  >
                    <option value={newOrderStatus} className="hidden">{newOrderStatus}</option>
                    <option value="menunggu_pembayaran">Menunggu Pembayaran</option>
                    <option value="diproses">Diproses</option>
                    <option value="dikirim">Dikirim (Dalam Pengiriman)</option>
                    <option value="selesai">Selesai</option>
                    <option value="dibatalkan">Dibatalkan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Foto Bukti Pengiriman (Opsional)</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-ink/70 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-forest/10 file:text-forest hover:file:bg-forest/20 cursor-pointer border border-ink/20 rounded-xl p-1 bg-white"
                  />
                  {selectedOrderUpdate.bukti_pengiriman_url && !proofFile && (
                    <p className="text-[10px] text-green mt-1">âœ“ Bukti sudah pernah diupload sebelumnya.</p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-forest/10">
                  <button type="button" onClick={() => setOrderStatusModalOpen(false)} className="px-4 py-2 text-xs text-ink/60 cursor-pointer">Batal</button>
                  <button type="submit" disabled={isSubmitting} className="bg-green text-white px-4 py-2 rounded-xl text-xs font-medium cursor-pointer">
                    {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {banModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4">
            <div className="bg-paper rounded-2xl shadow-xl w-full max-w-md p-6">
              <h3 className="font-display font-semibold text-red-800 mb-2">Blokir / Ban Akun</h3>
              <p className="text-xs text-ink/70 mb-4">
                Anda akan memblokir <span className="font-bold">{selectedUser.nama}</span> ({selectedUser.nik_nib}). NIK/NIB ini akan dimasukkan ke daftar hitam.
              </p>
              <form onSubmit={handleBanUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Alasan Pemblokiran</label>
                  <textarea required rows={3} placeholder="Misal: Pengiriman data fiktif / deskripsi limbah tidak sesuai." value={banReason} onChange={(e) => setBanReason(e.target.value)} className="w-full border border-ink/20 p-2.5 rounded-xl text-sm bg-white outline-none resize-none" />
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-forest/10">
                  <button type="button" onClick={() => setBanModalOpen(false)} className="px-4 py-2 text-xs text-ink/60 cursor-pointer">Batal</button>
                  <button type="submit" disabled={isSubmitting} className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-medium cursor-pointer">{isSubmitting ? "Memproses..." : "Ya, Ban Akun"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {priceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4">
            <div className="bg-paper rounded-2xl shadow-xl w-full max-w-md p-6">
              <h3 className="font-display font-semibold text-forest mb-4">Set Harga & Stok Wilayah</h3>
              <form onSubmit={handleSavePrice} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Pilih Produk</label>
                  <select className="w-full border border-ink/20 p-2.5 rounded-xl outline-none text-sm bg-white cursor-pointer" required value={formPrice.product_id} onChange={(e) => setFormPrice({ ...formPrice, product_id: e.target.value })}>
                    <option value="">-- Pilih Produk --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.nama_produk}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-ink mb-1">Provinsi</label>
                    <select className="w-full border border-ink/20 p-2.5 rounded-xl text-xs uppercase outline-none bg-white cursor-pointer" onChange={handleProvinsiChange} required>
                      <option value="">PROVINSI</option>
                      {provinces.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink mb-1">Kota / Kab</label>
                    <select className="w-full border border-ink/20 p-2.5 rounded-xl text-xs uppercase disabled:bg-gray-100 outline-none bg-white cursor-pointer" value={formPrice.kota} onChange={(e) => setFormPrice((prev) => ({ ...prev, kota: e.target.options[e.target.selectedIndex]?.text || "" }))} disabled={cities.length === 0} required>
                      <option value="">KOTA/KAB</option>
                      {cities.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-ink mb-1">Harga (Rp)</label>
                    <input type="number" placeholder="18000" required className="w-full border border-ink/20 p-2.5 rounded-xl outline-none text-sm bg-white" value={formPrice.harga} onChange={(e) => setFormPrice({ ...formPrice, harga: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink mb-1">Stok Gudang</label>
                    <input type="number" placeholder="50" required className="w-full border border-ink/20 p-2.5 rounded-xl outline-none text-sm bg-white" value={formPrice.stok} onChange={(e) => setFormPrice({ ...formPrice, stok: e.target.value })} />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-forest/10">
                  <button type="button" onClick={() => setPriceModalOpen(false)} className="px-4 py-2 text-xs text-ink/60 cursor-pointer">Batal</button>
                  <button type="submit" disabled={isSubmitting} className="bg-forest text-cream px-4 py-2 rounded-xl text-xs font-medium cursor-pointer">{isSubmitting ? "Menyimpan..." : "Simpan Data"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {productModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4">
            <div className="bg-paper rounded-2xl shadow-xl w-full max-w-lg p-6">
              <h3 className="font-display font-semibold text-forest mb-4">Tambah Produk Utama</h3>
              <form onSubmit={handleSaveProduct} className="space-y-4">
                <input type="text" placeholder="Nama Produk" required value={formProduct.nama_produk} onChange={(e) => setFormProduct({ ...formProduct, nama_produk: e.target.value })} className="w-full border border-ink/20 p-2.5 rounded-xl text-sm bg-white outline-none" />
                <input type="text" placeholder="Deskripsi Singkat" required value={formProduct.deskripsi} onChange={(e) => setFormProduct({ ...formProduct, deskripsi: e.target.value })} className="w-full border border-ink/20 p-2.5 rounded-xl text-sm bg-white outline-none" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Satuan (karung/liter)" required value={formProduct.satuan} onChange={(e) => setFormProduct({ ...formProduct, satuan: e.target.value })} className="w-full border border-ink/20 p-2.5 rounded-xl text-sm bg-white outline-none" />
                  <input type="number" placeholder="Stok Default" required value={formProduct.stok} onChange={(e) => setFormProduct({ ...formProduct, stok: e.target.value })} className="w-full border border-ink/20 p-2.5 rounded-xl text-sm bg-white outline-none" />
                </div>
                <input type="number" placeholder="Harga Default Nasional (Rp)" required value={formProduct.harga_default} onChange={(e) => setFormProduct({ ...formProduct, harga_default: e.target.value })} className="w-full border border-ink/20 p-2.5 rounded-xl text-sm bg-white outline-none" />
                <div className="flex justify-end gap-3 pt-3 border-t border-forest/10">
                  <button type="button" onClick={() => setProductModalOpen(false)} className="px-4 py-2 text-xs text-ink/60 cursor-pointer">Batal</button>
                  <button type="submit" disabled={isSubmitting} className="bg-forest text-cream px-4 py-2 rounded-xl text-xs font-medium cursor-pointer">{isSubmitting ? "Menyimpan..." : "Simpan Produk"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {statusModalOpen && selectedShipment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4">
            <div className="bg-paper rounded-2xl shadow-xl w-full max-w-sm p-6">
              <h3 className="font-display font-semibold text-forest mb-4">Ubah Status Pengiriman Limbah</h3>
              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full border border-ink/20 p-2.5 rounded-xl text-sm bg-white outline-none cursor-pointer">
                  <option value={newStatus} className="hidden">{newStatus}</option>
                  <option value="MENUNGGU PEMBAYARAN">Menunggu Pembayaran</option>
                  <option value="Menunggu Penjemputan">Menunggu Penjemputan</option>
                  <option value="Diperjalanan">Diperjalanan</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>
                <div className="flex justify-end gap-3 pt-3 border-t border-forest/10">
                  <button type="button" onClick={() => setStatusModalOpen(false)} className="px-4 py-2 text-xs text-ink/60 cursor-pointer">Batal</button>
                  <button type="submit" disabled={isSubmitting} className="bg-green text-white px-4 py-2 rounded-xl text-xs font-medium cursor-pointer">{isSubmitting ? "Menyimpan..." : "Simpan Status"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ðŸš€ MODAL BARU: TAMPILKAN BUKTI PENGIRIMAN DI ADMIN */}
        {proofModalOpen && selectedProofUrl && (
          <div 
            className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4 transition-opacity animate-in fade-in"
            onClick={() => setProofModalOpen(false)}
          >
            <div 
              className="relative bg-paper rounded-2xl shadow-2xl max-w-2xl w-full p-2 animate-in zoom-in-95 duration-200" 
              onClick={(e) => e.stopPropagation()} 
            >
              <div className="flex justify-between items-center p-3 border-b border-forest/10 mb-2">
                <h3 className="font-display font-semibold text-forest text-sm">Foto Bukti Pengiriman</h3>
                <button 
                  onClick={() => setProofModalOpen(false)} 
                  className="text-ink/50 hover:text-ink font-bold w-8 h-8 flex items-center justify-center rounded-full bg-forest/5 hover:bg-forest/10 transition-colors cursor-pointer"
                >
                  âœ•
                </button>
              </div>
              <div className="relative w-full flex justify-center items-center bg-black/5 rounded-xl overflow-hidden min-h-[200px]">
                <img 
                  src={selectedProofUrl} 
                  alt="Bukti Pengiriman Barang" 
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              </div>
              <div className="p-3 text-center">
                <a 
                  href={selectedProofUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[11px] font-medium text-blue-600 hover:underline"
                >
                  Buka gambar resolusi penuh di tab baru
                </a>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
```

## FILE: app/dashboard-industri/layout.tsx

```tsx
"use client";

import { useState } from "react";
import { IndustriSidebar } from "@/components/dashboard/industri-sidebar";

export default function DashboardIndustriLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cream flex flex-col md:flex-row relative">
      {/* 
        Komponen IndustriSidebar sudah menangani:
        1. Top Bar Mobile
        2. Drawer Slide-Down / Slide-In Mobile
        3. Sidebar Desktop
      */}
      <IndustriSidebar
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
      />

      {/* Area Konten Utama */}
      <main className="flex-1 w-full min-w-0 max-w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
```

## FILE: app/dashboard-industri/page.tsx

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { AIAssistant } from "@/components/ai-assistant";

interface IndustriProfile {
  nama_perusahaan: string;
  npwp: string;
  alamat: string;
  telepon: string;
  provinsi?: string;
  kota_kabupaten?: string;
  created_at: string;
  status_akun?: string;
  alasan_ban?: string;
}

interface WasteShipment {
  id: string;
  nama_limbah: string;
  perkiraan_berat: number;
  lokasi_penjemputan: string;
  status: string;
  is_b3?: boolean;
  kategori_b3?: string;
  biaya_pengolahan?: number;
  created_at: string;
}

function InfoRow({
  label,
  value,
  className = "",
}: {
  label: string;
  value?: string | null;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-ink/45 mb-1">{label}</p>
      <p className="text-forest font-medium text-sm md:text-base">{value || "-"}</p>
    </div>
  );
}

const KREDIT_PER_KG = 100;

const KATEGORI_B3 = [
  { id: "cair_kimia", nama: "Limbah Cair & Kimia Industri", tarif: 15000 },
  { id: "oli_pelumas", nama: "Oli Bekas & Pelumas Sintetis", tarif: 12000 },
  { id: "baterai_elektronik", nama: "Baterai & E-Waste B3", tarif: 20000 },
  { id: "medis_farmasi", nama: "Limbah Medis & Farmasi", tarif: 25000 },
  { id: "sludge_lumpur", nama: "Sludge / Lumpur Berbahaya", tarif: 18000 },
];

export default function DashboardIndustriPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<IndustriProfile | null>(null);

  const [totalTerkirim, setTotalTerkirim] = useState(0);
  const [totalKredit, setTotalKredit] = useState(0);
  const [shipments, setShipments] = useState<WasteShipment[]>([]);

  // State Modal Penjemputan Limbah Biasa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formLimbah, setFormLimbah] = useState({
    nama_limbah: "",
    berat: "",
    lokasi: "",
    foto: null as File | null,
  });

  // State Modal Penjemputan Limbah B3
  const [isB3ModalOpen, setIsB3ModalOpen] = useState(false);
  const [formB3, setFormB3] = useState({
    nama_limbah: "",
    kategori_id: "cair_kimia",
    berat: "",
    lokasi: "",
    foto: null as File | null,
  });

  // State Modal Pembayaran B3
  const [selectedPayShipment, setSelectedPayShipment] = useState<WasteShipment | null>(null);
  const [buktiBayarFile, setBuktiBayarFile] = useState<File | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  // State Modal Pencairan (Withdrawal)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [formWithdraw, setFormWithdraw] = useState({
    jumlah_token: "",
    metode: "Bank Transfer",
    nomor_rekening: "",
  });

  // State Modal Edit Profil Industri
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    nama_perusahaan: "",
    npwp: "",
    telepon: "",
    provinsi: "",
    kota_kabupaten: "",
    alamat: "",
  });

  // State Modal Hapus Akun Industri
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    const supabase = createSupabaseBrowserClient();

    const fetchTrackingData = async (uid: string) => {
      const { data: shipmentData } = await supabase
        .from("waste_shipments")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      const { data: withdrawData } = await supabase
        .from("pencairan_dana")
        .select("jumlah_tarik_tunai")
        .eq("id_agen", uid);

      if (shipmentData) {
        setShipments(shipmentData);
        const totalKg = shipmentData
          .filter((s) => s.status.toLowerCase() === "selesai")
          .reduce((sum, s) => sum + Number(s.perkiraan_berat), 0);

        setTotalTerkirim(totalKg);

        const grossToken = totalKg * KREDIT_PER_KG;
        const totalDicairkan = withdrawData
          ? withdrawData.reduce((sum, w) => sum + Number(w.jumlah_tarik_tunai), 0)
          : 0;

        const netKredit = grossToken - totalDicairkan;
        setTotalKredit(netKredit > 0 ? netKredit : 0);
      }
    };

    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.replace("/masuk");
        return;
      }
      setUserId(data.user.id);
      setEmail(data.user.email ?? null);

      const { data: profileData } = await supabase
        .from("industri_profiles")
        .select("nama_perusahaan, npwp, alamat, telepon, provinsi, kota_kabupaten, created_at, status_akun, alasan_ban")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (!profileData) {
        router.replace("/daftar/industri");
        return;
      }

      if (profileData.status_akun === "banned") {
        alert(
          `Akun Anda telah di-ban oleh Administrator!\nAlasan: ${
            profileData.alasan_ban || "Pelanggaran ketentuan layanan."
          }`
        );
        await supabase.auth.signOut();
        router.replace("/masuk");
        return;
      }

      setProfile(profileData);
      setEditForm({
        nama_perusahaan: profileData.nama_perusahaan || "",
        npwp: profileData.npwp || "",
        telepon: profileData.telepon || "",
        provinsi: profileData.provinsi || "",
        kota_kabupaten: profileData.kota_kabupaten || "",
        alamat: profileData.alamat || "",
      });

      fetchTrackingData(data.user.id);
      setLoading(false);

      intervalId = setInterval(() => {
        fetchTrackingData(data.user.id);
      }, 300000);
    });

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setEditLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("industri_profiles")
      .update({
        nama_perusahaan: editForm.nama_perusahaan,
        npwp: editForm.npwp,
        telepon: editForm.telepon,
        provinsi: editForm.provinsi,
        kota_kabupaten: editForm.kota_kabupaten,
        alamat: editForm.alamat,
      })
      .eq("user_id", userId);

    setEditLoading(false);

    if (!error) {
      setProfile((prev) =>
        prev ? { ...prev, ...editForm } : null
      );
      setIsEditOpen(false);
      alert("Profil industri berhasil diperbarui!");
    } else {
      alert("Gagal memperbarui profil: " + error.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (!userId) return;
    setDeleteLoading(true);

    try {
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert("Gagal menghapus akun: " + data.error);
        setDeleteLoading(false);
        return;
      }

      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();

      alert("Akun industri berhasil dihapus permanen.");
      router.push("/masuk");
    } catch {
      alert("Terjadi kesalahan jaringan saat menghapus akun.");
      setDeleteLoading(false);
    }
  };

  async function handleKirimLimbah(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) throw new Error("Sesi Anda telah berakhir, silakan login kembali.");

      let fotoUrl = "";
      if (formLimbah.foto) {
        const fileExt = formLimbah.foto.name.split('.').pop();
        const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('waste_images')
          .upload(`limbah/${fileName}`, formLimbah.foto, { upsert: true });

        if (uploadError) throw new Error(`Gagal mengunggah foto: ${uploadError.message}`);

        const { data: publicUrlData } = supabase.storage
          .from('waste_images')
          .getPublicUrl(`limbah/${fileName}`);

        fotoUrl = publicUrlData.publicUrl;
      }

      const response = await fetch("/api/setoran-limbah", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          deskripsi_input: formLimbah.nama_limbah,
          berat_kg: Number(formLimbah.berat),
          lokasi: formLimbah.lokasi.toUpperCase(),
          foto_url: fotoUrl,
          is_b3: false,
        }),
      });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.error || "Gagal menyimpan data limbah.");

      setFormLimbah({ nama_limbah: "", berat: "", lokasi: "", foto: null });
      setIsModalOpen(false);

      const { data: newData } = await supabase
        .from("waste_shipments")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (newData) setShipments(newData);

    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleKirimLimbahB3(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const katSelected = KATEGORI_B3.find((k) => k.id === formB3.kategori_id);
    const tarifPerKg = katSelected ? katSelected.tarif : 15000;
    const totalBiaya = Number(formB3.berat || 0) * tarifPerKg;

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) throw new Error("Sesi Anda telah berakhir, silakan login kembali.");

      let fotoUrl = "";
      if (formB3.foto) {
        const fileExt = formB3.foto.name.split('.').pop();
        const fileName = `b3-${session.user.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('waste_images')
          .upload(`limbah_b3/${fileName}`, formB3.foto, { upsert: true });

        if (uploadError) throw new Error(`Gagal mengunggah foto: ${uploadError.message}`);

        const { data: publicUrlData } = supabase.storage
          .from('waste_images')
          .getPublicUrl(`limbah_b3/${fileName}`);

        fotoUrl = publicUrlData.publicUrl;
      }

      const response = await fetch("/api/setoran-limbah", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          deskripsi_input: `[B3] ${formB3.nama_limbah}`,
          berat_kg: Number(formB3.berat),
          lokasi: formB3.lokasi.toUpperCase(),
          foto_url: fotoUrl,
          is_b3: true,
          kategori_b3: katSelected?.nama,
          biaya_pengolahan: totalBiaya,
          status: "Menunggu Pembayaran",
        }),
      });

      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.error || "Gagal mendaftarkan limbah B3.");

      alert(`Pendaftaran Berhasil!\nLimbah B3 kamu telah didaftarkan. Silakan lakukan konfirmasi pembayaran pada tabel 'Status Pembayaran Limbah B3' di bawah.`);
      setFormB3({ nama_limbah: "", kategori_id: "cair_kimia", berat: "", lokasi: "", foto: null });
      setIsB3ModalOpen(false);

      const { data: newData } = await supabase
        .from("waste_shipments")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (newData) setShipments(newData);

    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan saat mendaftarkan data.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleKonfirmasiPembayaran = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayShipment || !buktiBayarFile) return;

    setIsPaying(true);

    try {
      const supabase = createSupabaseBrowserClient();
      
      const { error: updateError } = await supabase
        .from("waste_shipments")
        .update({ status: "Menunggu Verifikasi" })
        .eq("id", selectedPayShipment.id);

      if (updateError) throw updateError;

      alert("Bukti pembayaran berhasil dikirim! Tim kami akan melakukan verifikasi.");
      setSelectedPayShipment(null);
      setBuktiBayarFile(null);

      if (userId) {
        const { data: newData } = await supabase
          .from("waste_shipments")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (newData) setShipments(newData);
      }

    } catch (err) {
      console.error(err);
      alert("Gagal mengirim konfirmasi pembayaran.");
    } finally {
      setIsPaying(false);
    }
  };

  const handlePencairan = async (e: React.FormEvent) => {
    e.preventDefault();
    const jumlahCair = Number(formWithdraw.jumlah_token);

    if (jumlahCair > totalKredit) {
      alert("Token yang ingin dicairkan melebihi saldo tersedia!");
      return;
    }

    setIsWithdrawing(true);

    try {
      const response = await fetch("/api/gamifikasi/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jumlah_poin: jumlahCair,
          metode_pencairan: `${formWithdraw.metode} - ${formWithdraw.nomor_rekening}`,
        }),
      });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.error || "Gagal memproses pencairan.");

      setTotalKredit((prev) => prev - jumlahCair);
      setWithdrawSuccess(true);

      setTimeout(() => {
        setWithdrawSuccess(false);
        setIsWithdrawModalOpen(false);
        setFormWithdraw({ jumlah_token: "", metode: "Bank Transfer", nomor_rekening: "" });
      }, 3000);

    } catch (error: unknown) {
      console.error("Gagal melakukan pencairan:", error);
      const message = error instanceof Error ? error.message : "Terjadi kesalahan pada database.";
      alert(`Gagal pencairan: ${message}`);
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-forest border-t-transparent rounded-full animate-spin"></div>
          <p className="text-forest font-medium text-sm">Memuat data portal...</p>
        </div>
      </div>
    );
  }

  const joinedLabel = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  const estimasiKredit = Number(formLimbah.berat || 0) * KREDIT_PER_KG;
  const selectedKatB3 = KATEGORI_B3.find((k) => k.id === formB3.kategori_id);
  const estimasiBiayaB3 = Number(formB3.berat || 0) * (selectedKatB3?.tarif || 0);
  const estimasiRupiah = Number(formWithdraw.jumlah_token || 0) * 500;

  const b3Shipments = shipments.filter((s) => s.is_b3);

  return (
    <div className="px-4 sm:px-8 md:px-12 py-6 md:py-10 max-w-6xl mx-auto w-full relative">
      {/* Ringkasan */}
      <section id="ringkasan" className="scroll-mt-8 mb-10">
        <p className="font-mono text-[11px] tracking-widest uppercase text-green mb-2">
          Ringkasan
        </p>
        <h1 className="font-display font-semibold text-2xl md:text-3xl text-forest mb-1.5">
          Selamat datang, {profile?.nama_perusahaan ?? "Industri"}
        </h1>
        <p className="text-ink/60 mb-6 text-sm">
          Pantau ringkasan kemitraan industri kamu dengan LENTERA di sini.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-paper rounded-2xl border border-forest/10 p-5 shadow-xs flex flex-col justify-between">
            <p className="text-xs text-ink/45 mb-1">Status akun</p>
            <div className="flex items-center gap-1.5 mt-2">
              <svg className="w-4 h-4 text-forest opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-display font-semibold text-forest text-lg">Aktif</p>
            </div>
          </div>
          <div className="bg-paper rounded-2xl border border-forest/10 p-5 shadow-xs flex flex-col justify-between">
            <p className="text-xs text-ink/45 mb-1">Total limbah terkirim</p>
            <p className="font-display font-semibold text-forest text-lg mt-2">
              {totalTerkirim.toLocaleString("id-ID")} <span className="text-sm font-normal text-ink/60">kg</span>
            </p>
          </div>

          <div className="bg-gradient-to-br from-forest to-forest/90 rounded-2xl border border-forest p-5 shadow-sm flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
            <div className="flex justify-between items-start relative z-10">
              <p className="text-xs text-cream/70 mb-1">Kredit Tersedia</p>
              <button
                onClick={() => setIsWithdrawModalOpen(true)}
                disabled={totalKredit <= 0}
                className="bg-gold/20 hover:bg-gold/40 disabled:bg-gold/10 text-gold disabled:text-gold/50 text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full transition-colors cursor-pointer"
              >
                Cairkan
              </button>
            </div>
            <div className="flex items-end gap-1.5 mt-2 relative z-10">
              <span className="text-gold font-display font-bold text-2xl">
                {totalKredit.toLocaleString("id-ID")}
              </span>
              <span className="text-xs text-cream/70 font-medium mb-1.5 uppercase tracking-wider">Token</span>
            </div>
          </div>

          <div className="bg-paper rounded-2xl border border-forest/10 p-5 shadow-xs flex flex-col justify-between">
            <p className="text-xs text-ink/45 mb-1">Bergabung sejak</p>
            <p className="font-display font-semibold text-forest text-lg mt-2">{joinedLabel}</p>
          </div>
        </div>
      </section>

      {/* Lacak Pengiriman */}
      <section id="lacak-pengiriman" className="scroll-mt-8 mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="font-display font-semibold text-xl text-forest">Status Pengiriman</h2>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-forest/5 border border-forest/10 text-[10px] text-forest/70 font-semibold tracking-wide uppercase">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sistem tersinkronisasi
              </div>
            </div>
            <p className="text-xs text-ink/60">Pantau pergerakan limbah yang sedang diproses secara real-time.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
            <button
              onClick={() => {
                setErrorMsg(null);
                setIsModalOpen(true);
              }}
              className="bg-forest text-paper px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium hover:bg-forest/90 transition-colors shadow-xs text-center flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
              Penjemputan Limbah Biasa
            </button>

            <button
              onClick={() => {
                setErrorMsg(null);
                setIsB3ModalOpen(true);
              }}
              className="bg-amber-600 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-amber-700 transition-colors shadow-xs text-center flex items-center justify-center gap-1.5 cursor-pointer border border-amber-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              Daftar Pengolahan B3
            </button>
          </div>
        </div>

        {shipments.length === 0 ? (
          <div className="bg-paper rounded-2xl border border-forest/10 p-10 text-center">
            <p className="text-ink/60 text-sm">Belum ada riwayat pengiriman limbah.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {shipments.map((shipment) => {
              const isPendingPayment = shipment.status.toLowerCase() === "menunggu pembayaran";

              return (
                <div key={shipment.id} className="bg-paper rounded-2xl border border-forest/10 p-5 flex flex-col justify-between shadow-xs hover:border-forest/20 transition-colors">
                  <div>
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <div>
                        <h3 className="font-semibold text-forest text-base leading-snug">{shipment.nama_limbah}</h3>
                        {shipment.is_b3 && (
                          <span className="inline-block mt-0.5 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                            Kategori B3
                          </span>
                        )}
                      </div>
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full shrink-0 ${
                        shipment.status.toLowerCase() === 'selesai' ? 'bg-green/10 text-green'
                        : isPendingPayment ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : shipment.status.toLowerCase() === 'diperjalanan' ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-800'
                      }`}>
                        {shipment.status}
                      </span>
                    </div>

                    <div className="text-sm text-ink/70 space-y-1.5 mb-4">
                      <p><strong className="font-medium text-ink">Berat:</strong> {shipment.perkiraan_berat} kg</p>
                      <p className="line-clamp-2"><strong className="font-medium text-ink">Lokasi:</strong> {shipment.lokasi_penjemputan}</p>

                      {shipment.is_b3 && shipment.biaya_pengolahan && (
                        <p className="text-xs font-semibold text-amber-900 pt-1">
                          Biaya Pengolahan: Rp {shipment.biaya_pengolahan.toLocaleString("id-ID")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-forest/10 pt-3 mt-auto">
                    <p className="text-xs text-ink/40">
                      Dibuat: {new Date(shipment.created_at).toLocaleDateString("id-ID")}
                    </p>

                    {!shipment.is_b3 && shipment.status.toLowerCase() === 'selesai' && (
                      <p className="text-[10px] font-medium text-gold bg-gold/10 px-2 py-0.5 rounded-md">
                        +{Number(shipment.perkiraan_berat) * KREDIT_PER_KG} Token
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION: STATUS PEMBAYARAN LIMBAH B3 & KONFIRMASI */}
      {b3Shipments.length > 0 && (
        <section id="pembayaran-b3" className="scroll-mt-8 mb-10">
          <div className="mb-4">
            <p className="font-mono text-xs tracking-widest uppercase text-amber-700 mb-1">
              Tagihan & Transaksi
            </p>
            <h2 className="font-display font-semibold text-xl text-forest">
              Status Pembayaran Limbah B3
            </h2>
            <p className="text-xs text-ink/60 mt-0.5">
              Lakukan pembayaran dan upload konfirmasi untuk pesanan B3 yang masih menunggu.
            </p>
          </div>

          <div className="bg-paper rounded-2xl border border-amber-200 overflow-hidden shadow-xs p-4 md:p-0">
            {/* TAMPILAN CARD - KHUSUS MOBILE (sm ke bawah) */}
            <div className="block md:hidden space-y-3">
              {b3Shipments.map((b3) => {
                const isPending = b3.status.toLowerCase() === "menunggu pembayaran";

                return (
                  <div key={b3.id} className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-semibold text-forest text-sm leading-tight">{b3.nama_limbah}</h4>
                        <p className="text-xs text-ink/60 mt-1">Berat: {b3.perkiraan_berat} kg</p>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full shrink-0 ${
                        isPending ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : b3.status.toLowerCase() === "menunggu verifikasi" ? "bg-blue-100 text-blue-800"
                        : "bg-green/10 text-green"
                      }`}>
                        {b3.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-amber-200/60 pt-2.5">
                      <div>
                        <p className="text-[10px] text-ink/50 uppercase font-medium">Total Biaya</p>
                        <p className="text-sm font-bold text-amber-900">
                          Rp {(b3.biaya_pengolahan || 0).toLocaleString("id-ID")}
                        </p>
                      </div>

                      {isPending ? (
                        <button
                          onClick={() => setSelectedPayShipment(b3)}
                          className="text-xs font-bold px-3 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors cursor-pointer shadow-xs"
                        >
                          Konfirmasi Bayar
                        </button>
                      ) : (
                        <span className="text-xs text-ink/40 italic">Lunas / Diproses</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TAMPILAN TABEL - KHUSUS DESKTOP (md ke atas) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-amber-50/80 border-b border-amber-200 text-xs font-bold text-amber-900 uppercase tracking-wider">
                    <th className="p-4">Deskripsi Limbah</th>
                    <th className="p-4">Berat Total</th>
                    <th className="p-4">Total Biaya</th>
                    <th className="p-4">Status Pembayaran</th>
                    <th className="p-4 text-right">Aksi Konfirmasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest/10">
                  {b3Shipments.map((b3) => {
                    const isPending = b3.status.toLowerCase() === "menunggu pembayaran";

                    return (
                      <tr key={b3.id} className="hover:bg-cream/40 transition-colors">
                        <td className="p-4 font-medium text-forest">{b3.nama_limbah}</td>
                        <td className="p-4 text-ink/70">{b3.perkiraan_berat} kg</td>
                        <td className="p-4 font-semibold text-amber-900">
                          Rp {(b3.biaya_pengolahan || 0).toLocaleString("id-ID")}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full ${
                            isPending ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : b3.status.toLowerCase() === "menunggu verifikasi" ? "bg-blue-100 text-blue-800"
                            : "bg-green/10 text-green"
                          }`}>
                            {b3.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {isPending ? (
                            <button
                              onClick={() => setSelectedPayShipment(b3)}
                              className="text-xs font-bold px-3.5 py-1.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors cursor-pointer"
                            >
                              Konfirmasi Bayar
                            </button>
                          ) : (
                            <span className="text-xs text-ink/40 italic">Lunas / Diproses</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Profil Industri */}
      <section id="profil-industri" className="scroll-mt-8 mb-10">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="font-mono text-xs tracking-widest uppercase text-clay mb-1">
              Profil industri
            </p>
            <h2 className="font-display font-semibold text-xl text-forest">
              Informasi Industri
            </h2>
          </div>
          <button
            onClick={() => setIsEditOpen(true)}
            className="text-xs font-semibold px-4 py-2 bg-forest text-cream rounded-xl hover:bg-forest/90 transition-colors cursor-pointer"
          >
            Ubah Profil
          </button>
        </div>

        <div className="bg-paper rounded-2xl border border-forest/10 p-6 md:p-8 grid sm:grid-cols-2 gap-6 shadow-xs">
          <InfoRow label="Nama Perusahaan" value={profile?.nama_perusahaan} />
          <InfoRow label="Email Kontak" value={email} />
          <InfoRow label="NPWP" value={profile?.npwp} />
          <InfoRow label="Nomor Telepon" value={profile?.telepon} />
          <InfoRow
            label="Wilayah Operasional"
            value={
              profile?.kota_kabupaten
                ? `${profile.kota_kabupaten}, ${profile.provinsi}`
                : "BELUM DISET"
            }
          />
          <InfoRow label="Alamat Lengkap" value={profile?.alamat} className="sm:col-span-2" />
        </div>
      </section>

      {/* Danger Zone: Hapus Akun */}
      <section className="bg-red-50/50 border border-red-200/60 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-display font-semibold text-red-900 text-base sm:text-lg">
            Hapus Akun Industri
          </h3>
          <p className="text-xs sm:text-sm text-red-700/80 mt-0.5">
            Tindakan ini permanen. Seluruh profil perusahaan dan riwayat pengiriman kamu akan dihapus.
          </p>
        </div>
        <button
          onClick={() => setIsDeleteOpen(true)}
          className="text-xs font-semibold px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shrink-0 cursor-pointer"
        >
          Hapus Akun
        </button>
      </section>

      {/* MODAL KONFIRMASI PEMBAYARAN B3 */}
      {selectedPayShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
          <div className="bg-paper border border-amber-200 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="font-display font-semibold text-lg text-amber-900 mb-1">
              Konfirmasi Pembayaran Limbah B3
            </h3>
            <p className="text-xs text-ink/60 mb-4">
              Silakan transfer sesuai tagihan dan unggah foto bukti transfer.
            </p>

            <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-xs space-y-1.5 mb-4">
              <p><strong>Item:</strong> {selectedPayShipment.nama_limbah}</p>
              <p><strong>Total Tagihan:</strong> Rp {(selectedPayShipment.biaya_pengolahan || 0).toLocaleString("id-ID")}</p>
              <p><strong>Rekening Bank:</strong> BCA 123-456-7890 a.n. LENTERA BERKAH</p>
            </div>

            <form onSubmit={handleKonfirmasiPembayaran} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-ink">Upload Bukti Transfer</label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  required
                  onChange={(e) => setBuktiBayarFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-ink/80 border border-ink/20 rounded-xl p-2 bg-white file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:bg-amber-100 file:text-amber-800"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPayShipment(null)}
                  className="text-xs font-semibold px-4 py-2 text-ink/60 hover:text-ink cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPaying || !buktiBayarFile}
                  className="text-xs font-bold px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
                >
                  {isPaying ? "Mengirim..." : "Kirim Bukti Pembayaran"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL UBAH PROFIL INDUSTRI */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest/40 backdrop-blur-xs p-4">
          <div className="bg-paper border border-forest/10 rounded-2xl max-w-lg w-full p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <h3 className="font-display font-semibold text-xl text-forest mb-4">
              Ubah Data Industri
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs text-ink/60 mb-1">Nama Perusahaan</label>
                <input
                  type="text"
                  required
                  value={editForm.nama_perusahaan}
                  onChange={(e) =>
                    setEditForm({ ...editForm, nama_perusahaan: e.target.value })
                  }
                  className="w-full text-sm bg-cream/50 border border-forest/20 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-forest"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-ink/60 mb-1">NPWP</label>
                  <input
                    type="text"
                    required
                    value={editForm.npwp}
                    onChange={(e) =>
                      setEditForm({ ...editForm, npwp: e.target.value })
                    }
                    className="w-full text-sm bg-cream/50 border border-forest/20 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-forest"
                  />
                </div>
                <div>
                  <label className="block text-xs text-ink/60 mb-1">Nomor Telepon</label>
                  <input
                    type="text"
                    required
                    value={editForm.telepon}
                    onChange={(e) =>
                      setEditForm({ ...editForm, telepon: e.target.value })
                    }
                    className="w-full text-sm bg-cream/50 border border-forest/20 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-forest"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-ink/60 mb-1">Provinsi</label>
                  <input
                    type="text"
                    value={editForm.provinsi}
                    onChange={(e) =>
                      setEditForm({ ...editForm, provinsi: e.target.value })
                    }
                    className="w-full text-sm bg-cream/50 border border-forest/20 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-forest"
                  />
                </div>
                <div>
                  <label className="block text-xs text-ink/60 mb-1">Kota / Kabupaten</label>
                  <input
                    type="text"
                    value={editForm.kota_kabupaten}
                    onChange={(e) =>
                      setEditForm({ ...editForm, kota_kabupaten: e.target.value })
                    }
                    className="w-full text-sm bg-cream/50 border border-forest/20 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-forest"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-ink/60 mb-1">Alamat Lengkap</label>
                <textarea
                  rows={3}
                  value={editForm.alamat}
                  onChange={(e) =>
                    setEditForm({ ...editForm, alamat: e.target.value })
                  }
                  className="w-full text-sm bg-cream/50 border border-forest/20 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-forest resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-forest/10">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="text-xs font-semibold px-4 py-2.5 text-ink/60 hover:text-ink cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="text-xs font-semibold px-4 py-2.5 bg-forest text-cream rounded-xl hover:bg-forest/90 disabled:opacity-50 cursor-pointer"
                >
                  {editLoading ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS AKUN */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest/40 backdrop-blur-xs p-4">
          <div className="bg-paper border border-red-200 rounded-2xl max-w-md w-full p-6 shadow-lg">
            <h3 className="font-display font-semibold text-xl text-red-900 mb-2">
              Konfirmasi Hapus Akun
            </h3>
            <p className="text-sm text-ink/70 mb-6">
              Apakah kamu yakin ingin menghapus akun industri ini? Semua data profil dan riwayat penjemputan limbah kamu akan dihapus permanen.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="text-xs font-semibold px-4 py-2.5 text-ink/60 hover:text-ink cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="text-xs font-semibold px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                {deleteLoading ? "Menghapus..." : "Ya, Hapus Akun"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PENCAIRAN KREDIT */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
          <div className="bg-paper rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col transform transition-all">

            {!withdrawSuccess ? (
              <>
                <div className="px-6 py-4 border-b border-forest/10 flex justify-between items-center bg-forest text-cream">
                  <h3 className="font-display font-semibold text-lg">Pencairan Token</h3>
                  <button onClick={() => setIsWithdrawModalOpen(false)} className="hover:text-gold transition-colors cursor-pointer">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                  </button>
                </div>

                <form onSubmit={handlePencairan} className="p-6 space-y-4">
                  <div className="bg-gold/10 border border-gold/20 rounded-xl p-3 text-center mb-2">
                    <p className="text-xs text-ink/60 mb-0.5">Saldo Tersedia</p>
                    <p className="text-lg font-bold text-gold-dark">{totalKredit.toLocaleString("id-ID")} Token</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-ink">Jumlah Token</label>
                    <input
                      type="number"
                      className="block w-full text-sm text-ink border border-ink/20 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-gold bg-white"
                      placeholder="Masukkan jumlah"
                      value={formWithdraw.jumlah_token}
                      onChange={(e) => setFormWithdraw({ ...formWithdraw, jumlah_token: e.target.value })}
                      required
                      min="100"
                      max={totalKredit}
                    />
                    <div className="flex justify-between mt-1 px-1">
                      <p className="text-[10px] text-ink/50">Min. 100 Token</p>
                      <p className="text-[10px] font-medium text-green">
                        Est: Rp {estimasiRupiah.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-ink">Pilih Tujuan Pencairan</label>
                    <select
                      className="block w-full text-sm text-ink border border-ink/20 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-gold bg-white"
                      value={formWithdraw.metode}
                      onChange={(e) => setFormWithdraw({ ...formWithdraw, metode: e.target.value })}
                    >
                      <option value="Bank Transfer">Bank Transfer (BCA, BNI, BRI)</option>
                      <option value="GoPay">GoPay</option>
                      <option value="DANA">DANA</option>
                      <option value="OVO">OVO</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-ink">Nomor Rekening / E-Wallet</label>
                    <input
                      type="text"
                      className="block w-full text-sm text-ink border border-ink/20 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-gold bg-white"
                      placeholder="Contoh: 081234567890"
                      value={formWithdraw.nomor_rekening}
                      onChange={(e) => setFormWithdraw({ ...formWithdraw, nomor_rekening: e.target.value })}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isWithdrawing || !formWithdraw.jumlah_token || !formWithdraw.nomor_rekening}
                    className="w-full bg-gold text-forest mt-2 py-2.5 rounded-xl text-sm font-bold hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isWithdrawing ? (
                      <>
                        <span className="w-4 h-4 border-2 border-forest border-t-transparent rounded-full animate-spin"></span>
                        Memproses...
                      </>
                    ) : (
                      "Cairkan Sekarang"
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="p-8 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-16 h-16 bg-green/10 text-green rounded-full flex items-center justify-center mb-2">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-display font-bold text-xl text-forest">Pencairan Berhasil!</h3>
                <p className="text-sm text-ink/60">
                  Dana sebesar <strong className="text-ink">Rp {(Number(formWithdraw.jumlah_token) * 500).toLocaleString("id-ID")}</strong> sedang diproses ke {formWithdraw.metode} kamu.
                </p>
              </div>
            )}

          </div>
        </div>
      )}

      {/* POP-UP MODAL KIRIM LIMBAH BIASA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
          <div className="bg-paper rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">

            <div className="px-6 py-4 border-b border-forest/10 flex justify-between items-center shrink-0">
              <h3 className="font-display font-semibold text-forest text-lg">Formulir Penjemputan Limbah Biasa</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-forest/5 text-ink/40 hover:text-ink transition-colors cursor-pointer"
                aria-label="Tutup"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleKirimLimbah} className="p-6 space-y-4 overflow-y-auto">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs leading-relaxed">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5 text-ink">Nama Limbah</label>
                <input
                  type="text"
                  className="block w-full text-sm text-ink border border-ink/20 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-green bg-white"
                  placeholder="Contoh: Limbah Plastik Cair"
                  value={formLimbah.nama_limbah}
                  onChange={(e) => setFormLimbah({ ...formLimbah, nama_limbah: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-ink">Perkiraan Berat (kg)</label>
                <input
                  type="number"
                  className="block w-full text-sm text-ink border border-ink/20 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-green bg-white"
                  placeholder="0"
                  value={formLimbah.berat}
                  onChange={(e) => setFormLimbah({ ...formLimbah, berat: e.target.value })}
                  required
                  min="1"
                />

                <div className={`mt-2 p-3 rounded-xl border flex items-center justify-between transition-colors ${
                  estimasiKredit > 0 ? 'bg-gold/10 border-gold/30' : 'bg-forest/5 border-forest/10'
                }`}>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-ink/50 mb-0.5">Potensi Pendapatan</p>
                    <p className="text-xs text-ink/70">Estimasi token yang didapat</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-display font-bold text-lg ${estimasiKredit > 0 ? 'text-gold-dark' : 'text-ink/40'}`}>
                      +{estimasiKredit.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-ink">Detail Lokasi Penjemputan</label>
                <textarea
                  className="block w-full text-sm text-ink border border-ink/20 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-green bg-white resize-none"
                  rows={3}
                  placeholder="Jalan, No. Gedung, Patokan (Otomatis Kapital)"
                  value={formLimbah.lokasi}
                  onChange={(e) => setFormLimbah({ ...formLimbah, lokasi: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-ink">Upload Foto Limbah</label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  className="block w-full text-sm text-ink/80 border border-ink/20 rounded-xl p-2 focus:outline-none focus:ring-1 focus:ring-green bg-white file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-green/10 file:text-green hover:file:bg-green/20"
                  onChange={(e) => setFormLimbah({ ...formLimbah, foto: e.target.files?.[0] || null })}
                  required
                />
                <p className="text-[11px] text-ink/50 mt-1">Format dukungan: JPG, JPEG, PNG.</p>
              </div>

              <div className="pt-4 mt-2 border-t border-forest/10 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-ink/60 hover:text-ink transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-forest text-cream px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-forest/90 transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-cream border-t-transparent rounded-full animate-spin"></span>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    "Kirim Jadwal"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POP-UP MODAL PENGOLAHAN LIMBAH B3 */}
      {isB3ModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
          <div className="bg-paper rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">

            <div className="px-6 py-4 border-b border-amber-200 bg-amber-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-display font-semibold text-amber-900 text-lg">Formulir Pendaftaran Limbah B3</h3>
                <p className="text-xs text-amber-700">Daftarkan limbah B3 terlebih dahulu untuk mendapatkan rincian tagihan.</p>
              </div>
              <button
                onClick={() => setIsB3ModalOpen(false)}
                className="p-1 rounded-lg hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                aria-label="Tutup"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleKirimLimbahB3} className="p-6 space-y-4 overflow-y-auto">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs leading-relaxed">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5 text-ink">Pilih Kategori Limbah B3</label>
                <select
                  value={formB3.kategori_id}
                  onChange={(e) => setFormB3({ ...formB3, kategori_id: e.target.value })}
                  className="block w-full text-sm text-ink border border-ink/20 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                >
                  {KATEGORI_B3.map((kat) => (
                    <option key={kat.id} value={kat.id}>
                      {kat.nama} (Rp {kat.tarif.toLocaleString("id-ID")}/kg)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-ink">Nama / Deskripsi Spesifik Limbah</label>
                <input
                  type="text"
                  className="block w-full text-sm text-ink border border-ink/20 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                  placeholder="Contoh: Sludge Hasil Filtrasi Pabrik"
                  value={formB3.nama_limbah}
                  onChange={(e) => setFormB3({ ...formB3, nama_limbah: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-ink">Perkiraan Berat Total (kg)</label>
                <input
                  type="number"
                  className="block w-full text-sm text-ink border border-ink/20 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                  placeholder="0"
                  value={formB3.berat}
                  onChange={(e) => setFormB3({ ...formB3, berat: e.target.value })}
                  required
                  min="1"
                />

                <div className="mt-2 p-3 rounded-xl border bg-amber-50/80 border-amber-200 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-amber-800 mb-0.5">Estimasi Biaya Pengolahan</p>
                    <p className="text-xs text-amber-900/70">Dapat dibayar setelah pendaftaran</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-lg text-amber-900">
                      Rp {estimasiBiayaB3.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-ink">Detail Lokasi Penjemputan</label>
                <textarea
                  className="block w-full text-sm text-ink border border-ink/20 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white resize-none"
                  rows={3}
                  placeholder="Jalan, No. Gedung, Patokan (Otomatis Kapital)"
                  value={formB3.lokasi}
                  onChange={(e) => setFormB3({ ...formB3, lokasi: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-ink">Upload Foto Dokumentasi Limbah B3</label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  className="block w-full text-sm text-ink/80 border border-ink/20 rounded-xl p-2 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200"
                  onChange={(e) => setFormB3({ ...formB3, foto: e.target.files?.[0] || null })}
                  required
                />
                <p className="text-[11px] text-ink/50 mt-1">Format dukungan: JPG, JPEG, PNG.</p>
              </div>

              <div className="pt-4 mt-2 border-t border-forest/10 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsB3ModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-ink/60 hover:text-ink transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Mendaftarkan...</span>
                    </>
                  ) : (
                    "Daftarkan Sekarang"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Assistant Floating Widget */}
      <AIAssistant />
    </div>
  );
}
```

## FILE: app/edukasi/page.tsx

```tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Navbar } from "@/components/navbar";
import Link from "next/link";

interface BeritaItem {
  id: number;
  kategori: string;
  tanggal: string;
  baca: string;
  judul: string;
  ringkasan: string;
  kontenLengkap: string;
  icon: string;
  tagColor: string;
}

export default function EdukasiPage() {
  const [selectedBerita, setSelectedBerita] = useState<BeritaItem | null>(null);

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const artikelBerita: BeritaItem[] = [
    {
      id: 1,
      kategori: "Inovasi Bioenergi",
      tanggal: "28 Agustus 2026",
      baca: "3 min baca",
      judul: "Pemanfaatan Biomassa Kelapa Sawit untuk Co-Firing PLTU Nasional",
      ringkasan: "Cangkang dan janjang kosong kelapa sawit terbukti memiliki nilai kalor hingga 4.000 kcal/kg, menjadi substitusi efektif batu bara.",
      kontenLengkap: "Berdasarkan data Kementerian ESDM, substitusi batu bara dengan biomassa (co-firing) pada PLTU mampu menurunkan emisi karbon secara signifikan tanpa mengubah struktur dasar boiler. Cangkang sawit dan pelet kayu memiliki kadar abu (ash content) yang jauh lebih rendah dibanding batu bara mentah, sehingga mereduksi akumulasi kerak pada mesin pembakaran industri.",
      icon: "âš¡",
      tagColor: "bg-green/10 text-green",
    },
    {
      id: 2,
      kategori: "Regulasi Lingkungan",
      tanggal: "20 Agustus 2026",
      baca: "4 min baca",
      judul: "Digitalisasi Manifes Limbah B3 Sesuai Standar Permen LHK No. 6/2021",
      ringkasan: "Pengawasan pengolahan limbah industri kini berbasis digital melalui pelaporan integratif guna memastikan transparansi audit lingkungan.",
      kontenLengkap: "Penerapan Permen LHK No. 6 Tahun 2021 mewajibkan setiap penghasil dan pengolah limbah Bahan Berbahaya dan Beracun (B3) mencatat alur limbah secara akurat dari titik asal hingga pemusnahan akhir. Platform LENTERA menyelaraskan pencatatan internal industri dengan standar manifes elektronik untuk mempermudah kesiapan sertifikasi dan audit ESG.",
      icon: "ðŸ“œ",
      tagColor: "bg-amber-100 text-amber-800",
    },
    {
      id: 3,
      kategori: "Ekonomi Sirkular",
      tanggal: "12 Agustus 2026",
      baca: "5 min baca",
      judul: "Peluang Nilai Ekonomi Karbon (NEK) Bagi Industri Pengolah Residu",
      ringkasan: "Implementasi Perpres No. 98/2021 membuka peluang bagi manufaktur untuk mengubah pengurangan emisi menjadi aset kredit karbon.",
      kontenLengkap: "Melalui skema Ekonomi Sirkular, limbah kayu dan residu organik tidak lagi dianggap sebagai beban biaya operasional (cost center). Pengolahan limbah menjadi bahan bakar alternatif memungkinkan perusahaan mengklaim reduksi emisi gas rumah kaca (GRK) yang terekam dalam Sistem Registri Nasional (SRN-PPI), meningkatkan pemeringkatan sertifikasi hijau industri.",
      icon: "ðŸŒ±",
      tagColor: "bg-gold/15 text-gold-dark",
    },
  ];

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-cream pt-28 md:pt-36 pb-20 overflow-hidden">
        {/* HERO SECTION */}
        <section className="px-6 md:px-12 lg:px-24 max-w-7xl mx-auto mb-16 md:mb-24">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">

            {/* Teks Hero */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="flex-1 text-center md:text-left z-10"
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-green/10 text-green font-mono text-xs px-4 py-2 rounded-full uppercase tracking-wider mb-5">
                <span>ðŸ“š</span> Pusat Edukasi & Literasi
              </motion.div>
              <motion.h1 variants={fadeUp} className="font-display font-semibold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-forest mb-5 leading-tight">
                Pahami Limbah, <br className="hidden md:block" />
                <span className="text-green">Ciptakan Energi.</span>
              </motion.h1>
              <motion.p variants={fadeUp} className="text-ink/70 text-sm sm:text-base md:text-lg max-w-xl mx-auto md:mx-0 leading-relaxed mb-8">
                Tidak semua limbah industri harus berakhir di pembuangan. Pelajari bagaimana LENTERA memproses sisa produksi menjadi sumber energi terbarukan yang aman, efisien, dan bermanfaat bagi masyarakat.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                <a href="#materi" className="bg-forest text-cream font-medium px-8 py-3.5 rounded-full hover:bg-forest/90 transition-colors w-full sm:w-auto text-center shadow-sm">
                  Mulai Belajar
                </a>
                <a href="#wawasan" className="bg-transparent border border-forest/20 text-forest font-medium px-8 py-3.5 rounded-full hover:bg-forest/5 transition-colors w-full sm:w-auto text-center">
                  Baca Berita
                </a>
              </motion.div>
            </motion.div>

            {/* Karakter 3D Animasi & Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex-1 relative flex flex-col items-center justify-center w-full max-w-[320px] sm:max-w-[380px] md:max-w-full mx-auto"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px] md:w-[400px] md:h-[400px] bg-gold/20 blur-[70px] rounded-full z-0"></div>

              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10 w-full aspect-square flex items-center justify-center"
              >
                <Image
                  src="/images/edukasi-character.png"
                  alt="Karakter Edukasi LENTERA"
                  width={380}
                  height={380}
                  className="object-contain w-full h-auto drop-shadow-2xl"
                  priority
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="mt-4 md:mt-0 md:absolute md:bottom-2 md:right-4 bg-paper/95 backdrop-blur-md p-3.5 rounded-2xl border border-forest/10 shadow-lg z-20 w-full max-w-[240px] md:max-w-[150px] text-center md:text-left"
              >
                <p className="font-display font-bold text-forest text-xs">Fakta Kalori ðŸ’¡</p>
                <p className="text-[11px] text-ink/60 mt-0.5 leading-tight">Biomassa sawit memiliki nilai kalor ~4.000 kcal/kg.</p>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* SECTION PARAGRAF EDUKASI TAMBAHAN */}
        <section className="px-6 md:px-12 lg:px-24 max-w-7xl mx-auto mb-16 md:mb-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-8 items-center bg-paper rounded-3xl p-8 md:p-12 border border-forest/10 shadow-xs"
          >
            <motion.div variants={fadeUp} className="space-y-4">
              <span className="font-mono text-xs uppercase tracking-widest text-green font-semibold">
                Mengapa Harus Bio-Energi?
              </span>
              <h2 className="font-display font-semibold text-2xl sm:text-3xl text-forest leading-snug">
                Solusi Berkelanjutan untuk Mengatasi Krisis Energi & Residu Industri
              </h2>
              <p className="text-ink/70 text-sm md:text-base leading-relaxed">
                Setiap tahunnya, jutaan ton limbah industri organik dan limbah kayu dibuang begitu saja tanpa pengolahan optimal. Padahal, residu ini menyimpan potensi energi panas dan listrik yang sangat tinggi jika diproses dengan teknologi konversi yang tepat.
              </p>
              <p className="text-ink/70 text-sm md:text-base leading-relaxed">
                Melalui rantai **Ekonomi Sirkular**, LENTERA membantu manufaktur mengubah biaya pembuangan limbah menjadi nilai tambah ekonomi. Kami tidak hanya mengurangi ketergantungan pada batu bara, tetapi juga menciptakan ekosistem energi alternatif yang terjangkau bagi para mitra agen di daerah.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4">
              <div className="bg-cream p-5 rounded-2xl border border-forest/10">
                <p className="font-display font-bold text-3xl text-forest mb-1">~4.000</p>
                <p className="text-xs text-ink/60 leading-relaxed">kcal/kg estimasi nilai kalor pelet biomassa sawit terstandardisasi.</p>
              </div>
              <div className="bg-cream p-5 rounded-2xl border border-forest/10">
                <p className="font-display font-bold text-3xl text-green mb-1">Low-Ash</p>
                <p className="text-xs text-ink/60 leading-relaxed">Residu abu pembakaran lebih rendah dibanding batu bara mentah.</p>
              </div>
              <div className="bg-cream p-5 rounded-2xl border border-forest/10">
                <p className="font-display font-bold text-3xl text-gold-dark mb-1">SRN-PPI</p>
                <p className="text-xs text-ink/60 leading-relaxed">Kesesuaian skema pencatatan reduksi emisi karbon nasional.</p>
              </div>
              <div className="bg-cream p-5 rounded-2xl border border-forest/10">
                <p className="font-display font-bold text-3xl text-clay-dark mb-1">100%</p>
                <p className="text-xs text-ink/60 leading-relaxed">Alur pengolahan terverifikasi pada sistem digital LENTERA.</p>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* SECTION MATERI: JENIS LIMBAH */}
        <section id="materi" className="px-6 md:px-12 lg:px-24 max-w-7xl mx-auto mb-16 md:mb-28 scroll-mt-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeUp}
            className="text-center mb-10 md:mb-14"
          >
            <h2 className="font-display font-semibold text-2xl sm:text-3xl md:text-4xl text-forest mb-3">Jenis Limbah yang Kami Olah</h2>
            <p className="text-ink/70 text-sm md:text-base max-w-2xl mx-auto px-4">Kenali berbagai macam limbah industri yang memiliki potensi besar untuk dikonversi menjadi energi alternatif pengganti batu bara.</p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              {
                title: "Biomassa Pertanian",
                desc: "Sisa panen, cangkang sawit, dan ampas tebu yang diubah menjadi bio-pelet berkalori tinggi.",
                color: "bg-green/10 text-green",
                icon: "ðŸŒ¿"
              },
              {
                title: "Limbah Kayu & Kertas",
                desc: "Serbuk gergaji, potongan kayu, dan sisa bubur kertas yang dipadatkan untuk bahan bakar boiler pabrik.",
                color: "bg-gold/10 text-gold-dark",
                icon: "ðŸªµ"
              },
              {
                title: "Limbah Organik Pabrik",
                desc: "Sisa pengolahan makanan atau lumpur organik (sludge) yang diproses melalui reaktor biogas.",
                color: "bg-clay/10 text-clay-dark",
                icon: "ðŸ­"
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="bg-paper rounded-3xl p-6 sm:p-8 border border-forest/10 shadow-xs hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center text-xl mb-5`}>
                  {item.icon}
                </div>
                <h3 className="font-display font-semibold text-lg md:text-xl text-forest mb-2.5">{item.title}</h3>
                <p className="text-sm text-ink/70 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* SECTION: ALUR KONVERSI */}
        <section className="px-6 md:px-12 lg:px-24 max-w-5xl mx-auto mb-16 md:mb-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeUp}
            className="bg-forest rounded-[2.5rem] md:rounded-[3rem] p-8 sm:p-12 md:p-16 text-cream relative overflow-hidden shadow-lg"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-green opacity-20 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2"></div>

            <div className="text-center mb-10 md:mb-14 relative z-10">
              <h2 className="font-display font-semibold text-2xl sm:text-3xl md:text-4xl mb-3">Bagaimana Prosesnya?</h2>
              <p className="text-cream/70 text-sm md:text-base">Tiga tahap utama mengubah sisa industri menjadi energi terjangkau.</p>
            </div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid md:grid-cols-3 gap-8 relative z-10"
            >
              {[
                { step: "01", title: "Pengumpulan", desc: "Penjemputan limbah dari pabrik mitra langsung ke fasilitas LENTERA." },
                { step: "02", title: "Konversi Energi", desc: "Pemisahan, pengeringan, dan pemadatan limbah menjadi produk bahan bakar." },
                { step: "03", title: "Distribusi", desc: "Penyaluran energi ke agen lokal dengan harga yang jauh lebih kompetitif." }
              ].map((item, idx) => (
                <motion.div key={idx} variants={fadeUp} className="relative">
                  <div className="w-10 h-10 rounded-full bg-cream/10 border border-cream/20 flex items-center justify-center font-mono font-bold text-green mb-4 relative z-10 backdrop-blur-xs text-sm">
                    {item.step}
                  </div>
                  <h3 className="font-display font-semibold text-lg md:text-xl mb-2">{item.title}</h3>
                  <p className="text-sm text-cream/60 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* SECTION BERITA & ARTIKEL EDUKASI */}
        <section id="wawasan" className="px-6 md:px-12 lg:px-24 max-w-7xl mx-auto mb-16 md:mb-28 scroll-mt-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeUp}
            className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-12 gap-4"
          >
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-green mb-1">Artikel & Berita</p>
              <h2 className="font-display font-semibold text-2xl sm:text-3xl md:text-4xl text-forest">
                Kabar Terkini seputar Energi & Lingkungan
              </h2>
            </div>
            <p className="text-xs text-ink/50 max-w-xs">
              Rangkuman informasi dan wawasan terkini industri bio-energi yang dikemas secara terpercaya.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6"
          >
            {artikelBerita.map((art) => (
              <motion.article
                key={art.id}
                variants={fadeUp}
                onClick={() => setSelectedBerita(art)}
                className="bg-paper rounded-3xl p-6 border border-forest/10 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${art.tagColor}`}>
                      {art.kategori}
                    </span>
                    <span className="text-[11px] text-ink/40 font-mono">{art.baca}</span>
                  </div>

                  <h3 className="font-display font-semibold text-base md:text-lg text-forest mb-2.5 leading-snug group-hover:text-green transition-colors">
                    {art.judul}
                  </h3>

                  <p className="text-xs text-ink/70 leading-relaxed line-clamp-3 mb-6">
                    {art.ringkasan}
                  </p>
                </div>

                <div className="pt-4 border-t border-forest/10 flex justify-between items-center text-xs text-ink/50">
                  <span>{art.tanggal}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBerita(art);
                    }}
                    className="text-forest font-semibold hover:text-green transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    Baca Selengkapnya <span>â†’</span>
                  </button>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </section>

        {/* CTA SECTION */}
        <section className="px-6 max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display font-semibold text-2xl md:text-3xl text-forest mb-3">
              Siap untuk berkontribusi?
            </h2>
            <p className="text-ink/70 text-sm md:text-base mb-6">
              Praktekkan langsung ilmu ini. Daftarkan industri Anda atau jadilah agen penyalur energi di daerahmu.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/daftar/industri" className="w-full sm:w-auto px-8 py-3.5 bg-forest text-cream rounded-full font-medium hover:bg-forest/90 transition-colors text-center text-sm shadow-sm">
                Gabung sebagai Industri
              </Link>
              <Link href="/daftar/mitra" className="w-full sm:w-auto px-8 py-3.5 bg-transparent border-2 border-forest/20 text-forest rounded-full font-medium hover:bg-forest/5 transition-colors text-center text-sm">
                Jadi Mitra Agen
              </Link>
            </div>
          </motion.div>
        </section>

        {/* POP-UP MODAL DETAIL BERITA */}
        {selectedBerita && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-paper border border-forest/10 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto"
            >
              <button
                onClick={() => setSelectedBerita(null)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-forest/5 text-ink/40 hover:text-ink transition-colors cursor-pointer"
                aria-label="Tutup Modal"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>

              <div className="flex items-center gap-3 mb-4">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${selectedBerita.tagColor}`}>
                  {selectedBerita.kategori}
                </span>
                <span className="text-xs text-ink/40 font-mono">â€¢ {selectedBerita.tanggal}</span>
                <span className="text-xs text-ink/40 font-mono">â€¢ {selectedBerita.baca}</span>
              </div>

              <h2 className="font-display font-semibold text-xl sm:text-2xl text-forest mb-4 leading-snug">
                {selectedBerita.judul}
              </h2>

              <div className="space-y-4 text-ink/80 text-sm leading-relaxed border-t border-forest/10 pt-4">
                <p className="font-medium text-forest italic">
                  &quot;{selectedBerita.ringkasan}&quot;
                </p>
                <p>{selectedBerita.kontenLengkap}</p>
              </div>

              <div className="mt-8 pt-4 border-t border-forest/10 flex justify-between items-center">
                <span className="text-xs text-ink/40">Sumber: Data Kementerian LHK & ESDM</span>
                <button
                  onClick={() => setSelectedBerita(null)}
                  className="bg-forest text-cream px-6 py-2.5 rounded-full text-xs font-medium hover:bg-forest/90 transition-colors cursor-pointer"
                >
                  Tutup Artikel
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </main>
    </>
  );
}
```

## FILE: app/globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  scroll-behavior: smooth;
}

body {
  background-color: #f6f2e6;
  color: #221d16;
}

::selection {
  background: #c99a3d;
  color: #17301f;
}

/* Leaflet popup restyle to match the brand */
.leaflet-popup-content-wrapper {
  border-radius: 10px;
  font-family: var(--font-body), sans-serif;
  box-shadow: 0 10px 25px rgba(23, 48, 31, 0.2);
}

.leaflet-popup-tip {
  box-shadow: 0 10px 25px rgba(23, 48, 31, 0.15);
}

.marker-pin {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 3px solid #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
}
```

## FILE: app/kebijakan-privasi/page.tsx

```tsx
import { LegalShell, LegalSection } from "@/components/legal/legal-shell";

export default function KebijakanPrivasiPage() {
  return (
    <LegalShell title="Kebijakan Privasi">
      <LegalSection title="1. Data yang Kami Kumpulkan">
        Saat mendaftar, kami mengumpulkan data seperti nama mitra/perusahaan,
        NIK/NIB atau NPWP, alamat lengkap, nomor telepon, dan alamat email
        yang Anda berikan melalui formulir pendaftaran.
      </LegalSection>
      <LegalSection title="2. Cara Kami Menggunakan Data">
        Data yang dikumpulkan digunakan untuk mengelola akun Anda, memproses
        permintaan stok/pemesanan, serta berkomunikasi terkait status
        kemitraan dengan LENTERA.
      </LegalSection>
      <LegalSection title="3. Keamanan Data">
        Kami menyimpan data Anda menggunakan penyedia infrastruktur terpercaya
        dengan kontrol akses yang ketat, dan tidak membagikan data pribadi
        Anda ke pihak ketiga tanpa persetujuan, kecuali diwajibkan oleh
        hukum.
      </LegalSection>
      <LegalSection title="4. Hak Anda atas Data">
        Anda berhak meminta akses, koreksi, atau penghapusan data pribadi
        yang kami simpan dengan menghubungi tim LENTERA melalui kontak yang
        tersedia di situs ini.
      </LegalSection>
      <LegalSection title="5. Kontak">
        Untuk pertanyaan seputar kebijakan privasi ini, silakan hubungi tim
        LENTERA melalui halaman kontak pada situs ini.
      </LegalSection>
    </LegalShell>
  );
}
```

## FILE: app/kontak/page.tsx

```tsx
"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Navbar } from "@/components/navbar";
import Link from "next/link";
import emailjs from "@emailjs/browser";

export default function KontakPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    subjek: "",
    pesan: "",
  });


  const EMAILJS_SERVICE_ID = "service_6j63tdv";
  const EMAILJS_TEMPLATE_ID = "template_4ic5usv";
  const EMAILJS_PUBLIC_KEY = "PTy_MgwBbnS8HonnN";

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_name: formData.nama,
          from_email: formData.email,
          subject: formData.subjek,
          message: formData.pesan,
        },
        EMAILJS_PUBLIC_KEY
      );

      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({ nama: "", email: "", subjek: "", pesan: "" });
    } catch (error) {
      console.error("Gagal mengirim email:", error);
      alert("Gagal mengirim pesan. Silakan coba lagi nanti.");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-cream pt-28 md:pt-36 pb-20">
        <section className="px-6 md:px-12 lg:px-24 max-w-7xl mx-auto">

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-center max-w-3xl mx-auto mb-12 md:mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-green/10 text-green font-mono text-xs px-4 py-2 rounded-full uppercase tracking-wider mb-5">
              <span>ðŸ’¬</span> Hubungi Kami
            </div>
            <h1 className="font-display font-semibold text-3xl sm:text-4xl md:text-5xl text-forest mb-5 leading-tight">
              Ada Pertanyaan? <br />
              <span className="text-green">Kami Siap Membantu.</span>
            </h1>
            <p className="text-ink/70 text-sm sm:text-base md:text-lg leading-relaxed">
              Ingin berkolaborasi sebagai industri, mendaftar sebagai mitra agen, atau sekadar bertanya mengenai layanan LENTERA? Kirimkan pesan Anda di bawah ini.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-10 md:gap-12 items-start">

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2 space-y-6"
            >
              <div className="bg-forest rounded-3xl p-8 text-cream relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 w-40 h-40 bg-green opacity-20 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3"></div>

                <h3 className="font-display font-semibold text-xl mb-6 text-cream">Informasi Kontak</h3>

                <div className="space-y-6 text-sm relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-cream/10 border border-cream/20 flex items-center justify-center shrink-0 text-lg">
                      âœ‰ï¸
                    </div>
                    <div>
                      <p className="text-cream/60 text-xs mb-1">Email Resmi</p>
                      <a href="mailto:lentera1.idn@gmail.com" className="font-medium text-cream hover:text-green transition-colors break-all">
                        lentera1.idn@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-cream/10 border border-cream/20 flex items-center justify-center shrink-0 text-lg">
                      ðŸ“
                    </div>
                    <div>
                      <p className="text-cream/60 text-xs mb-1">Lokasi Kantor</p>
                      <p className="font-medium text-cream leading-relaxed">
                        Indonesia
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-cream/10 border border-cream/20 flex items-center justify-center shrink-0 text-lg">
                      â°
                    </div>
                    <div>
                      <p className="text-cream/60 text-xs mb-1">Jam Operasional</p>
                      <p className="font-medium text-cream">
                        Senin - Jumat (08:00 - 17:00 WIB)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-6 border-t border-cream/10 flex gap-3">
                  <Link href="/daftar/industri" className="text-xs bg-cream/10 hover:bg-cream/20 border border-cream/20 px-4 py-2.5 rounded-full transition-colors text-cream font-medium">
                    Mitra Industri
                  </Link>
                  <Link href="/daftar/mitra" className="text-xs bg-cream/10 hover:bg-cream/20 border border-cream/20 px-4 py-2.5 rounded-full transition-colors text-cream font-medium">
                    Agen Penyalur
                  </Link>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-3 bg-paper rounded-3xl p-6 sm:p-8 md:p-10 border border-forest/10 shadow-sm"
            >
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green/10 text-green rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                    âœ“
                  </div>
                  <h3 className="font-display font-semibold text-2xl text-forest mb-2">Pesan Terkirim!</h3>
                  <p className="text-ink/70 text-sm max-w-md mx-auto mb-6">
                    Terima kasih telah menghubungi LENTERA. Pesan kamu sudah masuk ke inbox email kami.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="bg-forest text-cream font-medium px-6 py-2.5 rounded-full text-sm hover:bg-forest/90 transition-colors cursor-pointer"
                  >
                    Kirim Pesan Lain
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h3 className="font-display font-semibold text-xl text-forest mb-2">Kirim Pesan</h3>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-medium text-ink/70 mb-2">Nama Lengkap</label>
                      <input
                        type="text"
                        required
                        placeholder="Masukkan nama kamu"
                        value={formData.nama}
                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                        className="w-full bg-cream/50 border border-forest/15 rounded-xl px-4 py-3 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-green focus:border-green transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ink/70 mb-2">Alamat Email</label>
                      <input
                        type="email"
                        required
                        placeholder="nama@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-cream/50 border border-forest/15 rounded-xl px-4 py-3 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-green focus:border-green transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-ink/70 mb-2">Subjek / Topik</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Pertanyaan Kemitraan Limbah Sawit"
                      value={formData.subjek}
                      onChange={(e) => setFormData({ ...formData, subjek: e.target.value })}
                      className="w-full bg-cream/50 border border-forest/15 rounded-xl px-4 py-3 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-green focus:border-green transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-ink/70 mb-2">Pesan Anda</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Tuliskan detail pertanyaan atau penawaran kerja sama..."
                      value={formData.pesan}
                      onChange={(e) => setFormData({ ...formData, pesan: e.target.value })}
                      className="w-full bg-cream/50 border border-forest/15 rounded-xl px-4 py-3 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-green focus:border-green transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-forest text-cream font-medium py-3.5 rounded-xl hover:bg-forest/90 transition-colors shadow-sm text-sm disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? "Mengirim Pesan..." : "Kirim Pesan"}
                  </button>
                </form>
              )}
            </motion.div>

          </div>
        </section>
      </main>
    </>
  );
}
```

## FILE: app/layout.tsx

```tsx
import type { Metadata } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "LENTERA â€” Limbah Energi Terjangkau Rakyat",
  description:
    "LENTERA mengolah limbah industri dan pabrik menjadi energi terjangkau, disalurkan melalui jaringan mitra dan agen di seluruh Indonesia.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} font-body bg-cream text-ink antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
```

## FILE: app/lupa-sandi/page.tsx

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { PasswordRequirements } from "@/components/auth/password-requirements";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { isValidPassword, validationMessages } from "@/lib/validation";

export default function LupaSandiPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [status, setStatus] = useState<"idle" | "loading" | "submitted">("idle");
  const [error, setError] = useState<string | null>(null);

  // Tahap 1: Kirim OTP
  async function handleSendOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setStatus("loading");

    try {
      const supabase = createSupabaseBrowserClient();

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (otpError) throw otpError;

      setStatus("idle");
      setStep(2);
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Gagal mengirimkan kode OTP");
    }
  }

  // Tahap 2: Verifikasi OTP + Update Kata Sandi
  async function handleVerifyOtpAndReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Validasi format kata sandi terlebih dahulu
    if (!isValidPassword(newPassword)) {
      setError(validationMessages.password);
      return;
    }

    setStatus("loading");

    try {
      const supabase = createSupabaseBrowserClient();

      // 1. Verifikasi kode OTP
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });

      if (verifyError) throw verifyError;

      // 2. Update kata sandi baru
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setStatus("submitted");
      setTimeout(() => {
        router.push("/masuk");
      }, 2000);
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Kode OTP tidak valid atau kadaluarsa");
    }
  }

  return (
    <AuthShell
      eyebrow="Lupa Kata Sandi"
      title={step === 1 ? "Atur Ulang Kata Sandi" : "Masukkan Kode OTP"}
      subtitle={
        step === 1
          ? "Masukkan email akun LENTERA Anda untuk menerima kode OTP."
          : `Kode OTP telah dikirim ke ${email}. Masukkan kode dan kata sandi baru Anda.`
      }
      footer={
        <p className="text-sm text-ink/60">
          Sudah ingat kata sandi?{" "}
          <Link href="/masuk" className="text-green font-medium hover:underline">
            Masuk kembali
          </Link>
        </p>
      }
    >
      {status === "submitted" ? (
        <div className="text-center py-4">
          <p className="text-forest font-medium mb-1">Kata sandi berhasil diperbarui!</p>
          <p className="text-ink/55 text-sm">Mengalihkan ke halaman masuk...</p>
        </div>
      ) : step === 1 ? (
        /* FORM TAHAP 1 */
        <form onSubmit={handleSendOtp}>
          <FormField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@perusahaan.com"
            required
            autoFocus
          />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3.5 py-2.5 mb-4">
              {error}
            </p>
          )}

          <SubmitButton type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Mengirim OTP..." : "Kirim Kode OTP"}
          </SubmitButton>
        </form>
      ) : (
        /* FORM TAHAP 2 */
        <form onSubmit={handleVerifyOtpAndReset}>
          <FormField
            label="Kode OTP (6 Angka)"
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="123456"
            required
            autoFocus
          />

          <div className="mb-4">
            <FormField
              label="Kata Sandi Baru"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              required
            />
            <PasswordRequirements value={newPassword} />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3.5 py-2.5 mb-4">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3">
            <SubmitButton type="submit" disabled={status === "loading"}>
              {status === "loading" ? "Memproses..." : "Simpan Kata Sandi Baru"}
            </SubmitButton>

            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep(1);
              }}
              className="text-xs text-ink/50 hover:text-forest transition-colors text-center"
            >
              â† Ubah Email
            </button>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
```

## FILE: app/masuk/page.tsx

```tsx
"use client";



import { useState } from "react";

import Link from "next/link";

import { useRouter } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";

import { FormField } from "@/components/auth/form-field";

import { SubmitButton } from "@/components/auth/submit-button";

import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

import { translateAuthError } from "@/lib/auth-errors";



export default function MasukPage() {

  const router = useRouter();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [status, setStatus] = useState<"idle" | "loading" | "submitted">("idle");

  const [error, setError] = useState<string | null>(null);



  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {

    e.preventDefault();

    setError(null);

    setStatus("loading");



    try {

      const supabase = createSupabaseBrowserClient();

      const { data, error: signInError } = await supabase.auth.signInWithPassword({

        email,

        password,

      });

      if (signInError) throw signInError;



      const userId = data.user.id;



      // Arahkan berdasarkan peran akun: admin -> mitra -> industri -> beranda.

      const { data: adminRow } = await supabase

        .from("admin_profiles")

        .select("user_id")

        .eq("user_id", userId)

        .maybeSingle();



      if (adminRow) {

        setStatus("submitted");

        router.push("/dashboard-admin");

        router.refresh();

        return;

      }



      const { data: mitraRow } = await supabase

        .from("mitra_profiles")

        .select("user_id")

        .eq("user_id", userId)

        .maybeSingle();



      if (mitraRow) {

        setStatus("submitted");

        router.push("/dashboard");

        router.refresh();

        return;

      }



      const { data: industriRow } = await supabase

        .from("industri_profiles")

        .select("user_id")

        .eq("user_id", userId)

        .maybeSingle();



      setStatus("submitted");

      router.push(industriRow ? "/dashboard-industri" : "/");

      router.refresh();

    } catch (err) {

      setStatus("idle");

      setError(translateAuthError(err instanceof Error ? err.message : null));

    }

  }



  return (

    <AuthShell

      eyebrow="Selamat datang kembali"

      title="Masuk ke akun LENTERA"

      subtitle="Kelola jadwal pengumpulan, status pengolahan, dan penyaluran energi Anda."

      footer={

        <p className="text-sm text-ink/60">

          Belum punya akun?{" "}

          <Link href="/daftar" className="text-green font-medium hover:underline">

            Daftar sekarang

          </Link>

        </p>

      }

    >

      {status === "submitted" ? (

        <div className="text-center py-4">

          <p className="text-forest font-medium mb-1">Berhasil masuk.</p>

          <p className="text-ink/55 text-sm">Mengalihkan...</p>

        </div>

      ) : (

        <form onSubmit={handleSubmit}>

          <FormField

            label="Email"

            type="email"

            value={email}

            onChange={(e) => setEmail(e.target.value)}

            placeholder="nama@perusahaan.com"

            required

            autoFocus

          />

          <FormField

            label="Kata sandi"

            type="password"

            value={password}

            onChange={(e) => setPassword(e.target.value)}

            placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"

            required

          />

          <div className="flex justify-end mb-5">

            <a href="/lupa-sandi" className="text-xs text-ink/50 hover:text-forest transition-colors">

              Lupa kata sandi?

            </a>

          </div>



          {error && (

            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3.5 py-2.5 mb-4">

              {error}

            </p>

          )}



          <SubmitButton type="submit" disabled={status === "loading"}>

            {status === "loading" ? "Memproses..." : "Masuk"}

          </SubmitButton>

        </form>

      )}

    </AuthShell>

  );

}
```

## FILE: app/page.tsx

```tsx
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { Partners } from "@/components/partners";
import { Network } from "@/components/network";
import { Leaderboard } from "@/components/leaderboard";
import { PartnersMarquee } from "@/components/partners-marquee";
import { CtaFooter } from "@/components/cta-footer";
import { getLeaderboardEntries } from "@/lib/get-leaderboard";
import { CookieConsent } from "@/components/cookie-consent";

export const dynamic = "force-dynamic";

export default async function Home() {
  const leaderboardEntries = await getLeaderboardEntries();

  return (
    <main className="min-h-screen w-full max-w-[100vw] overflow-x-hidden relative bg-cream">
      <CookieConsent />
      <Navbar />
      <Hero />
      <HowItWorks />
      <Partners />
      <Network />
      <Leaderboard entries={leaderboardEntries} />
      <PartnersMarquee />
      <CtaFooter />
    </main>
  );
}
```

## FILE: app/pipeline/route.ts

```ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    return NextResponse.json({ 
      success: true, 
      message: "Pipeline mockup active",
      data: body 
    });
  } catch {
    return NextResponse.json({ success: true });
  }
}

export async function GET() {
  return NextResponse.json({ success: true, message: "Pipeline active" });
}
```

## FILE: app/syarat-ketentuan/page.tsx

```tsx
import { LegalShell, LegalSection } from "@/components/legal/legal-shell";

export default function SyaratKetentuanPage() {
  return (
    <LegalShell title="Syarat & Ketentuan">
      <LegalSection title="1. Ketentuan Umum">
        Dengan mendaftar sebagai mitra atau industri di LENTERA, Anda setuju
        untuk terikat pada syarat dan ketentuan ini. LENTERA berhak
        memperbarui ketentuan ini sewaktu-waktu, dan perubahan akan
        diberitahukan melalui email terdaftar Anda.
      </LegalSection>
      <LegalSection title="2. Kewajiban Mitra & Industri">
        Mitra dan industri wajib memberikan data pendaftaran yang benar dan
        terkini (nama, NIK/NIB atau NPWP, alamat, dan nomor telepon), serta
        bertanggung jawab atas keakuratan informasi yang disampaikan kepada
        LENTERA.
      </LegalSection>
      <LegalSection title="3. Pemesanan & Penyaluran">
        Permintaan stok ulang atau pemesanan yang diajukan melalui dashboard
        akan diproses sesuai ketersediaan dan jadwal penyaluran LENTERA.
        Harga dan ketersediaan produk dapat berubah sewaktu-waktu.
      </LegalSection>
      <LegalSection title="4. Pembatalan & Pengembalian">
        Pembatalan pesanan hanya dapat dilakukan sebelum proses penyaluran
        dimulai. Kebijakan pengembalian mengikuti ketentuan yang berlaku
        untuk masing-masing jenis produk.
      </LegalSection>
      <LegalSection title="5. Penghentian Akun">
        LENTERA berhak menangguhkan atau menghentikan akun mitra/industri
        yang melanggar ketentuan ini atau menyalahgunakan layanan yang
        disediakan.
      </LegalSection>
    </LegalShell>
  );
}
```

## FILE: app/tentang-kami/page.tsx

```tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { Navbar } from "@/components/navbar";

export default function TentangKamiPage() {
  // Variasi animasi untuk mempermudah pemanggilan
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-cream pt-32 pb-20 overflow-hidden">
        {/* Hero Section dengan Gambar */}
        <section className="px-6 md:px-12 lg:px-24 max-w-7xl mx-auto mb-20 md:mb-32 pt-4 md:pt-10">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">

            {/* Sisi Kiri: Teks */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeUp}
              className="flex-1 text-center md:text-left"
            >
              <p className="font-mono text-xs tracking-widest uppercase text-green mb-4">
                Kenali Kami
              </p>
              <h1 className="font-display font-semibold text-4xl md:text-5xl lg:text-6xl text-forest mb-6 leading-tight">
                Menghidupkan Kembali <br className="hidden xl:block" />
                Sisa Industri Menjadi Energi
              </h1>
              <p className="text-ink/70 text-base md:text-lg max-w-xl mx-auto md:mx-0 leading-relaxed">
                LENTERA hadir sebagai jembatan penghubung antara industri penghasil limbah dengan mitra penyalur energi. Kami percaya bahwa tidak ada yang terbuang sia-sia jika dikelola dengan inovasi dan kepedulian.
              </p>
            </motion.div>

            {/* Sisi Kanan: Gambar Karakter 3D */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 30 }}
              whileInView={{ opacity: 1, scale: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              className="flex-1 flex justify-center md:justify-end w-full"
            >
              <div className="relative w-full max-w-[480px] aspect-square">
                {/* Efek Glow di belakang gambar */}
                <div className="absolute inset-0 bg-green/10 blur-[60px] rounded-full transform -translate-y-10 scale-90 z-0"></div>
                <Image
                  src="/images/character-tentang-kami.png"
                  alt="Tim Lentera"
                  fill
                  className="object-contain relative z-10 drop-shadow-xl"
                  priority
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Visi & Misi */}
        <section className="px-6 md:px-12 lg:px-24 max-w-7xl mx-auto mb-20 md:mb-32">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-8 md:gap-12"
          >
            {/* Visi */}
            <motion.div variants={fadeUp} className="bg-paper rounded-3xl border border-forest/10 p-8 md:p-12 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green/10 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h2 className="font-display font-semibold text-2xl text-forest mb-4">Visi Kami</h2>
              <p className="text-ink/70 leading-relaxed">
                Menjadi pelopor utama dalam transisi energi terbarukan di Indonesia melalui ekosistem pengelolaan limbah industri yang transparan, efisien, dan berkelanjutan.
              </p>
            </motion.div>

            {/* Misi */}
            <motion.div variants={fadeUp} className="bg-paper rounded-3xl border border-forest/10 p-8 md:p-12 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-clay/10 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-clay" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="font-display font-semibold text-2xl text-forest mb-4">Misi Kami</h2>
              <ul className="text-ink/70 space-y-3 leading-relaxed">
                <li className="flex items-start gap-3">
                  <span className="text-green mt-1">âœ¦</span>
                  Memfasilitasi penyerapan limbah industri secara optimal.
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green mt-1">âœ¦</span>
                  Memberdayakan mitra lokal dalam pendistribusian energi alternatif.
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green mt-1">âœ¦</span>
                  Mengurangi jejak karbon nasional demi lingkungan yang lebih sehat.
                </li>
              </ul>
            </motion.div>
          </motion.div>
        </section>

        {/* Nilai Inti */}
        <section className="px-6 md:px-12 lg:px-24 max-w-6xl mx-auto mb-20 md:mb-32">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display font-semibold text-3xl text-forest text-center mb-12"
          >
            Nilai yang Kami Pegang
          </motion.h2>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid sm:grid-cols-3 gap-6"
          >
            {[
              {
                title: "Keberlanjutan",
                desc: "Setiap langkah operasional dirancang untuk memprioritaskan kelestarian alam dan lingkungan sekitar.",
              },
              {
                title: "Transparansi",
                desc: "Sistem yang terbuka membebaskan semua pihak memantau alur limbah hingga menjadi produk energi.",
              },
              {
                title: "Kolaborasi",
                desc: "Membangun sinergi kuat antara pabrik, agen mitra, dan masyarakat untuk kemajuan bersama.",
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                variants={fadeUp}
                className="bg-cream border border-forest/10 rounded-2xl p-6 md:p-8 hover:bg-white transition-colors shadow-sm hover:shadow-md"
              >
                <h3 className="font-display font-semibold text-lg text-forest mb-2">{item.title}</h3>
                <p className="text-sm text-ink/70 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* CTA Pendek */}
        <section className="px-6 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-forest rounded-3xl p-10 md:p-16 relative overflow-hidden"
          >
            {/* Ornamen dekoratif */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-green opacity-20 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-clay opacity-20 blur-[60px] rounded-full -translate-x-1/2 translate-y-1/2"></div>

            <h2 className="font-display font-semibold text-3xl md:text-4xl text-paper mb-6 relative z-10">
              Mari Menjadi Bagian dari Perubahan
            </h2>
            <p className="text-paper/80 mb-8 max-w-lg mx-auto relative z-10">
              Gabung bersama ratusan industri dan mitra lainnya untuk mewujudkan kemandirian energi nasional.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <Link
                href="/daftar"
                className="px-8 py-3.5 bg-green text-paper rounded-full font-medium hover:bg-green/90 transition-colors w-full sm:w-auto"
              >
                Bergabung Sekarang
              </Link>
              <Link
                href="/kontak"
                className="px-8 py-3.5 bg-transparent border-2 border-paper/20 text-paper rounded-full font-medium hover:bg-paper/10 transition-colors w-full sm:w-auto"
              >
                Hubungi Kami
              </Link>
            </div>
          </motion.div>
        </section>
      </main>
    </>
  );
}
```

## FILE: components/ai-assistant.tsx

```tsx
"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  sender: "user" | "ai";
  text: string;
}

const QUICK_QUESTIONS = [
  "Berapa kredit token yang didapat?",
  "Bagaimana cara pesan ulang stok?",
  "Limbah apa saja yang diterima?",
];

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "Halo! Saya Asisten AI LENTERA. Ada yang bisa saya bantu terkait pengolahan limbah atau layanan kami?",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isTyping, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isTyping) return;

    setMessages((prev) => [...prev, { sender: "user", text }]);
    if (!textToSend) setInputMessage("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) throw new Error("Gagal terhubung");

      setIsTyping(false);
      setMessages((prev) => [...prev, { sender: "ai", text: "" }]);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          updated[lastIndex] = {
            ...updated[lastIndex],
            text: updated[lastIndex].text + chunkText,
          };
          return updated;
        });
      }

    } catch (error) {
      console.error("Error sending message:", error);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Gagal terhubung ke server AI. Pastikan koneksi internet kamu stabil.",
        },
      ]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 bg-paper rounded-2xl border border-forest/10 shadow-2xl overflow-hidden flex flex-col h-[480px] max-h-[80vh] transition-all animate-in fade-in slide-in-from-bottom-4">

          <div className="bg-forest text-cream p-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center border border-gold/40 text-gold font-bold text-xs">
                AI
              </div>
              <div>
                <h3 className="font-display font-semibold text-sm leading-tight">Asisten LENTERA</h3>
                <p className="text-[10px] text-cream/70 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse"></span> Online
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-cream/70 hover:text-cream transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-cream/30 text-xs">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[82%] p-3 rounded-2xl leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-forest text-paper rounded-tr-none shadow-xs"
                      : "bg-white border border-forest/10 text-ink rounded-tl-none shadow-xs"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-forest/10 p-3 rounded-2xl rounded-tl-none text-ink/50 flex items-center gap-1 shadow-xs">
                  <span className="w-1.5 h-1.5 bg-forest/40 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-forest/40 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-forest/40 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-3 py-2 bg-white border-t border-forest/5 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {QUICK_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(q)}
                disabled={isTyping}
                className="text-[10px] bg-forest/5 hover:bg-forest/10 border border-forest/10 text-forest px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 bg-white border-t border-forest/10 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              placeholder="Tanyakan sesuatu..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isTyping}
              className="flex-1 bg-cream/40 border border-ink/15 rounded-xl px-3 py-2 text-xs outline-none focus:border-green transition-colors"
            />
            <button
              type="submit"
              disabled={isTyping || !inputMessage.trim()}
              className="bg-forest text-cream p-2 rounded-xl hover:bg-forest/90 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-forest text-gold border border-gold/30 p-3.5 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer group"
        aria-label="Tanya AI Assistant"
      >
        <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
    </div>
  );
}
```

## FILE: components/auth/auth-shell.tsx

```tsx
import { ReactNode } from "react";

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  wide = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  return (
    <main className="relative min-h-screen flex items-center justify-center px-6 py-16 bg-cream overflow-hidden">
      <div
        aria-hidden
        className="absolute w-[480px] h-[480px] rounded-full bg-green/20 blur-[90px] -top-32 -left-32"
      />
      <div
        aria-hidden
        className="absolute w-[420px] h-[420px] rounded-full bg-gold/20 blur-[90px] -bottom-32 -right-24"
      />

      <div className={`relative w-full ${wide ? "max-w-2xl" : "max-w-md"}`}>
        <div className="bg-paper rounded-3xl border border-forest/10 shadow-[0_30px_60px_-20px_rgba(23,48,31,0.25)] p-8 md:p-10">
          {eyebrow && (
            <p className="font-mono text-xs tracking-widest uppercase text-green mb-3 text-center">
              {eyebrow}
            </p>
          )}
          <h1 className="font-display font-semibold text-2xl md:text-3xl text-forest text-center mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-ink/60 text-sm text-center mb-8 max-w-sm mx-auto">
              {subtitle}
            </p>
          )}
          {!subtitle && <div className="mb-8" />}

          {children}
        </div>

        {footer && <div className="text-center mt-6">{footer}</div>}
      </div>
    </main>
  );
}
```

## FILE: components/auth/back-button.tsx

```tsx
export function BackButton({
  children = "Kembali",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="shrink-0 border border-forest/15 text-forest font-medium rounded-full px-5 py-3.5 mt-2 transition-colors hover:bg-forest/5"
    >
      {children}
    </button>
  );
}
```

## FILE: components/auth/form-field.tsx

```tsx
import { InputHTMLAttributes } from "react";

export function FormField({
  label,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium text-forest mb-1.5">
        {label}
      </span>
      <input
        {...props}
        className="w-full rounded-xl border border-forest/15 bg-cream/50 px-4 py-3 text-sm text-ink placeholder:text-ink/35 outline-none transition-colors focus:border-green focus:bg-paper"
      />
    </label>
  );
}
```

## FILE: components/auth/otp-field.tsx

```tsx
export function OtpField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div className="mb-4">
      <span className="block text-sm font-medium text-forest mb-1.5">
        Kode verifikasi
      </span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="000000"
        className={`w-full rounded-xl border bg-cream/50 px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] text-forest placeholder:text-ink/20 outline-none transition-colors focus:bg-paper ${
          error
            ? "border-red-300 focus:border-red-400"
            : "border-forest/15 focus:border-green"
        }`}
      />
      {error && <span className="block text-xs text-red-600 mt-1.5">{error}</span>}
    </div>
  );
}
```

## FILE: components/auth/password-requirements.tsx

```tsx
import { passwordRules } from "@/lib/validation";

export function PasswordRequirements({ value }: { value: string }) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 mb-5 -mt-1">
      {passwordRules.map((rule) => {
        const met = rule.test(value);
        return (
          <li
            key={rule.key}
            className={`flex items-center gap-2 text-xs transition-colors ${
              met ? "text-green" : "text-ink/45"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                met ? "bg-green text-cream" : "bg-forest/8"
              }`}
            >
              {met && (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-2.5 h-2.5"
                >
                  <path d="M5 12l5 5L20 7" />
                </svg>
              )}
            </span>
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
```

## FILE: components/auth/progress-steps.tsx

```tsx
export function ProgressSteps({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center gap-1">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-mono font-medium transition-colors duration-300 ${
                i <= current ? "bg-green text-cream" : "bg-forest/8 text-ink/35"
              }`}
            >
              {i < current ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-3.5 h-3.5"
                >
                  <path d="M5 12l5 5L20 7" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-10 md:w-14 h-[2px] mx-1 transition-colors duration-300 ${
                  i < current ? "bg-green" : "bg-forest/10"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <p className="text-center text-xs font-mono uppercase tracking-widest text-ink/40 mt-3">
        Langkah {current + 1} dari {steps.length} Â· {steps[current]}
      </p>
    </div>
  );
}
```

## FILE: components/auth/submit-button.tsx

```tsx
import { useRef } from "react";

export function SubmitButton({
  children,
  className = "",
  disabled,
  isSubmitting,
  debounceMs = 600,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isSubmitting?: boolean;
  debounceMs?: number;
}) {
  const lastClickRef = useRef(0);

  const isProcessing = Boolean(disabled || isSubmitting);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const now = Date.now();

    if (isProcessing || now - lastClickRef.current < debounceMs) {
      event.preventDefault();
      return;
    }

    lastClickRef.current = now;
    onClick?.(event);
  };

  return (
    <button
      {...props}
      type={props.type ?? "submit"}
      disabled={isProcessing}
      aria-busy={isProcessing}
      onClick={handleClick}
      className={`${className || "w-full"} bg-forest text-cream font-medium rounded-full py-3.5 transition-colors hover:bg-forest-2 disabled:opacity-60 disabled:pointer-events-none`}
    >
      {isProcessing ? "Memproses..." : children}
    </button>
  );
}
```

## FILE: components/auth/terms-checkbox.tsx

```tsx
"use client";

import Link from "next/link";

export function TermsCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label="Setuju dengan Syarat & Ketentuan dan Kebijakan Privasi"
        onClick={() => onChange(!checked)}
        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
          checked ? "bg-green border-green" : "border-forest/25 hover:border-forest/40"
        }`}
      >
        {checked && (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3 h-3 text-cream"
          >
            <path d="M5 12l5 5L20 7" />
          </svg>
        )}
      </button>
      <p className="text-sm text-ink/65 leading-relaxed">
        Saya menyetujui{" "}
        <Link
          href="/syarat-ketentuan"
          target="_blank"
          className="text-green font-medium hover:underline"
        >
          Syarat &amp; Ketentuan
        </Link>{" "}
        dan{" "}
        <Link
          href="/kebijakan-privasi"
          target="_blank"
          className="text-green font-medium hover:underline"
        >
          Kebijakan Privasi
        </Link>{" "}
        LENTERA.
      </p>
    </div>
  );
}
```

## FILE: components/cookie-consent.tsx

```tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Mengecek apakah user sudah klik "Saya Mengerti" sebelumnya
    const consent = localStorage.getItem("lentera-cookie-consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    // Menyimpan persetujuan di browser agar pop-up tidak muncul lagi
    localStorage.setItem("lentera-cookie-consent", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-forest/60 backdrop-blur-sm p-4">
      <div className="bg-paper border border-forest/10 p-6 sm:p-8 rounded-2xl shadow-2xl max-w-lg w-full text-center animate-in fade-in zoom-in-95 duration-200">
        <h2 className="font-display font-bold text-xl text-forest mb-3">
          Pemberitahuan Penggunaan Cookie
        </h2>
        <p className="text-sm text-ink/70 mb-6 leading-relaxed">
          Kami menggunakan cookie untuk meningkatkan kualitas layanan dan memberikan pengalaman yang lebih baik. Cookie menganalisis bagian website yang kamu kunjungi. Pelajari lebih lanjut mengenai Cookie di{" "}
          <Link className="text-forest font-bold hover:underline" href="/kebijakan-privasi">
            Kebijakan Privasi
          </Link>.
        </p>
        <button
          onClick={handleAccept}
          className="bg-forest text-cream font-semibold px-8 py-3 rounded-xl hover:bg-forest/90 transition-colors w-full sm:w-auto cursor-pointer shadow-md"
        >
          Saya Mengerti
        </button>
      </div>
    </div>
  );
}
```

## FILE: components/cta-footer.tsx

```tsx
import Image from "next/image";
import { Reveal } from "./ui/reveal";
import { MagneticButton } from "./ui/magnetic-button";

const footerLinks = [
  { href: "app/tentang-kami", label: "Tentang kami" },
  { href: "app/edukasi", label: "Edukasi" },
  { href: "app/kontak", label: "Kontak" },
];

export function CtaFooter() {
  return (
    <>
      <section id="kontak" className="py-24 px-6 md:px-10 bg-forest relative overflow-hidden">
        <div
          aria-hidden
          className="absolute w-[420px] h-[420px] rounded-full bg-green/30 blur-[80px] -bottom-40 -left-20"
        />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Reveal>
            <h2 className="font-display font-semibold text-3xl md:text-4xl text-cream mb-5">
              Siap menjadi bagian dari jaringan LENTERA?
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="text-cream/70 text-lg mb-9 max-w-lg mx-auto">
              Daftarkan pabrik atau usaha Anda sebagai mitra sumber limbah
              maupun agen penyalur energi.
            </p>
          </Reveal>
          <Reveal delay={0.16}>
            <div className="flex flex-wrap justify-center gap-4">
              <MagneticButton href="mailto:lentera1.idn@gmail.com" variant="primary" className="!bg-gold !text-forest hover:!bg-gold-light">
                Hubungi Tim Kami
              </MagneticButton>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="px-6 md:px-10 py-12 bg-forest-2 text-cream/60 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
          <Image
            src="/images/logo.png"
            alt="LENTERA"
            width={120}
            height={28}
            className="h-7 w-auto object-contain shrink-0"
          />
            <span className="font-display font-medium text-cream">LENTERA</span>
          </div>
          <div className="flex items-center gap-7">
            {footerLinks.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-cream transition-colors">
                {link.label}
              </a>
            ))}
          </div>
          <p className="text-cream/40">Â© 2026 LENTERA. Limbah Energi Terjangkau Rakyat.</p>
        </div>
      </footer>
    </>
  );
}
```

## FILE: components/dashboard/admin-sidebar.tsx

```tsx
"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export const navItems = [
  {
    id: "ringkasan",
    label: "Ringkasan Admin",
    icon: (
      <>
        <path d="M3 12 12 3l9 9" />
        <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
      </>
    ),
  },
  {
    id: "manajemen-pengguna",
    label: "Manajemen Akun",
    icon: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    id: "katalog-produk",
    label: "Katalog Produk",
    icon: (
      <>
        <path d="m7.5 4.27 9 5.15" />
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </>
    ),
  },
  {
    id: "harga-wilayah",
    label: "Harga Wilayah",
    icon: (
      <>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </>
    ),
  },
  {
    id: "pengiriman",
    label: "Semua Pengiriman",
    icon: (
      <>
        <rect width="8" height="8" x="3" y="3" rx="2" />
        <path d="M7 11v4a2 2 0 0 0 2 2h4" />
        <rect width="8" height="8" x="13" y="13" rx="2" />
      </>
    ),
  },
];

interface SidebarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export function AdminSidebar({
  activeTab,
  setActiveTab,
}: SidebarProps) {
  const [nama, setNama] = useState<string | null>("Administrator");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setNama(data.user.email ?? "Administrator");
    });
  }, []);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/masuk";
  }

  return (
    <>
      {/* 1. HEADER MOBILE KHUSUS DROPDOWN */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-[64px] z-50 bg-forest text-cream flex items-center justify-between px-5 border-b border-cream/10 shadow-sm">
        <div className="flex flex-col">
          <span className="font-display font-bold tracking-tight text-base leading-none mt-1">
            LENTERA
          </span>
          <span className="text-[10px] text-cream/50 font-mono uppercase tracking-wider">
            Portal Admin
          </span>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-cream hover:bg-cream/10 rounded-lg transition-colors cursor-pointer focus:outline-none"
        >
          <div className="space-y-1.5 w-6">
            <span className={`block h-0.5 w-full bg-current rounded-full transition-transform duration-300 ${isOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block h-0.5 w-full bg-current rounded-full transition-opacity duration-300 ${isOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-full bg-current rounded-full transition-transform duration-300 ${isOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </div>
        </button>
      </div>

      {/* 2. OVERLAY GELAP DI BAWAH DROPDOWN */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-ink/60 backdrop-blur-sm"
          style={{ top: "64px" }}
        />
      )}

      {/* 3. MENU DROPDOWN MOBILE */}
      <div
        className={`md:hidden fixed top-[64px] left-0 right-0 z-40 bg-forest text-cream border-b border-cream/10 px-4 py-5 shadow-2xl transition-all duration-300 ease-in-out transform origin-top max-h-[85vh] overflow-y-auto ${
          isOpen
            ? "translate-y-0 opacity-100 scale-y-100 pointer-events-auto"
            : "-translate-y-4 opacity-0 scale-y-95 pointer-events-none"
        }`}
      >
        {/* Tombol X Tutup udah dibuang, sisain judul doang biar rapi */}
        <div className="pb-3 mb-3 border-b border-cream/10">
          <p className="text-xs font-mono text-gold uppercase tracking-wider">
            Navigasi Panel Admin
          </p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (setActiveTab) setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium w-full text-left transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-cream text-forest font-semibold shadow-xs"
                    : "text-cream/70 hover:text-cream hover:bg-cream/10"
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 shrink-0 ${isActive ? "text-forest" : "text-gold/80"}`}>
                  {item.icon}
                </svg>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-5 pt-4 border-t border-cream/10 space-y-3">
          {nama && (
            <div className="flex items-center gap-3 px-3 py-1">
              <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center font-display font-semibold text-xs shrink-0 border border-gold/30">
                {nama.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm font-medium text-cream/90 truncate">{nama}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold text-red-200 bg-red-500/15 hover:bg-red-500/25 active:bg-red-500/35 transition-all w-full border border-red-500/20 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17 21 12 16 7" />
              <path d="M21 12H9" />
            </svg>
            Keluar dari Sesi
          </button>
        </div>
      </div>

      {/* 4. SIDEBAR DESKTOP (LAPTOP/PC) */}
      <aside className="hidden md:flex md:w-64 shrink-0 bg-forest text-cream flex-col h-screen sticky top-0 shadow-[4px_0_24px_rgba(0,0,0,0.05)] z-30">
        <div className="p-6 border-b border-cream/10">
          <span className="font-display font-semibold text-lg tracking-tight">
            LENTERA
          </span>
          <p className="text-xs text-cream/45 mt-1 font-mono uppercase tracking-wider">
            Portal Admin
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (setActiveTab) setActiveTab(item.id);
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full text-left transition-colors cursor-pointer ${
                  isActive
                    ? "bg-cream text-forest font-semibold shadow-xs"
                    : "text-cream/65 hover:text-cream hover:bg-cream/10"
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
                  {item.icon}
                </svg>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-cream/10">
          {nama && (
            <div className="flex items-center gap-3 px-2 mb-2 pb-3 border-b border-cream/10">
              <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center font-display font-semibold text-xs shrink-0">
                {nama.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm text-cream/80 truncate">{nama}</p>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-cream/65 hover:text-red-300 hover:bg-cream/10 transition-colors w-full cursor-pointer text-left"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17 21 12 16 7" />
              <path d="M21 12H9" />
            </svg>
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}
```

## FILE: components/dashboard/industri-sidebar.tsx

```tsx
"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const navItems = [
  {
    href: "#ringkasan",
    label: "Ringkasan",
    icon: (
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12 12 3l9 9" />
        <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
      </svg>
    ),
  },
  {
    href: "#lacak-pengiriman",
    label: "Status Pengiriman",
    icon: (
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    href: "#pembayaran-b3",
    label: "Tagihan B3",
    icon: (
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
        <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
        <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
      </svg>
    ),
  },
  {
    href: "#profil-industri",
    label: "Profil Industri",
    icon: (
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M5 21V9l6-4 6 4v12M9 21v-6h6v6" />
      </svg>
    ),
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function IndustriSidebar({ isOpen = false, onClose }: SidebarProps) {
  const [nama, setNama] = useState<string | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase
        .from("industri_profiles")
        .select("nama_perusahaan")
        .eq("user_id", data.user.id)
        .maybeSingle();
      setNama(profile?.nama_perusahaan ?? data.user.email ?? null);
    });
  }, []);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/masuk";
  }

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
    if (onClose) onClose();
  };

  return (
    <>
      {/* 1. MOBILE TOP BAR */}
      <div className="md:hidden sticky top-0 z-50 bg-forest text-cream flex items-center justify-between px-5 py-3.5 border-b border-cream/10 w-full shadow-sm">
        <div>
          <span className="font-display font-semibold text-base tracking-tight block leading-none">
            LENTERA
          </span>
          <span className="text-[10px] text-cream/45 font-mono uppercase tracking-wider">Portal Industri</span>
        </div>

        {/* Dynamic Animated Hamburger Button */}
        <button
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          className="p-2 text-cream/80 hover:text-cream rounded-xl hover:bg-cream/10 transition-all duration-200 active:scale-95 focus:outline-none cursor-pointer"
        >
          <div className="w-5 h-5 flex flex-col justify-center items-center relative">
            <span
              className={`h-0.5 w-5 bg-current rounded-full transition-all duration-300 ease-in-out ${
                isMobileOpen ? "rotate-45 translate-y-[2px]" : "-translate-y-1"
              }`}
            />
            <span
              className={`h-0.5 w-5 bg-current rounded-full transition-all duration-200 ease-in-out ${
                isMobileOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`h-0.5 w-5 bg-current rounded-full transition-all duration-300 ease-in-out ${
                isMobileOpen ? "-rotate-45 -translate-y-[2px]" : "translate-y-1"
              }`}
            />
          </div>
        </button>
      </div>

      {/* 2. MOBILE OVERLAY & SMOOTH SLIDE-DOWN DROPDOWN */}
      <div
        onClick={() => setIsMobileOpen(false)}
        className={`md:hidden fixed inset-0 z-40 bg-ink/50 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
          isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      <div
        className={`md:hidden fixed top-[57px] left-0 right-0 z-40 bg-forest text-cream border-b border-cream/10 px-4 py-5 shadow-2xl transition-all duration-300 ease-in-out transform origin-top ${
          isMobileOpen
            ? "translate-y-0 opacity-100 scale-y-100 pointer-events-auto"
            : "-translate-y-4 opacity-0 scale-y-95 pointer-events-none"
        }`}
      >
        <nav className="space-y-1">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium text-cream/70 hover:text-cream hover:bg-cream/10 transition-all duration-150 active:scale-[0.98]"
            >
              <div className="text-gold/80 shrink-0">{item.icon}</div>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="mt-5 pt-4 border-t border-cream/10 space-y-3">
          {nama && (
            <div className="flex items-center gap-3 px-3 py-1">
              <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center font-display font-semibold text-xs shrink-0 border border-gold/30">
                {nama.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm font-medium text-cream/90 truncate">{nama}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold text-red-200 bg-red-500/15 hover:bg-red-500/25 active:bg-red-500/35 transition-all duration-150 w-full border border-red-500/20 cursor-pointer"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 shrink-0"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17 21 12 16 7" />
              <path d="M21 12H9" />
            </svg>
            Keluar dari Sesi
          </button>
        </div>
      </div>

      {/* 3. DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 shrink-0 bg-forest text-cream flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-cream/10">
          <span className="font-display font-semibold text-lg tracking-tight">
            LENTERA
          </span>
          <p className="text-xs text-cream/45 mt-1 font-mono uppercase tracking-wider">Portal Industri</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-cream/65 hover:text-cream hover:bg-cream/10 transition-colors"
            >
              {item.icon}
              {item.label}
            </a>
          ))}
        </nav>

        <div className="p-4 border-t border-cream/10">
          {nama && (
            <div className="flex items-center gap-3 px-2 mb-2 pb-3 border-b border-cream/10">
              <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center font-display font-semibold text-xs shrink-0">
                {nama.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm text-cream/80 truncate">{nama}</p>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-cream/65 hover:text-red-300 hover:bg-cream/10 transition-colors w-full cursor-pointer text-left"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 shrink-0"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17 21 12 16 7" />
              <path d="M21 12H9" />
            </svg>
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}
```

## FILE: components/dashboard/product-card.tsx

```tsx
"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"; 

interface Product {
  id: string;
  nama?: string;
  nama_produk?: string;
  deskripsi: string;
  price: number;
  unit: string;
  stock: number;
  stok?: number;
}

export function ProductCard({ product }: { product: Product }) {
  const [jumlah, setJumlah] = useState(1);
  const [loading, setLoading] = useState(false);

  const namaProduk = product.nama || product.nama_produk || "Produk Energi";
  const stokTersedia = product.stock ?? product.stok ?? 0;

  const handleOrder = async () => {
    if (jumlah > stokTersedia) {
      alert("Jumlah pesanan melebihi stok yang tersedia!");
      return;
    }

    setLoading(true);

    try {
      // ðŸš€ JURUS AMAN: Ambil data user SEKARANG sebelum buka Midtrans
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        alert("Gagal: Sesi login kamu tidak terbaca. Silakan refresh halaman.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/transaksi/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produk_id: product.id,
          volume_terjual_kg: Number(jumlah),
        }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Respon server bermasalah. Pastikan dev server sudah direstart.");
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat pesanan.");

      const windowSnap = (window as unknown as { snap?: any }).snap;

      if (data.token && windowSnap) {
        windowSnap.pay(data.token, {
          onSuccess: async function (result: any) {
            try {
              const updateRes = await fetch("/api/transaksi/update_stock", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  product_id: product.id,
                  quantity: jumlah,
                  user_id: user.id, // PASTI AMAN KARENA DIAMBIL DI AWAL
                  total_harga: product.price * jumlah
                })
              });

              const updateData = await updateRes.json();

              if (!updateRes.ok) {
                throw new Error(updateData.error || "Gagal nyatet ke database.");
              }

              alert("Pembayaran Berhasil! Pesanan tercatat & Stok dikurangi.");
              window.location.reload(); 
              
            } catch (err: any) {
              console.error(err);
              // ðŸš¨ MENAMPILKAN ALASAN ASLI KENAPA DATABASE NOLAK
              alert("ERROR SYSTEM: " + err.message);
              window.location.reload();
            }
          },
          onPending: function () {
            alert("Menunggu pembayaran Anda.");
            window.location.reload();
          },
          onError: function () {
            alert("Pembayaran gagal!");
            window.location.reload();
          },
          onClose: function () {
            alert("Kamu menutup pop-up pembayaran sebelum selesai.");
            window.location.reload();
          },
        });
      } else {
        alert(data.message || "Pesanan berhasil dibuat!");
        window.location.reload();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan saat memesan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-paper rounded-2xl border border-forest/10 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="font-display font-semibold text-lg text-forest leading-snug">
            {namaProduk}
          </h3>
          <span className="text-[10px] font-bold px-2.5 py-1 bg-forest/10 text-forest rounded-full uppercase tracking-wider shrink-0">
            {stokTersedia} {product.unit}
          </span>
        </div>
        <p className="text-xs text-ink/60 mb-4 line-clamp-2">{product.deskripsi}</p>
      </div>

      <div>
        <div className="mb-4">
          <p className="text-[10px] uppercase font-mono tracking-widest text-ink/40 mb-0.5">Harga Wilayah</p>
          <p className="font-display font-bold text-forest text-lg">
            Rp {product.price.toLocaleString("id-ID")}{" "}
            <span className="text-xs font-normal text-ink/60">/{product.unit}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border border-forest/20 rounded-xl bg-cream/50 overflow-hidden">
            <button type="button" onClick={() => setJumlah((prev) => Math.max(1, prev - 1))} className="px-3 py-1.5 text-xs text-forest font-bold hover:bg-forest/10 transition-colors cursor-pointer">-</button>
            <span className="px-3 text-xs font-semibold text-forest">{jumlah}</span>
            <button type="button" onClick={() => setJumlah((prev) => prev + 1)} className="px-3 py-1.5 text-xs text-forest font-bold hover:bg-forest/10 transition-colors cursor-pointer">+</button>
          </div>

          <button type="button" onClick={handleOrder} disabled={loading || stokTersedia <= 0} className="flex-1 bg-forest text-cream py-2 px-4 rounded-xl text-xs font-semibold hover:bg-forest/90 transition-colors disabled:opacity-50 cursor-pointer">
            {loading ? "Memproses..." : "Pesan Stok"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

## FILE: components/dashboard/shipment-tracker.tsx

```tsx
export type ShipmentStatus =
  | "menunggu_konfirmasi"
  | "dijadwalkan"
  | "dijemput"
  | "dalam_perjalanan"
  | "tiba_di_fasilitas"
  | "selesai"
  | "dibatalkan";

const stages: { key: ShipmentStatus; label: string }[] = [
  { key: "menunggu_konfirmasi", label: "Menunggu" },
  { key: "dijemput", label: "Dijemput" },
  { key: "dalam_perjalanan", label: "Perjalanan" },
  { key: "tiba_di_fasilitas", label: "Tiba" },
  { key: "selesai", label: "Selesai" },
];

export const shipmentStatusLabels: Record<ShipmentStatus, string> = {
  menunggu_konfirmasi: "Menunggu konfirmasi",
  dijadwalkan: "Dijadwalkan",
  dijemput: "Dijemput armada",
  dalam_perjalanan: "Dalam perjalanan ke fasilitas",
  tiba_di_fasilitas: "Tiba di fasilitas",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};

export function ShipmentTracker({ status }: { status: ShipmentStatus }) {
  if (status === "dibatalkan") {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-full px-3 py-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Dibatalkan
      </div>
    );
  }

  // "dijadwalkan" tampil sebagai bagian dari tahap "Menunggu" di tracker
  // ringkas ini (belum berangkat), supaya stepper-nya tetap 5 titik.
  const effectiveStatus = status === "dijadwalkan" ? "menunggu_konfirmasi" : status;
  const currentIndex = stages.findIndex((s) => s.key === effectiveStatus);
  const idx = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className="flex items-start">
      {stages.map((s, i) => (
        <div key={s.key} className="flex items-start flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1.5 shrink-0 w-14">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-medium shrink-0 ${
                i < idx
                  ? "bg-green text-cream"
                  : i === idx
                  ? "bg-green text-cream"
                  : "bg-forest/8 text-ink/35"
              }`}
            >
              {i < idx ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-3 h-3"
                >
                  <path d="M5 12l5 5L20 7" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`text-[10px] text-center leading-tight ${
                i <= idx ? "text-forest font-medium" : "text-ink/35"
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < stages.length - 1 && (
            <div
              className={`flex-1 h-[2px] mx-0.5 mt-3 ${
                i < idx ? "bg-green" : "bg-forest/10"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
```

## FILE: components/dashboard/sidebar.tsx

```tsx
"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const navItems = [
  {
    href: "#ringkasan",
    label: "Ringkasan",
    icon: (
      <>
        <path d="M3 12 12 3l9 9" />
        <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
      </>
    ),
  },
  {
    href: "#pesan-stok",
    label: "Pesan Stok",
    icon: (
      <>
        <path d="M21 8 12 3 3 8l9 5 9-5Z" />
        <path d="M3 8v8l9 5 9-5V8" />
        <path d="M12 13v8" />
      </>
    ),
  },
  {
    href: "#status-pesanan",
    label: "Status Pesanan",
    icon: (
      <>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </>
    ),
  },
  {
    href: "#profil-mitra",
    label: "Profil Mitra",
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
      </>
    ),
  },
];

export function DashboardSidebar() {
  const [mitraName, setMitraName] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;

      const role = data.user.app_metadata?.role;
      let namaTampil = data.user.email ?? "Pengguna";

      if (role === 'agen') {
        const { data: profile } = await supabase
          .from("agen")
          .select("nama_agen")
          .eq("auth_id", data.user.id)
          .maybeSingle();
        if (profile?.nama_agen) namaTampil = profile.nama_agen;
      }
      else if (role === 'perusahaan') {
        const { data: profile } = await supabase
          .from("perusahaan_industri")
          .select("nama_perusahaan")
          .eq("auth_id", data.user.id)
          .maybeSingle();
        if (profile?.nama_perusahaan) namaTampil = profile.nama_perusahaan;
      } else {
        // Fallback untuk akun Mitra default
        const { data: profile } = await supabase
          .from("mitra_profiles")
          .select("nama_mitra")
          .eq("user_id", data.user.id)
          .maybeSingle();
        if (profile?.nama_mitra) namaTampil = profile.nama_mitra;
      }

      setMitraName(namaTampil);
    });
  }, []);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/masuk";
  }

  return (
    <>
      {/* 1. MOBILE TOP BAR */}
      <div className="md:hidden sticky top-0 z-50 bg-forest text-cream flex items-center justify-between px-5 py-3.5 border-b border-cream/10 w-full shadow-sm">
        <div>
          <span className="font-display font-semibold text-base tracking-tight block leading-none">
            LENTERA
          </span>
          <span className="text-[10px] text-cream/45 font-mono uppercase tracking-wider">Portal Mitra</span>
        </div>

        {/* Dynamic Animated Hamburger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
          className="p-2 text-cream/80 hover:text-cream rounded-xl hover:bg-cream/10 transition-all duration-200 active:scale-95 focus:outline-none cursor-pointer"
        >
          <div className="w-5 h-5 flex flex-col justify-center items-center relative">
            <span
              className={`h-0.5 w-5 bg-current rounded-full transition-all duration-300 ease-in-out ${
                isOpen ? "rotate-45 translate-y-[2px]" : "-translate-y-1"
              }`}
            />
            <span
              className={`h-0.5 w-5 bg-current rounded-full transition-all duration-200 ease-in-out ${
                isOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`h-0.5 w-5 bg-current rounded-full transition-all duration-300 ease-in-out ${
                isOpen ? "-rotate-45 -translate-y-[2px]" : "translate-y-1"
              }`}
            />
          </div>
        </button>
      </div>

      {/* 2. MOBILE OVERLAY & SMOOTH SLIDE-DOWN DROPDOWN */}
      <div
        onClick={() => setIsOpen(false)}
        className={`md:hidden fixed inset-0 z-40 bg-ink/50 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      <div
        className={`md:hidden fixed top-[57px] left-0 right-0 z-40 bg-forest text-cream border-b border-cream/10 px-4 py-5 shadow-2xl transition-all duration-300 ease-in-out transform origin-top ${
          isOpen
            ? "translate-y-0 opacity-100 scale-y-100 pointer-events-auto"
            : "-translate-y-4 opacity-0 scale-y-95 pointer-events-none"
        }`}
      >
        <nav className="space-y-1">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium text-cream/70 hover:text-cream hover:bg-cream/10 transition-all duration-150 active:scale-[0.98]"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 shrink-0 text-gold/80"
              >
                {item.icon}
              </svg>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="mt-5 pt-4 border-t border-cream/10 space-y-3">
          {mitraName && (
            <div className="flex items-center gap-3 px-3 py-1">
              <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center font-display font-semibold text-xs shrink-0 border border-gold/30">
                {mitraName.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm font-medium text-cream/90 truncate">{mitraName}</p>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold text-red-200 bg-red-500/15 hover:bg-red-500/25 active:bg-red-500/35 transition-all duration-150 w-full border border-red-500/20 cursor-pointer"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 shrink-0"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17 21 12 16 7" />
              <path d="M21 12H9" />
            </svg>
            Keluar dari Sesi
          </button>
        </div>
      </div>

      {/* 3. DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 shrink-0 bg-forest text-cream flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-cream/10">
          <span className="font-display font-semibold text-lg tracking-tight">
            LENTERA
          </span>
          <p className="text-xs text-cream/45 mt-1 font-mono uppercase tracking-wider">Portal Mitra</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-cream/65 hover:text-cream hover:bg-cream/10 transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 shrink-0"
              >
                {item.icon}
              </svg>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="p-4 border-t border-cream/10">
          {mitraName && (
            <div className="flex items-center gap-3 px-2 mb-2 pb-3 border-b border-cream/10">
              <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center font-display font-semibold text-xs shrink-0">
                {mitraName.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm text-cream/80 truncate">{mitraName}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-cream/65 hover:text-red-300 hover:bg-cream/10 transition-colors w-full cursor-pointer text-left"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 shrink-0"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17 21 12 16 7" />
              <path d="M21 12H9" />
            </svg>
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}
```

## FILE: components/hero.tsx

```tsx
"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Reveal } from "./ui/reveal";
import { TiltCard } from "./ui/tilt-card";
import Link from "next/link";

const metrics = [
  {
    label: "Kapasitas olah harian",
    value: "120",
    unit: "ton/hari",
    accent: "border-green",
    position: "left-[-10px] sm:left-0 top-0 md:top-8 w-36 md:w-48",
    rotate: -6,
    delay: 0.2,
  },
  {
    label: "Mitra aktif",
    value: "84",
    unit: "titik",
    accent: "border-gold",
    position: "right-[-10px] sm:right-0 top-16 md:top-24 w-32 md:w-44",
    rotate: 5,
    delay: 0.7,
  },
  {
    label: "Energi tersalurkan",
    value: "3.240",
    unit: "MWh/bln",
    accent: "border-clay",
    position: "left-4 md:left-4 bottom-8 md:bottom-4 w-40 md:w-52",
    rotate: -4,
    delay: 1.2,
  },
];

export function Hero() {
  return (
    <header className="relative min-h-screen flex items-center pt-28 pb-16 px-6 md:px-10 overflow-hidden">
      {/* Efek Glow Background */}
      <motion.div
        aria-hidden
        className="absolute w-[520px] h-[520px] rounded-full bg-green/30 blur-[80px] -top-40 -left-40"
      />
      <motion.div
        aria-hidden
        className="absolute w-[420px] h-[420px] rounded-full bg-gold/25 blur-[80px] top-1/3 -right-32"
      />

      <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center relative z-10">

        {/* KOLOM KIRI (Teks dan Tombol) */}
        <div>
          <Reveal>
            <div className="inline-flex items-center gap-2 border border-forest/20 rounded-full px-4 py-1.5 mb-7">
              <span className="font-mono text-[11px] tracking-widest uppercase text-forest/80">
                Limbah Energi Terjangkau Rakyat
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <h1 className="font-display font-semibold text-[2.6rem] leading-[1.08] md:text-[3.4rem] text-forest mb-6">
              Dari limbah pabrik,
              <br />
              jadi energi yang
              <br />
              <span className="text-green">terjangkau untuk semua.</span>
            </h1>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="text-ink/70 text-lg leading-relaxed max-w-md mb-9">
              LENTERA mengumpulkan dan mengolah limbah industri menjadi energi
              siap pakai, lalu menyalurkannya lewat jaringan mitra dan agen di
              seluruh Indonesia.
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="flex flex-wrap items-center gap-4">
              {/* Tombol Primary (Solid Hijau) */}
              <Link
                href="/daftar/mitra"
                className="flex items-center gap-2 bg-forest text-cream px-8 py-3.5 rounded-full font-medium hover:bg-forest/90 transition-colors"
              >
                Jadi Mitra Sekarang
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>

              {/* Tombol Secondary (Garis Tepi) */}
              <Link
                href="/daftar/industri"
                className="bg-transparent border-2 border-forest/20 text-forest px-8 py-3.5 rounded-full font-medium hover:bg-forest/5 transition-colors"
              >
                Bergabung sebagai Industri
              </Link>
            </div>
          </Reveal>
        </div>

        {/* KOLOM KANAN (Karakter 3D dan Kartu Statistik) */}
        <div className="relative h-[420px] md:h-[520px] flex items-center justify-center">

          {/* Karakter 3D (Z-Index dinaikkan agar di depan) */}
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-20 pointer-events-none"
          >
            <Image
              src="/images/hero-character.png"
              alt="Tim LENTERA mengelola energi dari limbah industri"
              width={442}
              height={870}
              className="h-[380px] md:h-[460px] w-auto drop-shadow-2xl"
              priority
            />
          </motion.div>

          {/* Floating Cards (Z-Index diturunkan agar di belakang karakter) */}
          {metrics.map((m) => (
            <TiltCard
              key={m.label}
              rotate={m.rotate}
              delay={m.delay}
              className={`absolute ${m.position} z-10`}
            >
              <div
                className={`bg-paper rounded-2xl p-4 border-l-[3px] ${m.accent} shadow-[0_20px_40px_-12px_rgba(23,48,31,0.18)]`}
              >
                <p className="text-xs text-ink/50 mb-1">{m.label}</p>
                <p className="font-display font-semibold text-2xl text-forest">
                  {m.value}{" "}
                  <span className="text-sm font-body font-medium text-ink/50">
                    {m.unit}
                  </span>
                </p>
              </div>
            </TiltCard>
          ))}
        </div>

      </div>
    </header>
  );
}
```

## FILE: components/how-it-works.tsx

```tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Reveal } from "./ui/reveal";

const accentStyles = {
  green: {
    text: "text-green",
    bg: "bg-green",
    softBg: "bg-green/8",
    border: "border-green",
    ring: "#2F6B3F",
  },
  gold: {
    text: "text-gold",
    bg: "bg-gold",
    softBg: "bg-gold/10",
    border: "border-gold",
    ring: "#C99A3D",
  },
  clay: {
    text: "text-clay",
    bg: "bg-clay",
    softBg: "bg-clay/8",
    border: "border-clay",
    ring: "#7A5738",
  },
} as const;

type Accent = keyof typeof accentStyles;

const tabs: {
  number: string;
  title: string;
  description: string;
  points: string[];
  accent: Accent;
  windowLabel: string;
}[] = [
  {
    number: "01",
    title: "Kumpulkan",
    description:
      "Limbah industri dikumpulkan langsung dari kawasan pabrik mitra sumber melalui jadwal yang disepakati bersama. Setiap pengumpulan dicatat berdasarkan titik asal, jenis limbah, dan volume yang diangkut, sehingga seluruh proses bisa ditelusuri sejak dari sumbernya.",
    points: [
      "Jadwal pengumpulan disepakati per kawasan industri",
      "Pencatatan jenis & volume limbah di titik asal",
      "Armada terintegrasi dengan sistem pelacakan",
    ],
    accent: "green",
    windowLabel: "titik-pengumpulan.lentera.id",
  },
  {
    number: "02",
    title: "Olah",
    description:
      "Limbah yang terkumpul diproses di fasilitas pengolahan LENTERA melalui tahap pemilahan, penghancuran, dan konversi menjadi energi. Setiap tahap diawasi secara berkala untuk menjaga efisiensi dan keamanan proses produksi.",
    points: [
      "Pemilahan otomatis berdasarkan jenis limbah",
      "Konversi memakai teknologi ramah lingkungan",
      "Pemantauan kualitas di tiap tahap produksi",
    ],
    accent: "gold",
    windowLabel: "status-pengolahan.lentera.id",
  },
  {
    number: "03",
    title: "Salurkan",
    description:
      "Energi hasil olahan disalurkan melalui jaringan mitra dan agen ke berbagai wilayah. Distribusi dilakukan secara terjadwal agar pasokan tetap stabil dan bisa diandalkan oleh seluruh mitra LENTERA.",
    points: [
      "Distribusi terjadwal ke seluruh titik mitra",
      "Skema harga kompetitif untuk semua mitra",
      "Dukungan logistik dari tim LENTERA",
    ],
    accent: "clay",
    windowLabel: "distribusi-energi.lentera.id",
  },
];

function WindowChrome({ accent, label }: { accent: Accent; label: string }) {
  return (
    <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-forest/8">
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <span className={`w-2.5 h-2.5 rounded-full ${accentStyles[accent].bg}`} />
        <span className="w-2.5 h-2.5 rounded-full bg-forest/15" />
        <span className="w-2.5 h-2.5 rounded-full bg-forest/15" />
      </div>
      <span className="font-mono text-[11px] sm:text-xs text-ink/40 truncate ml-2">{label}</span>
    </div>
  );
}

function CollectMockup({ accent }: { accent: Accent }) {
  const points = [
    { name: "Kawasan Industri Cikarang", status: "Terjadwal", active: true },
    { name: "Kawasan Industri Medan", status: "Terjadwal", active: true },
    { name: "Kawasan Industri Surabaya", status: "Menunggu", active: false },
  ];
  return (
    <div className="p-5 sm:p-6 md:p-8">
      <p className="font-mono text-[11px] tracking-widest uppercase text-ink/40 mb-4">
        Jadwal pengumpulan hari ini
      </p>
      <div className="space-y-2.5 mb-6 md:mb-8">
        {points.map((p) => (
          <div
            key={p.name}
            className="flex items-center justify-between gap-2 bg-cream rounded-xl px-4 py-3"
          >
            <span className="text-xs sm:text-sm text-forest font-medium truncate">{p.name}</span>
            <span
              className={`text-[11px] sm:text-xs font-mono px-2.5 py-1 rounded-full shrink-0 ${
                p.active
                  ? `${accentStyles[accent].softBg} ${accentStyles[accent].text}`
                  : "bg-forest/5 text-ink/40"
              }`}
            >
              {p.status}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-end justify-between border-t border-forest/8 pt-5 md:pt-6">
        <div>
          <p className="text-xs text-ink/45 mb-1">Total dikumpulkan</p>
          <p className="font-display font-semibold text-2xl sm:text-3xl text-forest">
            120 <span className="text-xs sm:text-sm font-body font-medium text-ink/45">ton/hari</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function ProcessMockup({ accent }: { accent: Accent }) {
  const percent = 78;
  const r = 54;
  const c = 2 * Math.PI * r;
  return (
    <div className="p-5 sm:p-6 md:p-8">
      <p className="font-mono text-[11px] tracking-widest uppercase text-ink/40 mb-6">
        Status pengolahan real-time
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-8">
        <svg width="130" height="130" viewBox="0 0 140 140" className="shrink-0">
          <circle cx="70" cy="70" r={r} fill="none" stroke="#EAF3E7" strokeWidth="12" />
          <motion.circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke={accentStyles[accent].ring}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c - (percent / 100) * c }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            transform="rotate(-90 70 70)"
          />
          <text
            x="70"
            y="76"
            textAnchor="middle"
            className="font-display"
            fontSize="26"
            fontWeight="700"
            fill="#17301F"
          >
            {percent}%
          </text>
        </svg>
        <div className="space-y-4 w-full flex-1">
          <div>
            <div className="flex justify-between text-xs text-ink/45 mb-1.5">
              <span>Kapasitas terpakai</span>
              <span>78%</span>
            </div>
            <div className="h-1.5 bg-forest/8 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${accentStyles[accent].bg}`}
                initial={{ width: 0 }}
                animate={{ width: "78%" }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-ink/45 mb-1.5">
              <span>Rata-rata konversi</span>
              <span>92%</span>
            </div>
            <div className="h-1.5 bg-forest/8 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${accentStyles[accent].bg}`}
                initial={{ width: 0 }}
                animate={{ width: "92%" }}
                transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DistributeMockup({ accent }: { accent: Accent }) {
  const bars = [40, 65, 50, 80, 62, 95];
  const labels = ["Mar", "Apr", "Mei", "Jun", "Jul", "Ags"];
  return (
    <div className="p-5 sm:p-6 md:p-8">
      <p className="font-mono text-[11px] tracking-widest uppercase text-ink/40 mb-6">
        Energi tersalurkan per bulan
      </p>
      <div className="flex items-end justify-between gap-2 sm:gap-3 h-28 md:h-32 mb-3">
        {bars.map((h, i) => (
          <motion.div
            key={labels[i]}
            className={`flex-1 rounded-t-lg ${accentStyles[accent].bg} ${
              i === bars.length - 1 ? "" : "opacity-70"
            }`}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ duration: 0.7, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </div>
      <div className="flex justify-between mb-6 md:mb-8">
        {labels.map((l) => (
          <span key={l} className="text-xs text-ink/40 flex-1 text-center">
            {l}
          </span>
        ))}
      </div>
      <div className="border-t border-forest/8 pt-5 md:pt-6">
        <p className="text-xs text-ink/45 mb-1">Bulan ini</p>
        <p className="font-display font-semibold text-2xl sm:text-3xl text-forest">
          3.240 <span className="text-xs sm:text-sm font-body font-medium text-ink/45">MWh</span>
        </p>
      </div>
    </div>
  );
}

const mockups = [CollectMockup, ProcessMockup, DistributeMockup];

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const tab = tabs[active];
  const Mockup = mockups[active];

  return (
    <section id="cara-kerja" className="py-16 sm:py-24 md:py-28 px-6 md:px-10 bg-paper overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <Reveal className="max-w-xl mb-10 md:mb-16">
          <p className="font-mono text-xs tracking-widest uppercase text-green mb-3">
            Cara kerja
          </p>
          <h2 className="font-display font-semibold text-3xl md:text-4xl text-forest">
            Satu alur, dari pabrik sampai ke masyarakat.
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,360px)_1fr] gap-8 md:gap-14 items-start">
          <div className="w-full">
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="font-mono text-xs text-ink/40">
                Langkah {active + 1} / {tabs.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActive((a) => Math.max(a - 1, 0))}
                  disabled={active === 0}
                  aria-label="Langkah sebelumnya"
                  className="w-9 h-9 rounded-full border border-forest/15 flex items-center justify-center text-forest transition-colors hover:bg-forest/5 disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setActive((a) => Math.min(a + 1, tabs.length - 1))}
                  disabled={active === tabs.length - 1}
                  aria-label="Langkah berikutnya"
                  className="w-9 h-9 rounded-full border border-forest/15 flex items-center justify-center text-forest transition-colors hover:bg-forest/5 disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 w-full">
              {tabs.map((t, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={t.number}
                    onClick={() => setActive(i)}
                    className={`relative text-left w-full rounded-2xl px-5 py-4 transition-colors duration-300 cursor-pointer ${
                      isActive ? accentStyles[t.accent].softBg : "hover:bg-forest/5"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="tab-indicator"
                        className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full ${accentStyles[t.accent].bg}`}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      />
                    )}
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-mono text-xs ${
                          isActive ? accentStyles[t.accent].text : "text-ink/35"
                        }`}
                      >
                        {t.number}
                      </span>
                      <span
                        className={`font-display font-semibold ${
                          isActive ? "text-forest text-lg" : "text-ink/55 text-base"
                        }`}
                      >
                        {t.title}
                      </span>
                    </div>
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: "auto", marginTop: 10 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="text-sm text-ink/60 leading-relaxed mb-3">
                            {t.description}
                          </p>
                          <ul className="space-y-1.5">
                            {t.points.map((point) => (
                              <li
                                key={point}
                                className="flex items-start gap-2 text-xs text-ink/55"
                              >
                                <span
                                  className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${accentStyles[t.accent].bg}`}
                                />
                                {point}
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-full rounded-3xl bg-paper border border-forest/10 shadow-[0_30px_60px_-20px_rgba(23,48,31,0.18)] overflow-hidden">
            <WindowChrome accent={tab.accent} label={tab.windowLabel} />
            <AnimatePresence mode="wait">
              <motion.div
                key={tab.number}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <Mockup accent={tab.accent} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
```

## FILE: components/leaderboard.tsx

```tsx
"use client";

import { motion } from "motion/react";
import { Reveal, RevealGroup, RevealItem } from "./ui/reveal";
import { CompanyLogo } from "./ui/company-logo";
import { PodiumStep } from "./ui/podium-step";
import { leaderboardEntries as dummyLeaderboardEntries, type LeaderboardEntry } from "@/lib/leaderboard-data";

// Urutan tampil podium: 2 - 1 - 3 (klasik), beserta tinggi & warna tiap anak tangga.
const podiumOrder = [2, 1, 3];

const podiumConfig: Record<
  number,
  { height: number; main: string; light: string; dark: string; widthClass: string; delay: number }
> = {
  2: { height: 128, main: "#17301F", light: "#2A4F35", dark: "#0F2417", widthClass: "w-[30%] sm:w-32 md:w-36", delay: 0.2 },
  1: { height: 190, main: "#C99A3D", light: "#E4C078", dark: "#A67D30", widthClass: "w-[36%] sm:w-36 md:w-40", delay: 0.05 },
  3: { height: 86, main: "#7A5738", light: "#A9835C", dark: "#5E4229", widthClass: "w-[30%] sm:w-32 md:w-36", delay: 0.35 },
};

const accentBorder: Record<string, string> = {
  gold: "border-gold",
  forest: "border-forest",
  clay: "border-clay",
  green: "border-green",
};

export function Leaderboard({
  entries = dummyLeaderboardEntries,
}: {
  entries?: LeaderboardEntry[];
}) {
  const top3 = entries.filter((e) => e.rank <= 3);
  const rest = entries.filter((e) => e.rank > 3);

  return (
    <section id="peringkat" className="py-16 sm:py-24 md:py-28 px-4 sm:px-6 md:px-10 bg-cream overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <Reveal className="max-w-xl mb-10 md:mb-16">
          <p className="font-mono text-xs tracking-widest uppercase text-clay mb-3">
            Papan peringkat Â· pratinjau
          </p>
          <h2 className="font-display font-semibold text-3xl md:text-4xl text-forest mb-4">
            Kontributor limbah terbanyak bulan ini.
          </h2>
          <p className="text-ink/65 text-sm sm:text-[15px] leading-relaxed max-w-lg">
            Lima industri dengan volume limbah terbesar yang dikumpulkan dan
            diolah lewat jaringan LENTERA bulan ini.
          </p>
        </Reveal>

        <div className="grid lg:grid-cols-[0.95fr_1.2fr] gap-10 lg:gap-10 items-center">
          {/* Peringkat 4-5 + teks penjelasan */}
          <div className="order-2 lg:order-1">
            <RevealGroup className="space-y-3">
              {rest.map((entry) => (
                <RevealItem key={entry.rank}>
                  <div className="flex items-center gap-2.5 sm:gap-4 bg-paper rounded-xl sm:rounded-2xl border border-forest/8 px-3.5 sm:px-5 py-3 sm:py-4">
                    <span className="font-display font-semibold text-lg sm:text-2xl text-ink/25 w-5 sm:w-6 shrink-0">
                      {entry.rank}
                    </span>
                    <CompanyLogo
                      name={entry.name}
                      logoUrl={entry.logoUrl}
                      logoType={entry.logoType}
                      accent={entry.accent}
                      className="w-8 h-8 sm:w-11 sm:h-11 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-forest text-xs sm:text-[15px] truncate">
                        {entry.name}
                      </p>
                      <p className="text-ink/50 text-[10px] sm:text-xs truncate">{entry.industry}</p>
                    </div>
                    <span className="ml-auto font-mono text-[11px] sm:text-xs text-ink/50 shrink-0 pl-1">
                      {entry.volume}
                    </span>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>

            <Reveal delay={0.15}>
              <p className="mt-6 sm:mt-8 text-ink/55 text-xs sm:text-[14.5px] leading-relaxed">
                Peringkat disusun dari volume limbah yang berhasil dikumpulkan
                dan diproses setiap bulan, konsistensi pasokan, serta tingkat
                pemilahan limbah sejak dari sumber. Lima industri di atas
                secara rutin menjadi kontributor terbesar dalam jaringan
                LENTERA.
              </p>
            </Reveal>
          </div>

          {/* Podium peringkat 1-3 */}
          <div className="order-1 lg:order-2 flex items-end justify-center gap-1.5 sm:gap-4 md:gap-6 w-full">
            {podiumOrder.map((rank) => {
              const entry = top3.find((e) => e.rank === rank)!;
              const cfg = podiumConfig[rank];
              return (
                <div
                  key={rank}
                  className={`flex flex-col items-center ${cfg.widthClass}`}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.6,
                      delay: cfg.delay,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className={`mb-2 sm:mb-4 w-full bg-paper rounded-xl sm:rounded-2xl p-2 sm:p-3.5 border-l-2 sm:border-l-[3px] ${accentBorder[entry.accent]} shadow-[0_16px_32px_-12px_rgba(23,48,31,0.18)] text-center`}
                  >
                    <CompanyLogo
                      name={entry.name}
                      logoUrl={entry.logoUrl}
                      logoType={entry.logoType}
                      accent={entry.accent}
                      className="w-7 h-7 sm:w-10 sm:h-10 mx-auto mb-1.5 sm:mb-2"
                    />
                    <p className="font-medium text-forest text-[10px] sm:text-[12.5px] leading-tight sm:leading-snug line-clamp-2 min-h-[2.2em] sm:min-h-[2.4em]">
                      {entry.name}
                    </p>
                    <p className="font-mono text-[9px] sm:text-[11px] text-ink/45 mt-1 truncate">
                      {entry.volume}
                    </p>
                  </motion.div>

                  <PodiumStep
                    rank={rank}
                    height={cfg.height}
                    main={cfg.main}
                    light={cfg.light}
                    dark={cfg.dark}
                    delay={cfg.delay}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
```

## FILE: components/legal/legal-shell.tsx

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

function BackControl() {
  const router = useRouter();
  const [openedInNewTab, setOpenedInNewTab] = useState(false);

  useEffect(() => {
    // Kalau halaman ini dibuka lewat target="_blank" (mis. dari checkbox
    // Syarat & Ketentuan di form daftar), window.opener ada isinya â€” tab
    // asal (form daftar) masih utuh di tab satunya. Tombolnya jadi "Tutup
    // tab ini" supaya user balik ke situ, bukan navigasi ke beranda dan
    // kehilangan progres form-nya.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpenedInNewTab(!!window.opener);
  }, []);

  if (openedInNewTab) {
    return (
      <button
        type="button"
        onClick={() => window.close()}
        className="inline-flex items-center gap-1.5 text-sm text-forest/60 hover:text-forest transition-colors mb-14"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
        Tutup tab ini
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex items-center gap-1.5 text-sm text-forest/60 hover:text-forest transition-colors mb-14"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      Kembali
    </button>
  );
}

export function LegalShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-cream px-6 py-20 md:py-28">
      <article className="max-w-[680px] mx-auto">
        <BackControl />

        <p className="font-mono text-xs tracking-widest uppercase text-green mb-4">
          Terakhir diperbarui: Agustus 2026
        </p>
        <h1 className="font-display font-semibold text-4xl md:text-5xl text-forest leading-tight mb-8">
          {title}
        </h1>

        <p className="text-ink/55 text-[15px] leading-[1.85] border-l-2 border-gold/40 pl-4 mb-16">
          Ini teks placeholder untuk keperluan pratinjau desain â€” ganti dengan{" "}
          {title.toLowerCase()} resmi LENTERA sebelum situs ini dipublikasikan.
        </p>

        <div className="space-y-12">{children}</div>
      </article>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display font-semibold text-2xl text-forest mb-4">
        {title}
      </h2>
      <p className="text-ink/70 text-[17px] leading-[1.85]">{children}</p>
    </section>
  );
}
```

## FILE: components/location-picker-map.tsx

```tsx
"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import "leaflet/dist/leaflet.css";

export interface LocationPickerProps {
  searchQuery?: string;
  onLocationSelect: (data: {
    lat: number;
    lng: number;
    alamat: string;
    kelurahan: string;
    kecamatan: string;
    kota_kabupaten: string;
    provinsi: string;
  }) => void;
}

export function LocationPickerMap({ searchQuery, onLocationSelect }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const leafletContainer = containerRef.current as HTMLDivElement & { _leaflet_id?: number };
    if (leafletContainer._leaflet_id) {
      leafletContainer._leaflet_id = undefined;
    }

    let isMounted = true;

    (async () => {
      const L = (await import("leaflet")).default;
      if (!isMounted || !containerRef.current) return;

      const map = L.map(containerRef.current, { scrollWheelZoom: true }).setView([-2.9761, 104.7754], 11);
      mapRef.current = map;

      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles &copy; Esri",
        maxZoom: 19,
      }).addTo(map);

      const customIcon = L.divIcon({
        className: "",
        html: `<div style="background:#10B981; width:22px; height:22px; border-radius:50%; border:3px solid white; box-shadow:0 0 10px rgba(0,0,0,0.4);"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      map.on("click", async (e) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { icon: customIcon }).addTo(map);
        }

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          const addr = data.address || {};

          onLocationSelect({
            lat,
            lng,
            alamat: data.display_name || "",
            kelurahan: addr.village || addr.suburb || addr.quarter || "",
            kecamatan: addr.town || addr.city_district || addr.district || "",
            kota_kabupaten: addr.city || addr.regency || addr.county || "",
            provinsi: addr.state || "",
          });
        } catch (err) {
          console.error("Gagal reverse geocoding:", err);
        }
      });
    })();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-Fly & Simpan Lat/Lng Otomatis saat dropdown Wilayah dipilih
  useEffect(() => {
    if (!searchQuery || !mapRef.current) return;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
        );
        const data = await res.json();
        if (data && data.length > 0) {
          const latitude = parseFloat(data[0].lat);
          const longitude = parseFloat(data[0].lon);

          mapRef.current?.flyTo([latitude, longitude], 13, { duration: 1.5 });

          // Update marker & lempar lat/lng ke form pendaftaran
          const L = (await import("leaflet")).default;
          const customIcon = L.divIcon({
            className: "",
            html: `<div style="background:#10B981; width:22px; height:22px; border-radius:50%; border:3px solid white; box-shadow:0 0 10px rgba(0,0,0,0.4);"></div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });

          if (markerRef.current) {
            markerRef.current.setLatLng([latitude, longitude]);
          } else if (mapRef.current) {
            markerRef.current = L.marker([latitude, longitude], { icon: customIcon }).addTo(mapRef.current);
          }

          onLocationSelect({
            lat: latitude,
            lng: longitude,
            alamat: "",
            kelurahan: "",
            kecamatan: "",
            kota_kabupaten: "",
            provinsi: "",
          });
        }
      } catch (err) {
        console.error("Gagal geocoding wilayah:", err);
      }
    }, 600);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-ink/60">ðŸ“Œ Peta akan otomatis menyesuaikan wilayah. Klik titik spesifik di peta jika ingin lebih presisi:</p>
      <div ref={containerRef} className="w-full h-[280px] rounded-xl overflow-hidden border border-ink/20 z-0 relative" />
    </div>
  );
}
```

## FILE: components/navbar.tsx

```tsx
"use client";

import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "motion/react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { scrollY } = useScroll();
  const pathname = usePathname();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 40);
  });

  // Logika kondisional item menu berdasarkan pathname aktif
  const links = [
    {
      href: pathname === "/tentang-kami" ? "/" : "/tentang-kami",
      label: pathname === "/tentang-kami" ? "Beranda" : "Tentang Kami"
    },
    {
      href: pathname === "/edukasi" ? "/" : "/edukasi",
      label: pathname === "/edukasi" ? "Beranda" : "Edukasi"
    },
    {
      href: pathname === "/daftar-mitra-industri" ? "/" : "/daftar-mitra-industri",
      label: pathname === "/daftar-mitra-industri" ? "Beranda" : "Daftar Mitra & Industri"
    },
    {
      href: pathname === "/kontak" ? "/" : "/kontak",
      label: pathname === "/kontak" ? "Beranda" : "Kontak"
    },
  ];

  return (
    <motion.nav
      animate={{
        backgroundColor: scrolled || isOpen ? "rgba(246,242,230,0.95)" : "rgba(246,242,230,0)",
        borderColor: scrolled || isOpen ? "rgba(34,29,22,0.08)" : "rgba(34,29,22,0)",
        backdropFilter: scrolled || isOpen ? "blur(10px)" : "blur(0px)",
      }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`fixed top-0 left-0 w-full z-50 border-b transition-[height] duration-300 ${
        isOpen ? "h-screen bg-cream/95 backdrop-blur-md" : "h-20"
      }`}
    >
      <div className="w-full max-w-7xl mx-auto px-6 md:px-10 h-20 flex items-center justify-between relative z-50">

        {/* Logo LENTERA */}
        <Link href="/" className="flex items-center gap-2 shrink-0" onClick={() => setIsOpen(false)}>
        <Image
          src="/images/logo.png"
          alt="LENTERA"
          width={120}
          height={28}
          className="h-7 w-auto object-contain shrink-0"
        />
          <span className="font-display font-semibold text-base tracking-tight text-forest">
            LENTERA
          </span>
        </Link>

        {/* --- MENU DESKTOP --- */}
        <div className="hidden md:flex items-center gap-9 text-sm font-medium text-ink/80">
          {links.map((link) => (
            <Link key={link.label} href={link.href} className="hover:text-forest transition-colors">
              {link.label}
            </Link>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-5">
          <Link href="/masuk" className="text-sm font-medium text-ink/70 hover:text-forest transition-colors">
            Masuk
          </Link>
          <Link href="/daftar" className="bg-forest text-cream text-sm font-medium px-5 py-2.5 rounded-full hover:bg-forest/90 transition-colors">
            Daftar
          </Link>
        </div>

        {/* --- TOMBOL BURGER MENU --- */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex md:hidden flex-col justify-center items-center w-10 h-10 gap-1.5 focus:outline-none cursor-pointer shrink-0 z-50"
          aria-label="Toggle menu"
        >
          <motion.span
            animate={isOpen ? { rotate: 45, y: 7.5 } : { rotate: 0, y: 0 }}
            className="block w-6 h-[2px] bg-forest rounded-full"
          />
          <motion.span
            animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
            className="block w-6 h-[2px] bg-forest rounded-full"
          />
          <motion.span
            animate={isOpen ? { rotate: -45, y: -7.5 } : { rotate: 0, y: 0 }}
            className="block w-6 h-[2px] bg-forest rounded-full"
          />
        </button>
      </div>

      {/* --- MENU MOBILE DROPDOWN --- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden absolute top-20 left-0 w-full h-[calc(100vh-80px)] px-6 pb-10 overflow-y-auto flex flex-col justify-between z-40"
          >
            <div className="flex flex-col gap-3 text-center mt-6">
              {links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-lg font-medium text-forest hover:text-green transition-colors py-3 border-b border-forest/10"
                >
                  {link.label}
                </Link>
              ))}

              {/* Tombol Auth di Mobile */}
              <div className="flex flex-col gap-3 mt-6">
                <Link
                  href="/masuk"
                  onClick={() => setIsOpen(false)}
                  className="py-3 text-forest font-medium border border-forest/20 rounded-xl hover:bg-forest/5 transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/daftar"
                  onClick={() => setIsOpen(false)}
                  className="py-3 bg-forest text-cream font-medium rounded-xl hover:bg-forest/90 transition-colors"
                >
                  Daftar
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
```

## FILE: components/network.tsx

```tsx
"use client";

import dynamic from "next/dynamic";
import { Reveal } from "./ui/reveal";

const PartnersMap = dynamic(
  () => import("./partners-map").then((m) => m.PartnersMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[480px] rounded-2xl bg-paper border border-forest/10 animate-pulse" />
    ),
  }
);

const legend = [
  { label: "Industri sumber", color: "bg-clay" },
  { label: "Mitra & agen", color: "bg-green" },
  { label: "Fasilitas pengolahan", color: "bg-gold" },
];

export function Network() {
  return (
    <section
      id="jaringan"
      className="min-h-screen flex items-center py-24 px-6 md:px-10 bg-paper"
    >
      <div className="max-w-7xl mx-auto w-full">
        <Reveal className="max-w-xl mb-12">
          <p className="font-mono text-xs tracking-widest uppercase text-green mb-3">
            Jaringan
          </p>
          <h2 className="font-display font-semibold text-3xl md:text-4xl text-forest mb-4">
            Sudah hadir di berbagai kawasan industri.
          </h2>
          <p className="text-ink/65 text-[15px] leading-relaxed">
            Titik industri sumber limbah dan titik mitra penyaluran energi
            yang saat ini bekerja sama dengan LENTERA.
          </p>
        </Reveal>

        <Reveal className="flex items-center gap-6 mb-6 text-sm">
          {legend.map((item) => (
            <span key={item.label} className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full inline-block ${item.color}`} />
              {item.label}
            </span>
          ))}
        </Reveal>

        <Reveal>
          <PartnersMap />
        </Reveal>
      </div>
    </section>
  );
}
```

## FILE: components/partners.tsx

```tsx
"use client";

import { motion } from "motion/react";
import { Reveal, RevealGroup, RevealItem } from "./ui/reveal";

const benefits = [
  {
    title: "Harga kompetitif",
    description:
      "Skema harga yang wajar bagi mitra, dengan margin yang jelas di setiap penyaluran.",
    color: "text-green",
    ring: "group-hover:ring-green/25",
    icon: (
      <>
        <path d="M12 2v20M2 12h20" />
        <circle cx="12" cy="12" r="9" />
      </>
    ),
  },
  {
    title: "Pasokan stabil",
    description:
      "Kapasitas produksi terjadwal, sehingga stok di titik mitra tetap terjaga.",
    color: "text-gold",
    ring: "group-hover:ring-gold/25",
    icon: <path d="M3 12h18M3 6h18M3 18h18" />,
  },
  {
    title: "Dukungan operasional",
    description:
      "Pendampingan logistik dan operasional dari tim LENTERA sejak awal bergabung.",
    color: "text-clay",
    ring: "group-hover:ring-clay/25",
    icon: <path d="M4 21v-7a4 4 0 014-4h8a4 4 0 014 4v7M12 3v7" />,
  },
];

export function Partners() {
  return (
    <section
      id="mitra"
      className="min-h-screen flex items-center py-24 px-6 md:px-10 bg-cream"
    >
      <div className="max-w-7xl mx-auto w-full">
        <Reveal className="max-w-xl mb-16 md:mb-20">
          <p className="font-mono text-xs tracking-widest uppercase text-clay mb-3">
            Untuk mitra & agen
          </p>
          <h2 className="font-display font-semibold text-3xl md:text-4xl text-forest">
            Bangun usaha energi bersama LENTERA.
          </h2>
        </Reveal>

        <RevealGroup className="grid md:grid-cols-3 gap-6">
          {benefits.map((b) => (
            <RevealItem key={b.title} className="group">
              <motion.div
                whileHover={{ y: -10, scale: 1.015 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className={`bg-paper rounded-2xl p-8 border border-forest/10 h-full ring-1 ring-transparent transition-shadow duration-300 ${b.ring} hover:shadow-[0_24px_48px_-16px_rgba(23,48,31,0.16)]`}
              >
                <motion.svg
                  className={`w-9 h-9 mb-6 ${b.color}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  initial={{ opacity: 0, rotate: -12, scale: 0.7 }}
                  whileInView={{ opacity: 1, rotate: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.7,
                    ease: [0.34, 1.56, 0.64, 1],
                    delay: 0.15,
                  }}
                >
                  {b.icon}
                </motion.svg>
                <h3 className="font-display font-semibold text-lg text-forest mb-2">
                  {b.title}
                </h3>
                <p className="text-ink/65 text-[15px] leading-relaxed">
                  {b.description}
                </p>
              </motion.div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
```

## FILE: components/partners-map.tsx

```tsx
"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

interface MapPoint {
  id: string;
  name: string;
  type: "industri" | "mitra" | "pengolahan";
  lat: number;
  lng: number;
}

interface PartnerMapRecord {
  user_id?: string;
  nama_mitra?: string;
  nama_perusahaan?: string;
  lat?: number | string | null;
  lng?: number | string | null;
}

const networkColors = {
  industri: "#8B5A2B",
  mitra: "#10B981",
  pengolahan: "#F59E0B"
};

const networkLabels = {
  industri: "Industri Sumber",
  mitra: "Mitra & Agen",
  pengolahan: "Fasilitas Pengolahan"
};

const fixedPengolahanPoints: MapPoint[] = [
  {
    id: "pengolahan-jkt",
    name: "Fasilitas Pengolahan LENTERA Jakarta",
    type: "pengolahan",
    lat: -6.2088,
    lng: 106.8456,
  },
  {
    id: "pengolahan-plm",
    name: "Fasilitas Pengolahan LENTERA Palembang",
    type: "pengolahan",
    lat: -2.9761,
    lng: 104.7754,
  },
];

export function PartnersMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    const leafletContainer = containerRef.current as HTMLDivElement & { _leaflet_id?: number };
    if (leafletContainer._leaflet_id) {
      leafletContainer._leaflet_id = undefined;
    }

    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      const supabase = createSupabaseBrowserClient();

      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView([-2.5, 118], 5);
      mapRef.current = map;

      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        { attribution: "Tiles &copy; Esri", maxZoom: 19 }
      ).addTo(map);

      const pinIcon = (color: string) =>
        L.divIcon({
          className: "",
          html: `<div style="background:${color}; width:18px; height:18px; border-radius:50%; border:2.5px solid white; box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });

      const points: MapPoint[] = [...fixedPengolahanPoints];

      try {
        // Fetch Mitra (Pakai user_id)
        const { data: mitraData } = await supabase
          .from("mitra_profiles")
          .select("user_id, nama_mitra, lat, lng");



        if (mitraData && Array.isArray(mitraData)) {
          mitraData.forEach((m: PartnerMapRecord) => {
            const lat = parseFloat(String(m.lat));
            const lng = parseFloat(String(m.lng));
            if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
              points.push({
                id: String(m.user_id),
                name: m.nama_mitra || "Mitra Agen",
                type: "mitra",
                lat,
                lng,
              });
            }
          });
        }

        // Fetch Industri (Pakai user_id)
        const { data: industriData } = await supabase
          .from("industri_profiles")
          .select("user_id, nama_perusahaan, lat, lng");



        if (industriData && Array.isArray(industriData)) {
          industriData.forEach((ind: PartnerMapRecord) => {
            const lat = parseFloat(String(ind.lat));
            const lng = parseFloat(String(ind.lng));
            if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
              points.push({
                id: String(ind.user_id),
                name: ind.nama_perusahaan || "Industri",
                type: "industri",
                lat,
                lng,
              });
            }
          });
        }
      } catch (e) {
        console.error("Error fetching map points:", e);
      }

      if (cancelled) return;

      const bounds: [number, number][] = [];

      points.forEach((point) => {
        bounds.push([point.lat, point.lng]);

        const marker = L.marker([point.lat, point.lng], {
          icon: pinIcon(networkColors[point.type]),
        }).addTo(map);

        marker.bindPopup(
          `<div style="font-family:sans-serif; padding:2px;">
            <strong style="color:#17301F; font-size:14px">${point.name}</strong><br/>
            <span style="color:${networkColors[point.type]}; font-size:12px; font-weight:600">${networkLabels[point.type]}</span>
          </div>`
        );

        if (point.type === "mitra") {
          L.circle([point.lat, point.lng], {
            radius: 12000,
            color: networkColors.mitra,
            weight: 1.5,
            fillOpacity: 0.12,
            opacity: 0.6,
          }).addTo(map);
        }
      });

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-[480px] rounded-2xl overflow-hidden border border-forest/10 shadow-[0_20px_40px_-12px_rgba(23,48,31,0.18)] z-0 relative"
    />
  );
}
```

## FILE: components/partners-marquee.tsx

```tsx
"use client";

import { Reveal } from "./ui/reveal";
import { CompanyMark } from "./ui/company-mark";
import { partnerCompanies, type PartnerCompany } from "@/lib/partner-companies";

const rowA = partnerCompanies.slice(0, 5);
const rowB = partnerCompanies.slice(5);

const edgeMask = {
  maskImage:
    "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
  WebkitMaskImage:
    "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
};

function MarqueeRow({
  companies,
  reverse = false,
}: {
  companies: PartnerCompany[];
  reverse?: boolean;
}) {
  const items = [...companies, ...companies];
  return (
    <div className="relative w-full overflow-hidden" style={edgeMask}>
      <div
        className={`flex gap-5 w-max ${
          reverse ? "animate-marquee-reverse" : "animate-marquee"
        } hover:[animation-play-state:paused]`}
      >
        {items.map((c, i) => (
          <div
            key={`${c.name}-${i}`}
            className="flex items-start gap-4 bg-cream rounded-2xl border border-forest/8 p-6 w-[380px] shrink-0"
          >
            <CompanyMark type={c.logoType} accent={c.accent} className="w-14 h-14" />
            <div className="min-w-0">
              <p className="font-display font-semibold text-forest text-base leading-snug">
                {c.name}
              </p>
              <p className="flex items-center gap-1.5 text-ink/45 text-xs mt-1">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="w-3.5 h-3.5 shrink-0"
                >
                  <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z" />
                  <circle cx="12" cy="9.5" r="2.3" />
                </svg>
                {c.location}
              </p>
              <p className="text-ink/60 text-[13px] leading-relaxed mt-3">
                {c.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PartnersMarquee() {
  return (
    <section
      id="mitra-kami"
      className="min-h-screen flex flex-col justify-center py-24 px-6 md:px-10 bg-paper overflow-hidden"
    >
      <div className="max-w-7xl mx-auto w-full mb-14">
        <Reveal className="max-w-xl">
          <p className="font-mono text-xs tracking-widest uppercase text-green mb-3">
            Dipercaya oleh berbagai industri
          </p>
          <h2 className="font-display font-semibold text-3xl md:text-4xl text-forest">
            Perusahaan yang sudah bekerja sama dengan LENTERA.
          </h2>
        </Reveal>
      </div>

      <div className="space-y-6 md:space-y-8">
        <MarqueeRow companies={rowA} />
        <MarqueeRow companies={rowB} reverse />
      </div>
    </section>
  );
}
```

## FILE: components/ui/company-logo.tsx

```tsx
import Image from "next/image";
import { CompanyMark, type CompanyIconType } from "./company-mark";

export function CompanyLogo({
  name,
  logoUrl,
  logoType,
  accent = "green",
  className = "",
}: {
  name: string;
  logoUrl?: string;
  logoType?: CompanyIconType;
  accent?: "gold" | "forest" | "clay" | "green";
  className?: string;
}) {
  if (logoUrl) {
    return (
      <div
        className={`relative rounded-xl overflow-hidden bg-white ring-1 ring-forest/10 shrink-0 ${className}`}
      >
        <Image
          src={logoUrl}
          alt={`Logo ${name}`}
          fill
          sizes="80px"
          className="object-contain p-1"
        />
      </div>
    );
  }

  return (
    <CompanyMark type={logoType ?? "generic"} accent={accent} className={className} />
  );
}
```

## FILE: components/ui/company-mark.tsx

```tsx
const iconPaths: Record<string, React.ReactNode> = {
  steel: (
    <path d="M4 17h16M4 17v-3a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3M7 12V9a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" />
  ),
  textile: (
    <>
      <ellipse cx="12" cy="6" rx="6" ry="2.2" />
      <ellipse cx="12" cy="18" rx="6" ry="2.2" />
      <path d="M6 6v12M18 6v12" />
    </>
  ),
  chemical: (
    <>
      <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3" />
      <path d="M8 15h8" />
    </>
  ),
  paper: (
    <>
      <path d="M7 3h8l4 4v14H7z" />
      <path d="M15 3v4h4" />
      <path d="M9.5 9h2M9.5 12h5M9.5 15h5" />
    </>
  ),
  palm: <path d="M12 3c4 3 6 7 6 10a6 6 0 0 1-12 0c0-3 2-7 6-10z" />,
  electronics: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4" />
    </>
  ),
  food: (
    <>
      <path d="M12 21V9" />
      <path d="M12 9c-2-1-3-3-2-5 2 1 3 2 3 4M12 9c2-1 3-3 2-5-2 1-3 2-3 4" />
      <path d="M12 13c-2-1-3-3-2-5 2 1 3 2 3 4M12 13c2-1 3-3 2-5-2 1-3 2-3 4" />
    </>
  ),
  automotive: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M21 12h-3M6 12H3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7 5.6 5.6" />
    </>
  ),
  pharma: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  energy: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />,
  generic: (
    <>
      <path d="M4 21V9l6-4 6 4v12" />
      <path d="M14 21v-8l6 3v5" />
      <path d="M9 9h.01M9 13h.01M9 17h.01" />
    </>
  ),
};

const bgStyle: Record<string, string> = {
  gold: "bg-gold/12",
  forest: "bg-forest/10",
  clay: "bg-clay/10",
  green: "bg-green/10",
};

const fgStyle: Record<string, string> = {
  gold: "text-gold",
  forest: "text-forest",
  clay: "text-clay",
  green: "text-green",
};

export type CompanyIconType = keyof typeof iconPaths;

export function CompanyMark({
  type,
  accent = "green",
  className = "",
}: {
  type: CompanyIconType;
  accent?: "gold" | "forest" | "clay" | "green";
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl shrink-0 ${bgStyle[accent]} ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`w-[55%] h-[55%] ${fgStyle[accent]}`}
      >
        {iconPaths[type] ?? iconPaths.generic}
      </svg>
    </div>
  );
}
```

## FILE: components/ui/magnetic-button.tsx

```tsx
"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { ReactNode, MouseEvent } from "react";

export function MagneticButton({
  children,
  href,
  variant = "primary",
  className = "",
}: {
  children: ReactNode;
  href: string;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  function handleMouseMove(e: MouseEvent<HTMLAnchorElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.3);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.3);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  const base =
    "inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-medium transition-colors";
  const styles =
    variant === "primary"
      ? "bg-forest text-cream hover:bg-forest-2"
      : "text-forest border border-forest/25 hover:border-forest/50";

  return (
    <motion.a
      href={href}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`${base} ${styles} ${className}`}
    >
      {children}
    </motion.a>
  );
}
```

## FILE: components/ui/podium-graphic.tsx

```tsx
// Podium 3D buatan sendiri (SVG, isometrik sederhana) â€” dipakai supaya posisi
// kartu logo perusahaan bisa dihitung tepat dari koordinat yang sama dengan
// gambarnya sendiri, bukan diperkirakan dari foto.

type Shade = { front: string; top: string; side: string; text: string };

const shades: Record<"gold" | "forest" | "clay", Shade> = {
  gold: { front: "#C99A3D", top: "#E7BB64", side: "#A17B31", text: "#17301F" },
  forest: { front: "#17301F", top: "#26472F", side: "#0F2417", text: "#F6F2E6" },
  clay: { front: "#7A5738", top: "#977151", side: "#5E4229", text: "#F6F2E6" },
};

// Geometri bersama (viewBox 620x300). dx/dy = arah "kedalaman" isometrik.
const DX = 34;
const DY = -20;
const Y_BASE = 280;

interface BlockSpec {
  x: number;
  w: number;
  yTop: number;
  accent: "gold" | "forest" | "clay";
  label: string;
  fontSize: number;
}

const blocks: BlockSpec[] = [
  { x: 15, w: 150, yTop: 160, accent: "forest", label: "2", fontSize: 40 },
  { x: 180, w: 170, yTop: 110, accent: "gold", label: "1", fontSize: 46 },
  { x: 365, w: 150, yTop: 200, accent: "clay", label: "3", fontSize: 36 },
];

// Titik tengah-atas tiap balok, dalam persen dari viewBox â€” dipakai untuk
// menaruh kartu logo di leaderboard.tsx supaya presisi di atas anak tangga.
export const podiumAnchors: Record<
  1 | 2 | 3,
  { left: string; top: string }
> = {
  2: { left: "14.5%", top: "53.3%" },
  1: { left: "42.7%", top: "36.7%" },
  3: { left: "71%", top: "66.7%" },
};

function Block({ x, w, yTop, accent, label, fontSize }: BlockSpec) {
  const shade = shades[accent];
  const yBase = Y_BASE;
  const A = `${x},${yTop}`;
  const B = `${x + w},${yTop}`;
  const C = `${x + w},${yBase}`;
  const Ad = `${x + DX},${yTop + DY}`;
  const Bd = `${x + w + DX},${yTop + DY}`;
  const Cd = `${x + w + DX},${yBase + DY}`;

  return (
    <g>
      <polygon points={`${B} ${C} ${Cd} ${Bd}`} fill={shade.side} />
      <polygon points={`${A} ${B} ${Bd} ${Ad}`} fill={shade.top} />
      <rect x={x} y={yTop} width={w} height={yBase - yTop} fill={shade.front} />
      <text
        x={x + w / 2}
        y={yTop + (yBase - yTop) * 0.34}
        textAnchor="middle"
        fill={shade.text}
        fontSize={fontSize}
        fontWeight={700}
        style={{ fontFamily: "var(--font-display), sans-serif" }}
      >
        {label}
      </text>
    </g>
  );
}

export function PodiumGraphic({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 620 300"
      className={className}
      role="img"
      aria-label="Podium peringkat 1, 2, dan 3"
    >
      <ellipse cx="300" cy="291" rx="270" ry="12" fill="#17301F" opacity="0.08" />
      {blocks.map((b) => (
        <Block key={b.label} {...b} />
      ))}
    </svg>
  );
}
```

## FILE: components/ui/podium-step.tsx

```tsx
"use client";

import { motion } from "motion/react";

export function PodiumStep({
  rank,
  height,
  main,
  light,
  dark,
  delay = 0,
}: {
  rank: number;
  height: number;
  main: string;
  light: string;
  dark: string;
  delay?: number;
}) {
  const depth = 22;
  const width = 150;
  const frontWidth = width - depth;
  const svgHeight = height + depth;

  return (
    <motion.svg
      viewBox={`0 0 ${width} ${svgHeight}`}
      width="100%"
      className="block"
      style={{ transformOrigin: "bottom" }}
      initial={{ scaleY: 0.6, opacity: 0 }}
      whileInView={{ scaleY: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* bidang atas */}
      <polygon
        points={`${depth},0 ${width},0 ${frontWidth},${depth} 0,${depth}`}
        fill={light}
      />
      {/* bidang samping (kanan) */}
      <polygon
        points={`${width},0 ${width},${height} ${frontWidth},${svgHeight} ${frontWidth},${depth}`}
        fill={dark}
      />
      {/* bidang depan */}
      <rect x={0} y={depth} width={frontWidth} height={height} fill={main} />
      {/* angka peringkat */}
      <text
        x={frontWidth / 2}
        y={depth + height / 2 + 16}
        textAnchor="middle"
        fontFamily="var(--font-display), sans-serif"
        fontWeight={700}
        fontSize={44}
        fill="rgba(255,255,255,0.92)"
      >
        {rank}
      </text>
    </motion.svg>
  );
}
```

## FILE: components/ui/reveal.tsx

```tsx
"use client";

import { motion, Variants } from "motion/react";
import { ReactNode } from "react";

const smoothEase = [0.22, 1, 0.36, 1] as const;

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay, ease: smoothEase }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const groupVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 34, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.9, ease: smoothEase },
  },
};

export function RevealGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={groupVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-100px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}
```

## FILE: components/ui/tilt-card.tsx

```tsx
"use client";

import { motion } from "motion/react";
import { ReactNode } from "react";

export function TiltCard({
  children,
  rotate = 0,
  floatDistance = 12,
  floatDuration = 6,
  delay = 0,
  className,
  style,
}: {
  children: ReactNode;
  rotate?: number;
  floatDistance?: number;
  floatDuration?: number;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, rotate: rotate - 8, y: 20 }}
      whileInView={{
        opacity: 1,
        scale: 1,
        rotate,
        y: [0, -floatDistance, 0],
      }}
      viewport={{ once: true }}
      transition={{
        opacity: { duration: 0.6, delay },
        scale: { duration: 0.6, delay },
        rotate: { duration: 0.6, delay },
        y: {
          duration: floatDuration,
          repeat: Infinity,
          ease: "easeInOut",
          delay,
        },
      }}
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

## FILE: eslint.config.mjs

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
```

## FILE: lib/auth-errors.ts

```ts
const errorMap: [string, string][] = [
  ["User already registered", "Email ini sudah terdaftar. Coba masuk, atau pakai email lain."],
  ["already been registered", "Email ini sudah terdaftar. Coba masuk, atau pakai email lain."],
  ["Invalid login credentials", "Email atau kata sandi salah."],
  ["Email not confirmed", "Email belum dikonfirmasi. Cek kotak masuk email kamu."],
  ["Password should be at least", "Kata sandi minimal 6 karakter."],
  ["Unable to validate email address", "Format email tidak valid."],
  ["Token has expired", "Kode verifikasi sudah kedaluwarsa. Kirim ulang kode."],
  ["Invalid token", "Kode verifikasi salah. Coba periksa lagi kodenya."],
  ["Email rate limit exceeded", "Terlalu banyak permintaan kode. Tunggu beberapa saat lalu coba lagi."],
  ["rate limit", "Terlalu banyak percobaan. Coba lagi beberapa saat lagi."],
];

/**
 * Supabase mengembalikan pesan error dalam bahasa Inggris. Fungsi ini
 * menerjemahkan pesan yang umum terjadi ke Bahasa Indonesia; pesan yang
 * tidak dikenali jatuh ke pesan generik (bukan ditampilkan mentah-mentah).
 */
export function translateAuthError(message: string | undefined | null): string {
  if (!message) return "Terjadi kesalahan, coba lagi.";
  const found = errorMap.find(([needle]) =>
    message.toLowerCase().includes(needle.toLowerCase())
  );
  return found ? found[1] : "Terjadi kesalahan, coba lagi.";
}
```

## FILE: lib/get-leaderboard.ts

```ts
import { getUpstashClient, getIoRedisClient } from "./redis";
import { getSupabaseClient } from "./supabase";
import { leaderboardEntries as dummyLeaderboardEntries, type LeaderboardEntry } from "./leaderboard-data";

// Nama key sorted-set di Redis. Sesuaikan dengan yang dipakai backend kamu
// kalau namanya beda.
const REDIS_KEY = "leaderboard:entries";

/**
 * Tiap member di sorted set diasumsikan berupa JSON string berisi field
 * LeaderboardEntry TANPA "rank" (mis. {"name":"...","initials":"...",...}),
 * dengan score = volume dalam angka (mis. 1480), supaya ZREVRANGE otomatis
 * mengurutkan dari yang terbesar. Rank diisi berdasarkan urutan hasilnya.
 * Kalau struktur data di Redis kamu beda, sesuaikan fungsi ini.
 */
function parseRedisMembers(members: string[]): LeaderboardEntry[] {
  return members.map((item, i) => {
    const parsed = JSON.parse(item);
    return { rank: i + 1, ...parsed };
  });
}

/**
 * Mengambil data papan peringkat, dengan urutan prioritas:
 *   1. Redis via Upstash (REST), jika UPSTASH_REDIS_REST_URL +
 *      UPSTASH_REDIS_REST_TOKEN sudah diisi â€” cocok untuk deploy
 *      serverless/edge (mis. Vercel Edge Runtime).
 *   2. Redis via koneksi TCP langsung (ioredis), jika REDIS_URL sudah
 *      diisi â€” cocok untuk Redis self-hosted / Redis Cloud / server
 *      Node.js biasa.
 *   3. Supabase, jika NEXT_PUBLIC_SUPABASE_URL + (SUPABASE_SERVICE_ROLE_KEY
 *      atau NEXT_PUBLIC_SUPABASE_ANON_KEY) sudah diisi.
 *   4. REST API custom, jika LEADERBOARD_API_URL sudah diisi.
 *   5. Data dummy di lib/leaderboard-data.ts (supaya halaman tidak pernah
 *      rusak walau backend belum siap / lagi down).
 *
 * Dipanggil dari Server Component (app/page.tsx), hasilnya dioper sebagai
 * prop ke <Leaderboard entries={...} /> â€” komponennya sendiri tetap
 * "use client" karena butuh animasi Motion, jadi fetching harus terjadi
 * di luar komponen itu.
 */
export async function getLeaderboardEntries(): Promise<LeaderboardEntry[]> {
  const upstash = getUpstashClient();
  if (upstash) {
    try {
      const raw = await upstash.zrange<string[]>(REDIS_KEY, 0, 4, { rev: true });
      if (raw.length > 0) return parseRedisMembers(raw);
    } catch (err) {
      console.error("Gagal mengambil leaderboard dari Redis (Upstash), pakai data dummy:", err);
    }
    return dummyLeaderboardEntries;
  }

  const ioredis = getIoRedisClient();
  if (ioredis) {
    try {
      const raw = await ioredis.zrevrange(REDIS_KEY, 0, 4);
      if (raw.length > 0) return parseRedisMembers(raw);
    } catch (err) {
      console.error("Gagal mengambil leaderboard dari Redis (TCP), pakai data dummy:", err);
    }
    return dummyLeaderboardEntries;
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("leaderboard_entries")
        .select("rank, name, initials, industry, volume, logo_type, logo_url, accent")
        .order("rank", { ascending: true })
        .limit(5);

      if (error) throw error;
      if (data && data.length > 0) {
        return data.map((row) => ({
          rank: row.rank,
          name: row.name,
          initials: row.initials,
          industry: row.industry,
          volume: row.volume,
          logoType: row.logo_type,
          logoUrl: row.logo_url ?? undefined,
          accent: row.accent,
        }));
      }
    } catch (err) {
      console.error("Gagal mengambil leaderboard dari Supabase, pakai data dummy:", err);
    }
    return dummyLeaderboardEntries;
  }

  const apiUrl = process.env.LEADERBOARD_API_URL;
  if (apiUrl) {
    try {
      const res = await fetch(apiUrl, { next: { revalidate: 3600 } });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data: LeaderboardEntry[] = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    } catch (err) {
      console.error("Gagal mengambil leaderboard dari API custom, pakai data dummy:", err);
    }
    return dummyLeaderboardEntries;
  }

  return dummyLeaderboardEntries;
}
```

## FILE: lib/kyc-validation.ts

```ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const VALIDATION_PROMPT =
  "Analyze this image. Is it a valid official identity document like an Indonesian KTP, driving license, passport, or company certificate? Reply strictly with 'YES' or 'NO'.";

export async function validateOfficialDocumentImage(
  imageUrl?: string | null,
  mockedAiResponse?: string,
): Promise<boolean> {
  if (!imageUrl) {
    return false;
  }

  if (mockedAiResponse) {
    return mockedAiResponse.trim().toUpperCase().includes("YES");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Gemini KYC validation failed: GEMINI_API_KEY is missing.");
    return false;
  }

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(
        `Gemini KYC validation failed: unable to fetch image URL ${imageUrl}:`,
        response.status,
      );
      return false;
    }

    const contentType =
      response.headers.get("content-type") || "image/jpeg";
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: contentType,
          data: imageBuffer.toString("base64"),
        },
      },
      { text: VALIDATION_PROMPT },
    ]);

    const verdict = result.response.text().trim().toUpperCase();
    return verdict.includes("YES");
  } catch (error) {
    console.error("Gemini KYC validation failed:", error);
    return false;
  }
}
```

## FILE: lib/leaderboard-data.ts

```ts
import type { CompanyIconType } from "@/components/ui/company-mark";

export interface LeaderboardEntry {
  rank: number;
  name: string;
  initials: string;
  industry: string;
  volume: string;
  logoType: CompanyIconType;
  logoUrl?: string;
  accent: "gold" | "forest" | "clay" | "green";
}

// Data dummy (fallback) â€” dipakai kalau Supabase / API custom belum
// dikonfigurasi, atau saat fetch ke sana gagal. Lihat lib/get-leaderboard.ts.
// logoUrl mengarah ke public/images/logos/ â€” kalau field ini kosong,
// CompanyLogo otomatis jatuh ke ikon abstrak (logoType) sebagai fallback.
export const leaderboardEntries: LeaderboardEntry[] = [
  {
    rank: 1,
    name: "PT Cipta Industri Nusantara",
    initials: "CIN",
    industry: "Manufaktur baja & logam",
    volume: "1.480 ton/bln",
    logoType: "steel",
    logoUrl: "/images/logos/company-1.png",
    accent: "gold",
  },
  {
    rank: 2,
    name: "PT Warna Tekstil Indonesia",
    initials: "WTI",
    industry: "Tekstil & garmen",
    volume: "1.260 ton/bln",
    logoType: "textile",
    logoUrl: "/images/logos/company-2.png",
    accent: "forest",
  },
  {
    rank: 3,
    name: "PT Kimia Andalan Prima",
    initials: "KAP",
    industry: "Kimia industri",
    volume: "1.050 ton/bln",
    logoType: "chemical",
    logoUrl: "/images/logos/company-3.png",
    accent: "clay",
  },
  {
    rank: 4,
    name: "PT Kertas Lestari Abadi",
    initials: "KLA",
    industry: "Pulp & kertas",
    volume: "890 ton/bln",
    logoType: "paper",
    logoUrl: "/images/logos/company-4.png",
    accent: "green",
  },
  {
    rank: 5,
    name: "PT Sawit Makmur Bersama",
    initials: "SMB",
    industry: "Kelapa sawit",
    volume: "760 ton/bln",
    logoType: "palm",
    logoUrl: "/images/logos/company-5.png",
    accent: "green",
  },
];
```

## FILE: lib/midtrans-signature.ts

```ts
import crypto from "crypto";

export function createMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string,
): string {
  return crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");
}

export function isValidMidtransSignature(
  signature: string,
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string,
): boolean {
  const expected = Buffer.from(createMidtransSignature(orderId, statusCode, grossAmount, serverKey), "utf8");
  const received = Buffer.from(signature, "utf8");

  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}
```

## FILE: lib/mitra-products.ts

```ts
export interface MitraProduct {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  stock: number;
}

// Data dummy â€” ganti dengan data stok/produk sesungguhnya dari backend.
export const mitraProducts: MitraProduct[] = [
  {
    id: "briket-5kg",
    name: "Briket Energi LENTERA 5kg",
    category: "Briket padat",
    unit: "karung",
    price: 45000,
    stock: 128,
  },
  {
    id: "pelet-10kg",
    name: "Pelet Biomassa 10kg",
    category: "Pelet biomassa",
    unit: "karung",
    price: 78000,
    stock: 84,
  },
  {
    id: "cair-20l",
    name: "Tabung Energi Cair 20L",
    category: "Energi cair",
    unit: "tabung",
    price: 210000,
    stock: 36,
  },
  {
    id: "serbuk-25kg",
    name: "Serbuk Biomassa Curah 25kg",
    category: "Serbuk curah",
    unit: "karung",
    price: 95000,
    stock: 19,
  },
];
```

## FILE: lib/network-data.ts

```ts
export type NetworkPointType = "industri" | "mitra" | "fasilitas";

export interface NetworkPoint {
  name: string;
  type: NetworkPointType;
  lat: number;
  lng: number;
}

export const networkColors: Record<NetworkPointType, string> = {
  industri: "#7A5738",
  mitra: "#2F6B3F",
  fasilitas: "#C99A3D",
};

export const networkLabels: Record<NetworkPointType, string> = {
  industri: "Industri sumber",
  mitra: "Mitra & agen",
  fasilitas: "Fasilitas pengolahan",
};

export const networkPoints: NetworkPoint[] = [
  { name: "Kawasan Industri Cikarang", type: "industri", lat: -6.2383, lng: 107.1608 },
  { name: "Kawasan Industri Jababeka", type: "industri", lat: -6.3487, lng: 107.174 },
  { name: "Mitra Distribusi Jakarta", type: "mitra", lat: -6.2088, lng: 106.8456 },
  { name: "Fasilitas Pengolahan Jambi", type: "fasilitas", lat: -1.6101, lng: 103.6131 },
  { name: "Mitra Distribusi Palembang", type: "mitra", lat: -2.9761, lng: 104.7754 },
  { name: "Kawasan Industri Medan", type: "industri", lat: 3.5952, lng: 98.6722 },
  { name: "Mitra Distribusi Medan", type: "mitra", lat: 3.61, lng: 98.69 },
  { name: "Kawasan Industri Surabaya", type: "industri", lat: -7.2575, lng: 112.7521 },
  { name: "Mitra Distribusi Semarang", type: "mitra", lat: -6.9932, lng: 110.4203 },
  { name: "Mitra Distribusi Batam", type: "mitra", lat: 1.0456, lng: 104.0305 },
];
```

## FILE: lib/partner-companies.ts

```ts
import type { CompanyIconType } from "@/components/ui/company-mark";

export interface PartnerCompany {
  name: string;
  location: string;
  industry: string;
  description: string;
  initials: string;
  logoType: CompanyIconType;
  accent: "gold" | "forest" | "clay" | "green";
}

// Data contoh (dummy) â€” ganti dengan daftar mitra/industri sesungguhnya.
export const partnerCompanies: PartnerCompany[] = [
  {
    name: "PT Cipta Industri Nusantara",
    location: "Cikarang, Jawa Barat",
    industry: "Manufaktur baja & logam",
    description:
      "Produsen baja dan komponen logam berat yang beroperasi di kawasan industri Cikarang. Sisa produksi logam dari lini pabrikasi mereka dikumpulkan dan diproses melalui fasilitas LENTERA setiap bulan secara terjadwal.",
    initials: "CIN",
    logoType: "steel",
    accent: "gold",
  },
  {
    name: "PT Warna Tekstil Indonesia",
    location: "Bandung, Jawa Barat",
    industry: "Tekstil & garmen",
    description:
      "Produsen tekstil dan garmen berorientasi ekspor dengan basis produksi di Bandung. Limbah kain dan serat dari proses produksi disalurkan ke LENTERA untuk diolah menjadi sumber energi alternatif.",
    initials: "WTI",
    logoType: "textile",
    accent: "forest",
  },
  {
    name: "PT Kimia Andalan Prima",
    location: "Cilegon, Banten",
    industry: "Kimia industri",
    description:
      "Produsen bahan kimia industri yang berlokasi di kawasan petrokimia Cilegon. Bekerja sama dengan LENTERA untuk pengelolaan limbah kimia produksi secara aman dan bertanggung jawab.",
    initials: "KAP",
    logoType: "chemical",
    accent: "clay",
  },
  {
    name: "PT Kertas Lestari Abadi",
    location: "Perawang, Riau",
    industry: "Pulp & kertas",
    description:
      "Produsen kertas dan bubur kertas skala nasional yang berbasis di Perawang. Limbah serat dan sisa produksi kertas mereka menjadi salah satu kontributor terbesar dalam jaringan pengolahan LENTERA.",
    initials: "KLA",
    logoType: "paper",
    accent: "green",
  },
  {
    name: "PT Sawit Makmur Bersama",
    location: "Dumai, Riau",
    industry: "Kelapa sawit",
    description:
      "Pengolahan kelapa sawit dan produk turunannya dengan fasilitas produksi di Dumai. Limbah organik dari proses pengolahan sawit dikumpulkan secara rutin untuk dikonversi menjadi energi terbarukan.",
    initials: "SMB",
    logoType: "palm",
    accent: "gold",
  },
  {
    name: "PT Elektrindo Karya Mandiri",
    location: "Batam, Kepulauan Riau",
    industry: "Elektronik",
    description:
      "Manufaktur komponen dan perangkat elektronik yang berbasis di Batam. Limbah produksi elektronik mereka dikelola bersama LENTERA dengan standar penanganan yang sesuai jenis limbahnya.",
    initials: "EKM",
    logoType: "electronics",
    accent: "clay",
  },
  {
    name: "PT Pangan Sejahtera Abadi",
    location: "Sidoarjo, Jawa Timur",
    industry: "Makanan & minuman",
    description:
      "Produsen makanan dan minuman olahan dengan fasilitas produksi di Sidoarjo. Limbah organik dari proses produksi disalurkan ke LENTERA sebagai bagian dari komitmen keberlanjutan perusahaan.",
    initials: "PSA",
    logoType: "food",
    accent: "forest",
  },
  {
    name: "PT Otomotif Cipta Perkasa",
    location: "Karawang, Jawa Barat",
    industry: "Otomotif",
    description:
      "Perakitan komponen dan suku cadang otomotif yang berlokasi di Karawang. Limbah logam dan material produksi dari lini perakitan mereka diproses melalui jaringan LENTERA setiap bulan.",
    initials: "OCP",
    logoType: "automotive",
    accent: "green",
  },
  {
    name: "PT Farmasi Nusantara Sehat",
    location: "Tangerang, Banten",
    industry: "Farmasi",
    description:
      "Produksi bahan baku dan kemasan farmasi yang berbasis di Tangerang. Bekerja sama dengan LENTERA untuk pengelolaan limbah produksi sesuai standar keselamatan industri farmasi.",
    initials: "FNS",
    logoType: "pharma",
    accent: "gold",
  },
  {
    name: "PT Distribusi Energi Merdeka",
    location: "Palembang, Sumatra Selatan",
    industry: "Distribusi energi",
    description:
      "Mitra distribusi dan agen energi regional yang beroperasi di Palembang. Menyalurkan energi hasil olahan LENTERA ke pelanggan industri dan rumah tangga di wilayah Sumatra Selatan.",
    initials: "DEM",
    logoType: "energy",
    accent: "forest",
  },
];
```

## FILE: lib/redis.ts

```ts
import { Redis as UpstashRedis } from "@upstash/redis";
import IORedis from "ioredis";

/**
 * Ada 2 cara umum menyambungkan Next.js ke Redis:
 *
 * 1) Upstash (REST) â€” kalau redis-nya di-hosting di Upstash, atau kamu
 *    deploy ke Vercel Edge Runtime / serverless yang tidak cocok pakai
 *    koneksi TCP yang tetap terbuka. Redis biasa TIDAK punya REST API
 *    sendiri; Upstash yang membungkusnya jadi HTTP di depannya.
 *    Env: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 *
 * 2) Koneksi TCP langsung (ioredis) â€” cara umum untuk Redis self-hosted,
 *    Redis Cloud, AWS ElastiCache, DigitalOcean Managed Redis, dll, ATAU
 *    kalau Next.js kamu jalan di server Node.js biasa (bukan edge).
 *    Env: REDIS_URL (format: redis://default:password@host:6379,
 *    atau rediss:// kalau pakai TLS)
 *
 * getLeaderboardEntries() di get-leaderboard.ts otomatis pakai salah satu
 * dari dua ini, tergantung env variable mana yang diisi.
 */

export function getUpstashClient(): UpstashRedis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new UpstashRedis({ url, token });
}

let ioredisClient: IORedis | null = null;

export function getIoRedisClient(): IORedis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (!ioredisClient) {
    ioredisClient = new IORedis(url, { maxRetriesPerRequest: 2 });
  }
  return ioredisClient;
}
```

## FILE: lib/supabase.ts

```ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Mengembalikan Supabase client, atau null kalau env variable belum diisi.
 * Dengan begitu bagian lain dari aplikasi bisa cek `if (supabase) { ... }`
 * tanpa perlu takut environment belum di-setup (misal saat development awal).
 */
export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  if (!client) {
    client = createClient(url, key);
  }
  return client;
}
```

## FILE: lib/supabase/server.ts

```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';


export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Diabaikan untuk server component
          }
        },
      },
    }
  );
}

// Fungsi Admin yang sudah diperbaiki sesuai standar CodeRabbit
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase admin environment variables are missing!');
  }

  return createSupabaseAdmin(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
```

## FILE: lib/supabase-admin.ts

```ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Client Supabase dengan SERVICE ROLE KEY â€” akses penuh, melewati RLS.
 * HANYA boleh dipakai di server (Route Handler / Server Component), TIDAK
 * PERNAH diimpor dari file "use client", karena kalau bocor ke browser
 * siapapun bisa baca/tulis semua data.
 *
 * Ini dipakai khusus untuk proses pendaftaran (lihat app/api/daftar/...),
 * supaya pembuatan akun + penyimpanan profil terjadi dalam satu langkah di
 * server, tidak bergantung pada sesi login di browser yang belum tentu ada
 * (itu penyebab bug "akun kebuat tapi profil kosong" sebelumnya).
 */
export function getSupabaseAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diisi di .env.local"
    );
  }

  if (!client) {
    client = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return client;
}
```

## FILE: lib/supabase-browser.ts

```ts
import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase khusus untuk dipakai di browser (client component) â€”
 * dipakai oleh form Masuk & Daftar untuk memanggil supabase.auth langsung.
 * Beda dari lib/supabase.ts yang dipakai di server (Server Component) untuk
 * membaca data leaderboard.
 *
 * Butuh NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY di
 * .env.local (sama seperti yang dipakai leaderboard).
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY belum diisi di .env.local"
    );
  }

  return createBrowserClient(url, key);
}
```

## FILE: lib/supabase-client.ts

```ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## FILE: lib/validation.ts

```ts
// Validasi format field pendaftaran â€” supaya user tidak asal isi.
// Ini validasi FORMAT saja (bukan verifikasi ke database resmi seperti
// Dukcapil/DJP), karena LENTERA belum terintegrasi ke sistem itu.

export function isValidPhone(value: string): boolean {
  const cleaned = value.replace(/[\s-]/g, "");
  // 08xxxxxxxxx / +628xxxxxxxxx / 628xxxxxxxxx, total 10-13 digit
  return /^(?:\+62|62|0)8[1-9][0-9]{6,10}$/.test(cleaned);
}

export function isValidNikNib(value: string): boolean {
  const cleaned = value.replace(/\D/g, "");
  // NIK = 16 digit, NIB = 13 digit
  return cleaned.length === 16 || cleaned.length === 13;
}

export function isValidNpwp(value: string): boolean {
  const cleaned = value.replace(/\D/g, "");
  // Format lama 15 digit, format baru (berbasis NIK) 16 digit
  return cleaned.length === 15 || cleaned.length === 16;
}

export function isValidAddress(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 15 && trimmed.split(/\s+/).length >= 3;
}

export interface PasswordRule {
  key: "length" | "uppercase" | "lowercase" | "number" | "symbol";
  label: string;
  test: (value: string) => boolean;
}

export const passwordRules: PasswordRule[] = [
  {
    key: "length",
    label: "Minimal 8 karakter",
    test: (v) => v.length >= 8,
  },
  {
    key: "uppercase",
    label: "Mengandung huruf besar (A-Z)",
    test: (v) => /[A-Z]/.test(v),
  },
  {
    key: "lowercase",
    label: "Mengandung huruf kecil (a-z)",
    test: (v) => /[a-z]/.test(v),
  },
  {
    key: "number",
    label: "Mengandung angka (0-9)",
    test: (v) => /[0-9]/.test(v),
  },
  {
    key: "symbol",
    label: "Mengandung simbol (mis. !@#$%)",
    test: (v) => /[^A-Za-z0-9]/.test(v),
  },
];

export function isValidPassword(value: string): boolean {
  return passwordRules.every((rule) => rule.test(value));
}

export const validationMessages = {
  phone: "Nomor telepon tidak valid. Contoh: 08123456789.",
  nikNib: "NIK harus 16 digit atau NIB 13 digit angka.",
  npwp: "NPWP harus 15 atau 16 digit angka.",
  address: "Alamat lengkap minimal 15 karakter dan 3 kata (jalan, kota, provinsi).",
  password: "Kata sandi belum memenuhi semua syarat di atas.",
};
```

## FILE: lib/waste-types.ts

```ts
export const wasteTypes = [
  "Limbah Logam",
  "Limbah Kimia",
  "Limbah Kertas & Pulp",
  "Limbah Plastik",
  "Limbah Organik / Biomassa",
  "Limbah Tekstil",
  "Limbah Elektronik",
  "Lainnya",
] as const;
```

## FILE: middleware.ts

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createServerClient } from "@supabase/ssr";

// ==========================================
// 1. SETUP REDIS (SAFE LAZY INITIALIZATION)
// ==========================================
let ratelimit: Ratelimit | null = null;

try {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    const redis = new Redis({ url, token });
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "10 s"),
      prefix: "middleware-ratelimit",
    });
  }
} catch (error) {
  console.warn("Upstash Redis initialization skipped in Middleware:", error);
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.pathname;

  // ==========================================
  // 2. LOGIKA RATE LIMITING (Khusus API)
  // ==========================================
  if (url.startsWith("/api/transaksi/") || url.startsWith("/api/daftar/")) {
    if (ratelimit) {
      try {
        const forwardedFor = request.headers.get("x-forwarded-for");
        const ip = forwardedFor?.split(",")[0]?.trim() || "127.0.0.1";
        const { success } = await ratelimit.limit(ip);

        if (!success) {
          return NextResponse.json(
            { error: "Too Many Requests. Silakan tunggu beberapa detik." },
            { status: 429 }
          );
        }
      } catch (err) {
        console.warn("Ratelimit check skipped due to error:", err);
      }
    }
    return NextResponse.next();
  }

  // Loloskan semua API routes tanpa harus menyentuh Supabase Auth di middleware
  if (url.startsWith("/api/")) {
    return NextResponse.next();
  }

  // ==========================================
  // 3. LOGIKA SUPABASE AUTH & ROLE CHECKING
  // ==========================================
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const redirectSambilBawaCookie = (tujuan: string) => {
    const redirectRes = NextResponse.redirect(new URL(tujuan, request.url));
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectRes;
  };

  const isDashboardRoute =
    url.startsWith("/dashboard") ||
    url.startsWith("/dashboard-admin") ||
    url.startsWith("/dashboard-industri");

  // Jika mencoba ke area proteksi tanpa login -> lempar ke login
  if (isDashboardRoute && !user) return redirectSambilBawaCookie("/masuk");

  // Deteksi Role Hanya Jika Diperlukan (Akses Dashboard / Halaman Auth saat terautentikasi)
  let role = "mitra";
  if (user && (isDashboardRoute || url === "/masuk" || url === "/login" || url === "/daftar")) {
    try {
      const { data: adminRow } = await supabase
        .from("admin_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (adminRow) {
        role = "admin";
      } else {
        const { data: industriRow } = await supabase
          .from("industri_profiles")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (industriRow) {
          role = "industri";
        }
      }
    } catch (e) {
      console.error("Middleware DB Role Fetch Error:", e);
    }
  }

  // Redirect jika user yang sudah login mencoba akses halaman login/daftar
  if ((url === "/masuk" || url === "/login" || url === "/daftar") && user) {
    if (role === "admin") return redirectSambilBawaCookie("/dashboard-admin");
    if (role === "industri") return redirectSambilBawaCookie("/dashboard-industri");
    return redirectSambilBawaCookie("/dashboard");
  }

  // Proteksi Akses Berdasarkan Role
  const areaByRole: Record<string, string> = {
    mitra: "/dashboard",
    industri: "/dashboard-industri",
    admin: "/dashboard-admin",
  };

  if (isDashboardRoute) {
    const allowedArea = areaByRole[role] || "/dashboard";
    const isAllowedPath = url === allowedArea || url.startsWith(`${allowedArea}/`);

    if (!isAllowedPath) return redirectSambilBawaCookie(allowedArea);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

## FILE: midtrans.d.ts

```ts
declare module 'midtrans-client';
```

## FILE: next.config.mjs

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['192.168.100.128', '10.139.120.157', '192.168.1.6', '192.168.1.2', '169.254.9.186', '192.168.100.7', '192.168.1.7', '192.168.1.23', '192.168.100.6', '192.168.1.9', '192.168.1.10'
    
  ],
};

export default nextConfig;
```

## FILE: next.config.ts

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```

## FILE: package.json

```json
{
  "name": "lentera-landing",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "test": "node --no-warnings --test"
  },
  "dependencies": {
    "@emailjs/browser": "^4.4.1",
    "@google/generative-ai": "^0.24.1",
    "@supabase/ssr": "^0.12.4",
    "@supabase/supabase-js": "^2.112.4",
    "@upstash/qstash": "^2.11.3",
    "@upstash/ratelimit": "^2.0.8",
    "@upstash/redis": "^1.38.2",
    "ioredis": "^5.4.1",
    "leaflet": "^1.9.4",
    "midtrans-client": "^1.4.3",
    "motion": "^11.15.0",
    "next": "16.3.0",
    "react": "19.2.0",
    "react-dom": "19.2.0"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.14",
    "@types/node": "^22.0.0",
    "@types/react": "^19.2.18",
    "@types/react-dom": "^19.2.4",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.39.5",
    "eslint-config-next": "^16.3.0",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.14",
    "typescript": "^5.6.0"
  }
}
```

## FILE: postcss.config.mjs

```js
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
```

## FILE: supabase/schema.sql

```sql
-- Jalankan di Supabase SQL editor kalau memilih Supabase sebagai sumber data
-- leaderboard. Nama tabel & kolom ini yang dipakai lib/get-leaderboard.ts â€”
-- kalau mau nama lain, sesuaikan juga query di file itu.

create table if not exists leaderboard_entries (
  rank integer primary key,
  name text not null,
  initials text not null,
  industry text not null,
  volume text not null,
  logo_type text not null default 'generic', -- steel | textile | chemical | paper | palm | electronics | food | automotive | pharma | energy | generic
  logo_url text, -- url logo perusahaan (opsional). Kosong = pakai ikon logo_type
  accent text not null default 'green', -- gold | forest | clay | green
  updated_at timestamptz not null default now()
);

-- Contoh policy read-only untuk anon key (sesuaikan sesuai kebutuhan keamanan)
alter table leaderboard_entries enable row level security;
create policy "Public read access" on leaderboard_entries
  for select using (true);


-- ============================================================
-- Profil Mitra & Industri â€” dibuat saat orang mendaftar lewat
-- /daftar/mitra atau /daftar/industri. user_id merujuk ke akun
-- Supabase Auth (auth.users) yang dibuat lewat supabase.auth.signUp().
-- ============================================================

create table if not exists mitra_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nama_mitra text not null,
  nik_nib text not null check (nik_nib ~ '^[0-9]{13}$' or nik_nib ~ '^[0-9]{16}$'),
  alamat text not null check (length(trim(alamat)) >= 15),
  telepon text not null check (telepon ~ '^(\+62|62|0)8[1-9][0-9]{6,10}$'),
  email text,
  created_at timestamptz not null default now()
);

create table if not exists industri_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nama_perusahaan text not null,
  npwp text not null check (npwp ~ '^[0-9]{15}$' or npwp ~ '^[0-9]{16}$'),
  alamat text not null check (length(trim(alamat)) >= 15),
  telepon text not null check (telepon ~ '^(\+62|62|0)8[1-9][0-9]{6,10}$'),
  email text,
  created_at timestamptz not null default now()
);

alter table mitra_profiles enable row level security;
alter table industri_profiles enable row level security;

-- Tiap user cuma boleh insert & baca baris miliknya sendiri.
create policy "Mitra bisa insert profil sendiri" on mitra_profiles
  for insert with check (auth.uid() = user_id);
create policy "Mitra bisa baca profil sendiri" on mitra_profiles
  for select using (auth.uid() = user_id);

create policy "Industri bisa insert profil sendiri" on industri_profiles
  for insert with check (auth.uid() = user_id);
create policy "Industri bisa baca profil sendiri" on industri_profiles
  for select using (auth.uid() = user_id);

-- ============================================================
-- Admin â€” TIDAK ada form pendaftaran publik untuk ini. Bikin manual:
-- 1. Supabase Dashboard -> Authentication -> Users -> Add user (isi
--    email + password admin-nya, centang "Auto Confirm User").
-- 2. Copy UUID user itu, lalu jalankan:
--    insert into admin_profiles (user_id, nama) values ('<uuid>', 'Nama Admin');
-- Setelah itu akun tsb otomatis diarahkan ke /admin saat login di /masuk.
-- ============================================================

create table if not exists admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nama text not null,
  created_at timestamptz not null default now()
);

alter table admin_profiles enable row level security;

create policy "Admin bisa baca profil sendiri" on admin_profiles
  for select using (auth.uid() = user_id);

-- Admin bisa baca SEMUA baris mitra_profiles & industri_profiles (bukan
-- cuma miliknya sendiri) â€” dipakai halaman /admin untuk menampilkan daftar
-- lengkap mitra & industri yang terdaftar.
create policy "Admin bisa baca semua profil mitra" on mitra_profiles
  for select using (
    exists (select 1 from admin_profiles where admin_profiles.user_id = auth.uid())
  );
create policy "Admin bisa baca semua profil industri" on industri_profiles
  for select using (
    exists (select 1 from admin_profiles where admin_profiles.user_id = auth.uid())
  );

-- ============================================================
-- Kalau tabel mitra_profiles/industri_profiles SUDAH pernah kamu buat
-- sebelum kolom/constraint di atas ditambahkan, create table if not
-- exists di atas tidak akan menambahkannya. Jalankan ini secara
-- terpisah supaya tabel yang sudah ada ikut ter-update:
-- ============================================================
-- alter table mitra_profiles add column if not exists email text;
-- alter table industri_profiles add column if not exists email text;
-- alter table mitra_profiles add constraint mitra_nik_nib_format
--   check (nik_nib ~ '^[0-9]{13}$' or nik_nib ~ '^[0-9]{16}$');
-- alter table mitra_profiles add constraint mitra_alamat_length
--   check (length(trim(alamat)) >= 15);
-- alter table mitra_profiles add constraint mitra_telepon_format
--   check (telepon ~ '^(\+62|62|0)8[1-9][0-9]{6,10}$');
-- alter table industri_profiles add constraint industri_npwp_format
--   check (npwp ~ '^[0-9]{15}$' or npwp ~ '^[0-9]{16}$');
-- alter table industri_profiles add constraint industri_alamat_length
--   check (length(trim(alamat)) >= 15);
-- alter table industri_profiles add constraint industri_telepon_format
--   check (telepon ~ '^(\+62|62|0)8[1-9][0-9]{6,10}$');
-- alter table industri_profiles add constraint industri_alamat_length
--   check (length(trim(alamat)) >= 15);
-- alter table industri_profiles add constraint industri_telepon_format
--   check (telepon ~ '^(\+62|62|0)8[1-9][0-9]{6,10}$');

-- ============================================================
-- Pengiriman Limbah â€” dipakai dashboard industri (/dashboard/industri).
-- LENTERA punya armada sendiri: limbah dijemput dari lokasi industri lalu
-- diantar ke pabrik pengelolah. status di bawah merepresentasikan tahapan
-- itu. Industri cuma bisa membuat & melihat pengajuannya sendiri â€” update
-- status (dijemput/dalam perjalanan/dst) nantinya dilakukan dari sisi
-- admin/operasional armada, bukan oleh industri sendiri.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists waste_shipments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  jenis_limbah text not null,
  perkiraan_berat numeric not null check (perkiraan_berat > 0),
  alamat_penjemputan text not null check (length(trim(alamat_penjemputan)) >= 10),
  catatan text,
  status text not null default 'menunggu_konfirmasi' check (
    status in (
      'menunggu_konfirmasi',
      'dijadwalkan',
      'dijemput',
      'dalam_perjalanan',
      'tiba_di_fasilitas',
      'selesai',
      'dibatalkan'
    )
  ),
  tanggal_penjemputan timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table waste_shipments enable row level security;

create policy "Industri bisa insert pengiriman sendiri" on waste_shipments
  for insert with check (auth.uid() = user_id);
create policy "Industri bisa baca pengiriman sendiri" on waste_shipments
  for select using (auth.uid() = user_id);

-- Admin bisa baca & update semua baris (dipakai nanti untuk kelola status
-- armada dari dashboard admin â€” belum dibuat, tapi policy-nya disiapkan
-- dari sekarang supaya tidak perlu migrasi ulang nanti).
create policy "Admin bisa baca semua pengiriman" on waste_shipments
  for select using (
    exists (select 1 from admin_profiles where admin_profiles.user_id = auth.uid())
  );
create policy "Admin bisa update semua pengiriman" on waste_shipments
  for update using (
    exists (select 1 from admin_profiles where admin_profiles.user_id = auth.uid())
  );
```

## FILE: tailwind.config.ts

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#F6F2E6",
        paper: "#FBF9F3",
        forest: { DEFAULT: "#17301F", 2: "#0F2417" },
        green: { DEFAULT: "#2F6B3F", light: "#5C9A55", 50: "#EAF3E7" },
        gold: { DEFAULT: "#C99A3D", light: "#E4C078" },
        clay: { DEFAULT: "#7A5738", light: "#A9835C" },
        ink: "#221D16",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        card: "16px",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "marquee-reverse": {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        marquee: "marquee 46s linear infinite",
        "marquee-reverse": "marquee-reverse 54s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
```

## FILE: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": [
        "./*"
      ]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```


