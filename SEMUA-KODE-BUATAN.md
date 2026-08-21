# Semua Kode Buatan LENTERA

Dokumen ini dibuat dari source aktual repository. File `.env`, dependency, build output, dan dokumen ini sendiri tidak disertakan.

## FILE: app/api/admin/calon-mitra/route.ts

```ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; // Sesuaikan path jika beda

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak ada akses (Unauthorized)' }, { status: 401 });
    }

    // WAJIB CEK: Apakah dia benar-benar Admin?
    if (user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak! Anda bukan admin.' }, { status: 403 });
    }

    // Tarik semua agen dan perusahaan yang statusnya 'pending'
    const [agen, perusahaan] = await Promise.all([
      supabase.from('agen').select('*').eq('status_verifikasi', 'pending'),
      supabase.from('perusahaan_industri').select('*').eq('status_verifikasi', 'pending'),
    ]);

    if (agen.error) throw agen.error;
    if (perusahaan.error) throw perusahaan.error;

    return NextResponse.json(
      { message: 'Berhasil mengambil calon mitra', agen: agen.data, perusahaan: perusahaan.data },
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
import { createAdminClient } from '@/lib/supabase/server'; // Sesuaikan path jika berbeda
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function PATCH(request: Request) {
  try {
    // 1. CEK IDENTITAS (SATPAM)
    // 1. CEK IDENTITAS (SATPAM)
    const cookieStore = await cookies(); // <-- Wajib tambah 'await' di sini untuk Next.js 15

    const supabaseUser = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { 
            return cookieStore.getAll() 
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                // Format penulisan .set yang benar (dipisah koma, bukan di dalam kurung kurawal)
                cookieStore.set(name, value, options)
              })
            } catch (error) {
              // Kalau Next.js protes "readonly", biarkan saja (diabaikan).
              // Karena Middleware kita yang sebenarnya bertugas merestart/mengupdate cookie-nya.
            }
          }
        }
      }
    );
      

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    
    // Cek apakah user ada dan punya role admin di app_metadata (Bukan user_metadata yang bisa dipalsukan)
    if (authError || !user) {
        return NextResponse.json({ error: 'Tidak ada akses (Unauthorized)' }, { status: 401 });
    }

    if (user.app_metadata?.role !== 'admin') {
        return NextResponse.json({ error: 'Akses ditolak! Anda bukan admin.' }, { status: 403 });
    }

    // 2. PARSING BODY
   let body: unknown;
    try {
      body = await request.json();
    } catch (err) {
      return NextResponse.json({ error: 'Body request tidak valid' }, { status: 400 });
    }

    // Pastikan body benar-benar object JSON, bukan null atau array
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Body request tidak valid' }, { status: 400 });
    }

    const { id_target, tipe, status_baru } = body as Record<string, unknown>;

    // Pastikan semuanya bertipe text/string dan tidak kosong
    if (
      typeof id_target !== 'string' ||
      typeof tipe !== 'string' ||
      typeof status_baru !== 'string' ||
      !id_target || !tipe || !status_baru
    ) {
      return NextResponse.json(
        { error: 'id_target, tipe, dan status_baru wajib dikirim dalam format text/string!' },
        { status: 400 }
      );
    }

    if (!['approved', 'rejected'].includes(status_baru)) {
      return NextResponse.json({ error: 'Status tidak valid!' }, { status: 400 });
    }

    // 3. GUNAKAN KUNCI SAKTI SETELAH LOLOS PENGECEKAN
    const supabaseAdmin = createAdminClient();

    let tableName = '';
    if (tipe === 'agen') {
      tableName = 'agen';
    } else if (tipe === 'perusahaan') {
      tableName = 'perusahaan_industri';
    } else {
      return NextResponse.json({ error: 'Tipe mitra tidak dikenal!' }, { status: 400 });
    }

    const { data,error } = await supabaseAdmin
      .from(tableName)
      .update({ status_verifikasi: status_baru })
      .eq('auth.id', id_target)
      .select('auth.id'); // <-- Pastikan kita hanya mengambil kolom yang relevan
    if (error) throw error;

    // Tambahkan blok ini: Cek apakah mitranya beneran ada?
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Mitra tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Status berhasil diubah' }, { status: 200 });
    

  } catch (err: unknown) { // Perbaikan tipe 'any' ke 'unknown' sesuai saran CodeRabbit
    const message = err instanceof Error ? err.message : 'Unknown server error';
    console.error("Error di verifikasi:", err); // Log di server
    return NextResponse.json(
      { error: 'Terjadi kesalahan server saat verifikasi.' }, // Jangan bocorkan err.message ke publik
      { status: 500 }
    );
  }
}
```

## FILE: app/api/ai/ai-guide/route.ts

```ts
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
  model: 'gemini-3.6-flash', // <--- INI DIA MODEL TERBARUNYA!
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

  } catch (error: any) {
    console.error("AI Pricing CRON Error:", error);
    return NextResponse.json({ error: "Gagal memproses Dynamic Pricing." }, { status: 500 });
  }
}
```

## FILE: app/api/auth/kyc/route.ts

```ts
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createAdminClient } from '@/lib/supabase/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const formData = await request.formData();
    
    const id_perusahaan = formData.get('id_perusahaan') as string;
    const inputNpwp = formData.get('npwp') as string;
    const inputNama = formData.get('nama_perusahaan') as string;
    const fileDokumen = formData.get('dokumen_npwp') as File;

    if (!id_perusahaan || !inputNpwp || !inputNama || !fileDokumen) {
      return NextResponse.json(
        { error: "Data tidak lengkap. Wajib mengirim id_perusahaan, npwp, nama_perusahaan, dan dokumen_npwp." }, 
        { status: 400 }
      );
    }

    // 1. Siapkan Buffer Gambar
    const bytes = await fileDokumen.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ==========================================
    // 2. UPLOAD GAMBAR KE SUPABASE STORAGE
    // ==========================================
    // Buat nama file unik (ID Perusahaan + Timestamp) agar tidak bentrok
    const fileExt = fileDokumen.name.split('.').pop();
    const fileName = `${id_perusahaan}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('npwp_bucket')
      .upload(fileName, buffer, {
        contentType: fileDokumen.type,
        upsert: false // Jangan timpa file yang sudah ada
      });

    if (uploadError) {
      console.error("Gagal Upload Storage:", uploadError);
      return NextResponse.json({ error: "Gagal mengunggah foto dokumen ke server." }, { status: 500 });
    }

    // Dapatkan Public URL dari gambar yang baru diupload
    const { data: urlData } = supabase.storage
      .from('npwp_bucket')
      .getPublicUrl(fileName);
      
    const publicDocumentUrl = urlData.publicUrl;

    // ==========================================
    // 3. ANALISIS AI GEMINI
    // ==========================================
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      Kamu asisten KYC. Baca dokumen legal (NPWP/Izin Usaha) ini.
      Ekstrak 'Nomor NPWP' (angka saja) dan 'Nama Perusahaan'.
      Jawab dengan JSON murni tanpa markdown:
      {
        "npwp_ditemukan": "123456789012345",
        "nama_ditemukan": "PT MAJU JAYA",
        "is_dokumen_jelas": true
      }
    `;

    const imageParts = [{ inlineData: { data: buffer.toString("base64"), mimeType: fileDokumen.type } }];
    const result = await model.generateContent([prompt, ...imageParts]);
    
    let responseText = result.response.text().trim();
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    const extractedData = JSON.parse(responseText);

    // ==========================================
    // 4. KEPUTUSAN & UPDATE DATABASE
    // ==========================================
    // Skenario A: Buram
    if (!extractedData.is_dokumen_jelas) {
      await updateDataKYC(supabase, id_perusahaan, 'need_review', publicDocumentUrl);
      return NextResponse.json({ 
        message: "Dokumen buram. Diteruskan ke Admin.", status: "need_review" 
      }, { status: 202 });
    }

    // Pembersihan & Pencocokan
    const cleanInputNpwp = inputNpwp.replace(/\D/g, '');
    const cleanExtractedNpwp = (extractedData.npwp_ditemukan || '').replace(/\D/g, '');
    const inputNamaLower = inputNama.toLowerCase().replace(/pt\.?|cv\.?|ud\.?/g, '').trim();
    const extractedNamaLower = (extractedData.nama_ditemukan || '').toLowerCase();
    
    const isNpwpMatch = cleanInputNpwp === cleanExtractedNpwp && cleanInputNpwp.length > 0;
    const isNamaMatch = extractedNamaLower.includes(inputNamaLower);

    // Skenario B: Lulus
    if (isNpwpMatch && isNamaMatch) {
      await updateDataKYC(supabase, id_perusahaan, 'verified', publicDocumentUrl);
      return NextResponse.json({ 
        message: "Verifikasi Berhasil!", status: "verified", data: extractedData
      }, { status: 200 });
    } 
    
    // Skenario C: Typo / Beda Data
    else {
      await updateDataKYC(supabase, id_perusahaan, 'need_review', publicDocumentUrl);
      return NextResponse.json({ 
        message: "Data beda dengan dokumen. Menunggu verifikasi Admin.", status: "need_review",
      }, { status: 202 });
    }

  } catch (error: any) {
    console.error("KYC AI API Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 });
  }
}

// Helper Function: Sekarang menyimpan status DAN URL Gambar
async function updateDataKYC(supabaseAdmin: any, id: string, status: string, fotoUrl: string) {
  const { error } = await supabaseAdmin
    .from('perusahaan')
    .update({ 
      status_verifikasi: status,
      url_dokumen_npwp: fotoUrl // Menyimpan link gambar untuk dilihat Admin!
    })
    .eq('id', id);
  
  if (error) throw new Error("Database update failed");
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
    } catch (err) {
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
    
  } catch (err: unknown) {
    console.error('System error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
```

## FILE: app/api/daftar/industri/route.ts

```ts
import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { translateAuthError } from "@/lib/auth-errors";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password, nama_perusahaan, npwp, alamat, telepon } = body;

  if (!email || !password || !nama_perusahaan || !npwp || !alamat || !telepon) {
    return NextResponse.json(
      { error: "Semua kolom wajib diisi." },
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

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password, nama_mitra, nik_nib, alamat, telepon } = body;

  if (!email || !password || !nama_mitra || !nik_nib || !alamat || !telepon) {
    return NextResponse.json(
      { error: "Semua kolom wajib diisi." },
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
      console.error("Gagal membuat akun mitra:", createError);
      return NextResponse.json(
        { error: translateAuthError(createError.message) },
        { status: 400 }
      );
    }

    // 2) Simpan detail profil, ditautkan ke user_id yang baru dibuat.
    //    Pakai service role jadi tidak kena RLS â€” tidak bergantung sesi
    //    login yang belum tentu ada di titik ini.
    const { error: profileError } = await supabase.from("mitra_profiles").insert({
      user_id: userData.user.id,
      nama_mitra,
      nik_nib,
      alamat,
      telepon,
    });
    if (profileError) {
      console.error("Gagal menyimpan profil mitra:", profileError);
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
    console.error("Kesalahan tak terduga saat daftar mitra:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan di server, coba lagi." },
      { status: 500 }
    );
  }
}
```

## FILE: app/api/leaderboard/route.ts

```ts
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { createAdminClient } from '@/lib/supabase/server';

// Inisialisasi koneksi ke Upstash Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Nama 'Kunci' (Key) untuk Sorted Set di Redis
const LEADERBOARD_KEY = 'eco_credits_leaderboard';

export async function GET() {
  try {
    const supabase = createAdminClient();

    // ==========================================
    // 1. TARIK DATA DARI REDIS (Secepat Kilat!)
    // ==========================================
    // ZREVRANGE: Ambil peringkat dari skor tertinggi ke terendah (Top 10)
    // WITHSCORES: Sertakan jumlah poinnya
    const topFactories: string[] = await redis.zrange(LEADERBOARD_KEY, 0, 9, {
      rev: true,
      withScores: true,
    });

    // Hasil dari Upstash formatnya array 1D: ["id-perusahaan-1", 500, "id-perusahaan-2", 300]
    // Kita harus merapikannya jadi array of objects agar Front-End gampang bacanya
    const leaderboardData = [];
    const companyIds = [];

    for (let i = 0; i < topFactories.length; i += 2) {
      const id = topFactories[i];
      const score = topFactories[i + 1];
      leaderboardData.push({ id_perusahaan: id, total_poin: Number(score) });
      companyIds.push(id);
    }

    if (leaderboardData.length === 0) {
      return NextResponse.json({ message: "Leaderboard masih kosong.", data: [] }, { status: 200 });
    }

    // ==========================================
    // 2. AMBIL NAMA PERUSAHAAN DARI SUPABASE
    // ==========================================
    // Redis sangat cepat, tapi hanya menyimpan ID dan Skor.
    // Kita ambil nama perusahaan aslinya dari database SQL untuk ditampilkan di UI.
    const { data: companies, error } = await supabase
      .from('perusahaan')
      .select('id, nama_perusahaan, url_dokumen_npwp') // Ambil foto juga buat avatar (kalau mau)
      .in('id', companyIds);

    if (error) {
      console.error("Gagal mengambil nama perusahaan:", error);
      throw new Error("Supabase fetch failed");
    }

    // Gabungkan data Skor (Redis) dengan Profil (Supabase)
    const finalLeaderboard = leaderboardData.map(item => {
      const company = companies.find(c => c.id === item.id_perusahaan);
      return {
        peringkat: 0, // Akan diisi di bawah
        id_perusahaan: item.id_perusahaan,
        nama_perusahaan: company?.nama_perusahaan || 'Pabrik Anonim',
        poin_eco_credits: item.total_poin,
        avatar: company?.url_dokumen_npwp || null,
      };
    });

    // Urutkan ulang memastikan posisinya tepat (karena query IN kadang acak) dan beri nomor urut
    finalLeaderboard.sort((a, b) => b.poin_eco_credits - a.poin_eco_credits);
    finalLeaderboard.forEach((item, index) => { item.peringkat = index + 1; });

    return NextResponse.json({
      message: "Data Leaderboard Real-time berhasil diambil.",
      data: finalLeaderboard
    }, { status: 200 });

  } catch (error: any) {
    console.error("Leaderboard API Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memuat papan peringkat." }, 
      { status: 500 }
    );
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

  } catch (err: unknown) {
    console.error('Error memproses E-Contract:', err);
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
import { createAdminClient } from '@/lib/supabase/server'; 
import { Redis } from '@upstash/redis';
import { Client as QStashClient } from "@upstash/qstash";


const qstash = new QStashClient({ token: process.env.QSTASH_TOKEN! });

// Inisialisasi Redis (Pastikan env sudah terpasang)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
// Inisialisasi Supabase menggunakan Service Role agar aman dari RLS (Row Level Security) saat insert data internal
const supabase = createAdminClient();

export async function POST(request: Request) {
  try {
    // 1. Tangkap Payload dari Front-End
    const body = await request.json();
    const { id_perusahaan, deskripsi_input, berat_kg } = body;

    // Validasi input kosong (Keamanan Lapis 1)
    if (!id_perusahaan || !deskripsi_input || !berat_kg) {
      return NextResponse.json(
        { error: "Data tidak lengkap. id_perusahaan, deskripsi_input, dan berat_kg wajib diisi." },
        { status: 400 }
      );
    }

    // 2. HEURISTIC FILTER (Smart Router Jalur Cepat)
    // Kata kunci limbah aman yang bisa kita olah di pabrik internal
    const kataKunciAman = [
      'kardus', 'kertas', 'plastik', 'botol', 'kayu', 
      'serbuk', 'daun', 'organik', 'besi', 'kaleng'
    ];
    
    // Ubah input pabrik jadi huruf kecil semua agar gampang dicocokkan
    const inputLowerCase = deskripsi_input.toLowerCase();
    
    // Cek apakah ada salah satu kata kunci aman di dalam deskripsi input pabrik
    const isOtomatisAman = kataKunciAman.some(kata => inputLowerCase.includes(kata));

    let kategori = '';
    let jalur_proses = '';

    if (isOtomatisAman) {
      // Masuk Jalur Hijau (Non-B3) -> Hilirisasi Internal
      kategori = 'NON_B3';
      jalur_proses = 'IN_HOUSE';
    } else {
      // ---------------------------------------------------------
      // TODO (FASE 2): Integrasi Gemini AI & Upstash QStash di sini
      // ---------------------------------------------------------
      // Jika kata tidak dikenali, anggap sebagai B3 dulu demi keamanan (Fail-Safe),
      // Nantinya, kodingan AI akan mengambil alih keputusan di blok ini.
      const workerUrl = process.env.NODE_ENV === 'production' 
        ? 'https://domain-itechno-abang.com/api/limbah/worker-ai'
        : 'https://[URL-NGROK-ABANG]/api/limbah/worker-ai';

      await qstash.publishJSON({
        url: workerUrl,
        body: { id_perusahaan, deskripsi_input, berat_kg },
        retries: 3 // Kalau AI error, QStash akan otomatis mencoba ulang 3 kali!
      });

      // Langsung kembalikan respons cepat ke user!
      return NextResponse.json({
        message: "Limbah ambigu. Sedang dianalisis oleh AI di latar belakang.",
        status: "processing"
      }, { status: 202 });
    }

    // 3. SIMPAN KE DATABASE (Tabel transaksi_limbah)
    const { data: insertData, error: insertError } = await supabase
      .from('transaksi_limbah')
      .insert([
        {
          id_perusahaan: id_perusahaan,
          deskripsi_input: deskripsi_input,
          berat_kg: berat_kg,
          kategori: kategori,
          jalur_proses: jalur_proses,
          status: 'menunggu_penjemputan' // Status awal
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Supabase Insert Error:", insertError);
      throw new Error("Gagal menyimpan data ke database.");
    }
    // ... (kodingan insert Supabase abang sebelumnya) ...
    if (insertError) {
      console.error("Supabase Insert Error:", insertError);
      throw new Error("Gagal menyimpan data ke database.");
    }

    // ==========================================
    // SUNTIKAN REDIS LEADERBOARD (GAMIFIKASI)
    // ==========================================
    // Kita HANYA memberikan poin jika limbahnya NON_B3 (Bisa diolah / Ramah lingkungan)
    let poinDidapat = 0;
    if (kategori === 'NON_B3') {
      // Rumus Poin: 1 Kg limbah = 10 Eco-Credits (Bisa abang ubah rumusnya)
      poinDidapat = Math.round(berat_kg * 10);
      
      // Tambahkan poin ke Leaderboard Redis secara real-time!
      await redis.zincrby('eco_credits_leaderboard', poinDidapat, id_perusahaan);

      // (Opsional tapi disarankan): Update juga kolom 'eco_credits' di tabel 'perusahaan' 
      // agar sinkron antara Redis (RAM) dan Supabase (Harddisk)
      const { data: currentPabrik } = await supabase
        .from('perusahaan')
        .select('eco-credits')
        .eq('id', id_perusahaan)
        .single();
        
        
     // Tambahkan Type Assertion (as any) agar TypeScript diam
      const currentData = currentPabrik as any;
      const saldoPoinLama = currentData ? Number(currentData['eco-credits']) : 0;
      
      const saldoPoinBaru = saldoPoinLama + poinDidapat;
      
      await supabase
        .from('perusahaan')
        .update({ 'eco-credits': saldoPoinBaru })
        .eq('id', id_perusahaan);
      await supabase.from('perusahaan').update({ 'eco-credits': saldoPoinBaru }).eq('id', id_perusahaan);
    }
    // ==========================================
    // 4. BERIKAN RESPON KE FRONT-END
    
   // 4. BERIKAN RESPON KE FRONT-END
    return NextResponse.json({
      message: "Setoran limbah berhasil dicatat.",
      routing_result: {
        kategori_terdeteksi: kategori,
        jalur_keputusan: jalur_proses
      },
      poin_tambahan: poinDidapat, // <-- Tambahkan info ini untuk UI Front-End
      data: insertData
    }, { status: 201 });

  } catch (error: any) {
    console.error("API Setoran Limbah Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server (Smart Router)." },
      { status: 500 }
    );
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
```

## FILE: app/api/profil/me/route.ts

```ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // 1. Ambil data user yang sedang login dari token JWT yang sudah aman di cookies
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // Jika tidak ada token (belum login), tolak aksesnya!
    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak ada akses (Unauthorized)' }, { status: 401 });
    }

    // 2. Cek identitas jabatannya dari metadata JWT
    const role = user.app_metadata?.role;
    let profileData = null;

    if (typeof role !== 'string' || (role !== 'agen' && role !== 'perusahaan')) {
      return NextResponse.json({ error: 'Role pengguna tidak valid' }, { status: 400 });
    }

    // 3. Tarik data dari tabel yang sesuai menggunakan .single() karena data pasti unik
    if (role === 'agen') {
      const { data, error } = await supabase
        .from('agen')
        .select('*')
        .eq('auth_id', user.id)
        .maybeSingle(); // Pakai maybeSingle!

      if (error) throw error;
      if (!data) return NextResponse.json({ error: 'Profil belum tersedia' }, { status: 404 });
      profileData = data;

    } else if (role === 'perusahaan') {
      const { data, error } = await supabase
        .from('perusahaan_industri')
        .select('*')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return NextResponse.json({ error: 'Profil belum tersedia' }, { status: 404 });
      profileData = data;

    } else {
      return NextResponse.json({ error: 'Role pengguna tidak valid' }, { status: 400 });
    }
    // 4. Kirim datanya ke Frontend
    return NextResponse.json({
      message: 'Berhasil mengambil profil',
      role: role,
      data: profileData
    }, { status: 200 });

  } catch (err: unknown) {
    console.error('Failed to retrieve profile', err);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// ... (Kode fungsi GET kamu yang lama tetap ada di atas sini) ...

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // 1. Cek apakah user sudah login
    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak ada akses (Unauthorized)' }, { status: 401 });
    }

    const role = user.app_metadata?.role;
    if (!role) {
      return NextResponse.json({ error: 'Role pengguna tidak valid' }, { status: 400 });
    }

    // 2. Tangkap data dari frontend dengan aman
    let body: unknown;
    try {
      body = await request.json();
    } catch (err) {
      return NextResponse.json({ error: 'Format data tidak valid' }, { status: 400 });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Format data tidak valid' }, { status: 400 });
    }

    const payload = body as Record<string, unknown>;

    // 3. Filter data yang boleh di-update (Keamanan: Mencegah user mengubah ID atau status verifikasi secara paksa)
    const dataUpdate: Record<string, string> = {};
    
    // Semua role boleh update telepon dan alamat
    if (typeof payload.no_telepon === 'string' && payload.no_telepon.trim() !== '') {
      dataUpdate.no_telepon = payload.no_telepon.trim();
    }
    if (typeof payload.alamat_lengkap === 'string' && payload.alamat_lengkap.trim() !== '') {
      dataUpdate.alamat_lengkap = payload.alamat_lengkap.trim();
    }

    // Update nama sesuai role
    if (role === 'agen' && typeof payload.nama_agen === 'string' && payload.nama_agen.trim() !== '') {
      dataUpdate.nama_agen = payload.nama_agen.trim();
    } else if (role === 'perusahaan' && typeof payload.nama_perusahaan === 'string' && payload.nama_perusahaan.trim() !== '') {
      dataUpdate.nama_perusahaan = payload.nama_perusahaan.trim();
    }

    // Cek apakah ada data yang valid untuk diupdate
    if (Object.keys(dataUpdate).length === 0) {
      return NextResponse.json({ error: 'Tidak ada data valid yang dikirim untuk diperbarui' }, { status: 400 });
    }

    // 4. Update ke database sesuai role
    const tableName = role === 'agen' ? 'agen' : 'perusahaan_industri';
    
    const { data: updatedRow, error: updateError } = await supabase
      .from(tableName)
      .update(dataUpdate)
      .eq('auth_id', user.id)
      .select('auth_id')
      .maybeSingle();

    if (updateError) {
      console.error('Update profile failed:', updateError.message);
      return NextResponse.json({ error: 'Gagal memperbarui data profil' }, { status: 500 });
    }

    if (!updatedRow) {
      return NextResponse.json({ error: 'Profil belum tersedia' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Profil berhasil diperbarui!' }, { status: 200 });

  } catch (err: unknown) {
    console.error('System error:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
```

## FILE: app/api/registrasi_agen/route.ts

```ts
import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server'; 


export async function POST(request: Request) {
  try {
    function cekKekuatanPassword(password: string): string[] {
  return [
    { valid: password.length >= 8, msg: "minimal 8 karakter" },
    { valid: /[A-Z]/.test(password), msg: "minimal 1 huruf besar (A-Z)" },
    { valid: /[a-z]/.test(password), msg: "minimal 1 huruf kecil (a-z)" },
    { valid: /[0-9]/.test(password), msg: "minimal 1 angka (0-9)" },
    { valid: /[^A-Za-z0-9]/.test(password), msg: "minimal 1 simbol khusus (contoh: @, !, #, $, dll)" }
  ]
  .filter(rule => !rule.valid)
  .map(rule => rule.msg);
}
    // 1. Parsing body dengan aman
    let body: unknown;
    try {
      body = await request.json();
    } catch (err) {
      return NextResponse.json({ error: 'Body request tidak valid' }, { status: 400 });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Body request tidak valid' }, { status: 400 });
    }

    const { email, password, namaAgen, nikNib, alamatLengkap, noTelepon } = body as Record<string, unknown>;

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      typeof namaAgen !== 'string' ||
      typeof nikNib !== 'string' ||
      typeof alamatLengkap !== 'string' ||
      typeof noTelepon !== 'string' ||
      !email.trim() ||
      !password.trim() ||
      !namaAgen.trim() ||
      !nikNib.trim() ||
      !alamatLengkap.trim() ||
      !noTelepon.trim()
    ) {
      return NextResponse.json(
        { error: 'kamu harus mengsisi datamu secara lengkap' },
        { status: 400 }
      );
    }

    const daftarKelemahan = cekKekuatanPassword(password);

if (daftarKelemahan.length > 0) {
  // Menggabungkan pesan error agar user tahu apa yang kurang
  return NextResponse.json({ 
    error: `Password terlalu lemah! Harus memiliki: ${daftarKelemahan.join(', ')}.` 
  }, { status: 400 });
}
    const supabase = await createClient();

    let createdUser = false;

    // 3. Daftarkan User ke Supabase Auth (Otomatis masuk tabel rahasia)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    }); // Hapus blok options: { data: { role: ... } } dari sini!

    const duplicateSignup = authError && typeof authError === 'object' && 'code' in authError
      ? ['user_already_exists', 'email_exists'].includes((authError as { code?: string }).code ?? '')
      : false;

    const supabaseAdmin = createAdminClient();

    const handleDuplicateExisting = async () => {
      const { data: existingUser, error: existingUserError } = await supabaseAdmin
        .from('auth.users')
        .select('id, app_metadata')
        .eq('email', email)
        .maybeSingle();

      if (existingUserError) {
        console.error('Duplicate lookup failed:', existingUserError.message);
        return NextResponse.json(
          { error: 'Terjadi kesalahan saat memproses registrasi duplikat.' },
          { status: 500 }
        );
      }

      if (!existingUser || existingUser.app_metadata?.role !== 'agen') {
        return NextResponse.json(
          { error: 'Email sudah terdaftar pada akun lain.' },
          { status: 400 }
        );
      }

      const userId = existingUser.id;
      const { data: existingAgent, error: existingAgentError } = await supabaseAdmin
        .from('agen')
        .select('auth_id')
        .eq('auth_id', userId)
        .maybeSingle();

      if (existingAgentError) {
        console.error('Agent lookup failed:', existingAgentError.message);
        return NextResponse.json(
          { error: 'Terjadi kesalahan saat memverifikasi profil agen.' },
          { status: 500 }
        );
      }

      if (existingAgent) {
        return NextResponse.json({ message: 'Registrasi agen berhasil!' }, { status: 201 });
      }

      const { error: profileError } = await supabaseAdmin.from('agen').insert([
        {
          auth_id: userId,
          nama_agen: namaAgen,
          nik_nib: nikNib,
          alamat_lengkap: alamatLengkap,
          no_telepon: noTelepon,
          status_verifikasi: 'pending',
        }
      ]);

      if (profileError) {
        console.error('Profile insert failed for duplicate signup:', profileError.message);
        return NextResponse.json(
          { error: 'Gagal membuat profil agen untuk akun duplikat.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: 'Registrasi agen berhasil!' }, { status: 201 });
    };

    if (authError) {
      if (duplicateSignup) {
        return await handleDuplicateExisting();
      }

      console.error('Signup failed:', authError.message);
      return NextResponse.json(
        { error: 'Registrasi gagal. Periksa kembali email dan password Anda.' },
        { status: 400 }
      );
    }

    const userId = authData.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Gagal mendapatkan ID pengguna.' }, { status: 500 });
    }

    if (!authData.user?.identities || authData.user.identities.length === 0) {
      return await handleDuplicateExisting();
    }

    createdUser = true;

    // MASUKKAN ROLE KE APP_METADATA (Sangat Aman)
    const { error: roleError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      app_metadata: { role: 'agen' } // Ganti 'agen' jadi 'perusahaan' untuk file registrasi_perusahaan
    });

    if (roleError) {
      if (createdUser) {
        const { error: rollbackError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (rollbackError) {
          console.error('Rollback failed, orphan auth user:', userId, rollbackError.message);
        }
      }
      return NextResponse.json({ error: 'Registrasi dibatalkan saat mengatur hak akses.' }, { status: 500 });
    }

    // Lanjut masukkan data ke tabel profil (agen / perusahaan_industri)
    // Lanjut masukkan data ke tabel profil
    const { error: profileError } = await supabaseAdmin
      .from('agen')
      .insert([
        {
          auth_id: userId,
          nama_agen: namaAgen,
          nik_nib: nikNib,
          alamat_lengkap: alamatLengkap,
          no_telepon: noTelepon,
          status_verifikasi: 'pending',
        }
      ]);

    // PERBAIKAN ROLLBACK
    if (profileError) {
      console.error('Profile insert failed:', profileError.message);
      if (createdUser) {
        const { error: rollbackError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (rollbackError) {
          console.error('Rollback failed, orphan auth user:', userId, rollbackError.message);
        }
      }

      return NextResponse.json(
        // Jangan bocorkan profileError.message ke client
        { error: 'Gagal membuat profil, registrasi dibatalkan.' },
        { status: 500 }
      );
    }


    return NextResponse.json(
      { message: 'Registrasi agen berhasil!' },
      { status: 201 }
    );
    
 } catch (err: unknown) { 
    const message = err instanceof Error ? err.message : 'Unknown server error';
    console.error("System Error:", message); // Supaya tetap terekam di terminal server
    
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem, silakan coba lagi nanti.' }, // Pesan yang aman untuk user
      { status: 500 }
    );
  }
}
```

## FILE: app/api/registrasi_perusahaan/route.ts

```ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; 
import { createAdminClient } from '@/lib/supabase/server'; 


export async function POST(request: Request) {
  try {
    function cekKekuatanPassword(password: string): string[] {
  return [
    { valid: password.length >= 8, msg: "minimal 8 karakter" },
    { valid: /[A-Z]/.test(password), msg: "minimal 1 huruf besar (A-Z)" },
    { valid: /[a-z]/.test(password), msg: "minimal 1 huruf kecil (a-z)" },
    { valid: /[0-9]/.test(password), msg: "minimal 1 angka (0-9)" },
    { valid: /[^A-Za-z0-9]/.test(password), msg: "minimal 1 simbol khusus (contoh: @, !, #, $, dll)" }
  ]
  .filter(rule => !rule.valid)
  .map(rule => rule.msg);
}
    // 1. Parsing body dengan aman
    let body: unknown;
    try {
      body = await request.json();
    } catch (err) {
      return NextResponse.json({ error: 'Body request tidak valid' }, { status: 400 });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Body request tidak valid' }, { status: 400 });
    }

    const { email, password, nama_perusahaan, npwp, alamat_lengkap, noTelepon } = body as Record<string, unknown>;

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      typeof nama_perusahaan !== 'string' ||
      typeof npwp !== 'string' ||
      typeof alamat_lengkap
       !== 'string' ||
      typeof noTelepon !== 'string' ||
      !email.trim() ||
      !password.trim() ||
      !nama_perusahaan.trim() ||
      !npwp.trim() ||
      !alamat_lengkap.trim() ||
      !noTelepon.trim()
    ) {
      return NextResponse.json(
        { error: 'Email, password, nama perusahaan, NPWP, alamat lengkap, dan no telepon wajib diisi!' },
        { status: 400 }
      );
    }
    const daftarKelemahan = cekKekuatanPassword(password);

if (daftarKelemahan.length > 0) {
  // Menggabungkan pesan error agar user tahu apa yang kurang
  return NextResponse.json({ 
    error: `Password terlalu lemah! Harus memiliki: ${daftarKelemahan.join(', ')}.` 
  }, { status: 400 });
}
    const supabase = await createClient();

    // 2. Daftarkan User ke Supabase Auth dengan Metadata Role 'perusahaan'
   const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error('Signup failed:', authError.message);
      return NextResponse.json(
        { error: 'Registrasi gagal. Periksa kembali email dan password Anda.' },
        { status: 400 }
      );
    }

    const userId = authData.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Gagal mendapatkan ID pengguna.' }, { status: 500 });
    }

    // PENGAMAN DARI CODERABBIT: Cek apakah email sudah terdaftar (identities kosong)
    if (!authData.user?.identities || authData.user.identities.length === 0) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar. Silakan gunakan email lain atau login.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Set role pakai admin client
    const { error: roleError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      app_metadata: { role: 'perusahaan' },
    });

    if (roleError) {
      console.error('Role assignment failed:', roleError.message);
      const { error: rollbackError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (rollbackError) console.error('Rollback failed:', rollbackError.message);
      return NextResponse.json({ error: 'Registrasi dibatalkan saat mengatur hak akses.' }, { status: 500 });
    }

    const { error: profileError } = await supabaseAdmin
      .from('perusahaan_industri')
      .insert([
        {
          auth_id: userId,
          nama_perusahaan: nama_perusahaan,
          npwp: npwp,
          alamat_lengkap: alamat_lengkap,
          no_telepon: noTelepon,
          status_verifikasi: 'pending',
        }
      ]);

    if (profileError) {
      console.error('Profile insert failed:', profileError.message);
      const { error: rollbackError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (rollbackError) console.error('Rollback failed:', rollbackError.message);
      
      return NextResponse.json({ error: 'Gagal membuat profil perusahaan, registrasi dibatalkan.' }, { status: 500 });
    }

    return NextResponse.json(
      { message: 'Registrasi perusahaan berhasil!', userId },
      { status: 201 }
    );

  } catch (err: unknown) { 
    const message = err instanceof Error ? err.message : 'Unknown server error';
    console.error("System Error:", message); // Supaya tetap terekam di terminal server
    
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem, silakan coba lagi nanti.' }, // Pesan yang aman untuk user
      { status: 500 }
    );
  }
}
```

## FILE: app/api/transaksi/order/route.ts

```ts
import { NextResponse } from 'next/server';
import { createAdminClient} from '@/lib/supabase/server'; 

const supabase = createAdminClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id_agen, volume_terjual_kg } = body;

    // 1. TANGKAL NILAI NEGATIF / NOL
    if (!id_agen || !volume_terjual_kg || volume_terjual_kg <= 0) {
      return NextResponse.json(
        { error: "Data agen atau volume penjualan tidak valid." },
        { status: 400 }
      );
    }

    // 2. AMBIL HARGA HET TERBARU (Aman)
    const { data: hargaData } = await supabase
      .from('patokan_harga')
      .select('harga_rekomendasi_ai')
      .eq('status', 'Approved')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const harga_per_kg = hargaData ? hargaData.harga_rekomendasi_ai : 3000;
    const total_pendapatan = volume_terjual_kg * harga_per_kg;

    // ==========================================
    // 3. DELEGASIKAN KE DATABASE (ATOMIC TRANSACTION)
    // ==========================================
    // Cek stok, potong stok, tambah saldo, dan catat ledger dilakukan 
    // dalam 1 tarikan nafas di dalam database.
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('eksekusi_kasir_atomic', {
        p_id_agen: id_agen,
        p_volume_kg: volume_terjual_kg,
        p_harga_per_kg: harga_per_kg,
        p_total_pendapatan: total_pendapatan
      });

    if (rpcError) {
      throw rpcError;
    }

    // Membaca balasan dari fungsi SQL
    if (!rpcResult.success) {
      return NextResponse.json(
        { error: `Transaksi Gagal: ${rpcResult.message}` }, 
        { status: 400 }
      );
    }

    // 4. KEMBALIKAN STRUK DIGITAL KE FRONT-END
    return NextResponse.json({ 
      message: "Transaksi Kasir Berhasil!",
      struk_digital: {
        volume_kg: volume_terjual_kg,
        harga_satuan: harga_per_kg,
        total_bayar: total_pendapatan,
        sisa_stok_gudang: rpcResult.sisa_stok_gudang,
        saldo_dompet_sekarang: rpcResult.saldo_dompet_sekarang
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error("API POS/Order Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal saat memproses transaksi." }, 
      { status: 500 }
    );
  }
}
```

## FILE: app/api/transaksi/riwayat/route.ts

```ts
export async function GET() {
	return Response.json({ orders: [] });
}
```

## FILE: app/daftar/industri/page.tsx

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { BackButton } from "@/components/auth/back-button";
import { ProgressSteps } from "@/components/auth/progress-steps";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { translateAuthError } from "@/lib/auth-errors";
import { TermsCheckbox } from "@/components/auth/terms-checkbox";

const stepLabels = ["Email", "Kata Sandi", "Detail Profil"];

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 24 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -24 }),
};

type FormState = {
  email: string;
  password: string;
  nama_perusahaan: string;
  npwp: string;
  alamat: string;
  telepon: string;
};

export default function DaftarIndustriPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
    nama_perusahaan: "",
    npwp: "",
    alamat: "",
    telepon: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "submitted">("idle");
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function goNext() {
    setDirection(1);
    setStep((s) => Math.min(s + 1, stepLabels.length - 1));
  }
  function goBack() {
    setDirection(-1);
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (step < stepLabels.length - 1) {
      goNext();
      return;
    }

    if (!agreed) {
      setError("Kamu harus menyetujui Syarat & Ketentuan dan Kebijakan Privasi dulu.");
      return;
    }

    setStatus("loading");
    try {
      // 1) Buat akun + simpan profil sekaligus di server (satu langkah,
      //    tidak bergantung sesi browser yang belum tentu ada).
      const res = await fetch("/api/daftar/industri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (!res.ok) {
        setStatus("idle");
        setError(result.error ?? "Terjadi kesalahan, coba lagi.");
        return;
      }

      // 2) Login beneran di browser supaya dapat sesi asli.
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (signInError) throw signInError;

      setStatus("submitted");
      // Belum ada dashboard khusus industri, jadi kembali ke beranda.
      router.push("/");
      router.refresh();
    } catch (err) {
      setStatus("idle");
      setError(translateAuthError(err instanceof Error ? err.message : null));
    }
  }

  return (
    <AuthShell
      eyebrow="Pendaftaran industri"
      title="Daftar sebagai Industri"
      subtitle="Untuk pabrik dan industri sumber limbah."
      footer={
        <p className="text-sm text-ink/60 space-y-1.5">
          <span className="block">
            Sudah punya akun?{" "}
            <Link href="/masuk" className="text-green font-medium hover:underline">
              Masuk
            </Link>
          </span>
          <span className="block">
            Mau daftar sebagai mitra?{" "}
            <Link href="/daftar/mitra" className="text-green font-medium hover:underline">
              Klik di sini
            </Link>
          </span>
        </p>
      }
    >
      {status === "submitted" ? (
        <div className="text-center py-4">
          <p className="text-forest font-medium mb-1">Pendaftaran industri berhasil.</p>
          <p className="text-ink/55 text-sm">Mengalihkan ke beranda...</p>
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
                    placeholder="nama@perusahaan.com"
                    required
                    autoFocus
                  />
                )}

                {step === 1 && (
                  <>
                    <p className="text-sm text-ink/55 mb-4">
                      Untuk{" "}
                      <span className="text-forest font-medium">{form.email}</span>{" "}
                      Â·{" "}
                      <button type="button" onClick={goBack} className="text-green hover:underline">
                        ganti
                      </button>
                    </p>
                    <FormField
                      label="Kata sandi"
                      type="password"
                      value={form.password}
                      onChange={(e) => update("password", e.target.value)}
                      placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                      minLength={6}
                      required
                      autoFocus
                    />
                  </>
                )}

                {step === 2 && (
                  <>
                    <FormField
                      label="Nama perusahaan"
                      type="text"
                      value={form.nama_perusahaan}
                      onChange={(e) => update("nama_perusahaan", e.target.value)}
                      placeholder="PT / CV ..."
                      required
                      autoFocus
                    />
                    <FormField
                      label="NPWP"
                      type="text"
                      value={form.npwp}
                      onChange={(e) => update("npwp", e.target.value)}
                      placeholder="XX.XXX.XXX.X-XXX.XXX"
                      required
                    />
                    <FormField
                      label="Alamat lengkap"
                      type="text"
                      value={form.alamat}
                      onChange={(e) => update("alamat", e.target.value)}
                      placeholder="Jalan, kota, provinsi"
                      required
                    />
                    <FormField
                      label="Nomor telepon"
                      type="tel"
                      value={form.telepon}
                      onChange={(e) => update("telepon", e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      required
                    />
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
              <SubmitButton type="submit" disabled={status === "loading"}>
                {step < stepLabels.length - 1
                  ? "Lanjut"
                  : status === "loading"
                  ? "Memproses..."
                  : "Daftar sebagai Industri"}
              </SubmitButton>
            </div>
          </form>
        </>
      )}
    </AuthShell>
  );
}
```

## FILE: app/daftar/mitra/page.tsx

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { BackButton } from "@/components/auth/back-button";
import { ProgressSteps } from "@/components/auth/progress-steps";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { translateAuthError } from "@/lib/auth-errors";
import { TermsCheckbox } from "@/components/auth/terms-checkbox";

const stepLabels = ["Email", "Kata Sandi", "Detail Profil"];

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 24 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -24 }),
};

type FormState = {
  email: string;
  password: string;
  nama_mitra: string;
  nik_nib: string;
  alamat: string;
  telepon: string;
};

export default function DaftarMitraPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
    nama_mitra: "",
    nik_nib: "",
    alamat: "",
    telepon: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "submitted">("idle");
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function goNext() {
    setDirection(1);
    setStep((s) => Math.min(s + 1, stepLabels.length - 1));
  }
  function goBack() {
    setDirection(-1);
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (step < stepLabels.length - 1) {
      goNext();
      return;
    }

    if (!agreed) {
      setError("Kamu harus menyetujui Syarat & Ketentuan dan Kebijakan Privasi dulu.");
      return;
    }

    setStatus("loading");
    try {
      // 1) Buat akun + simpan profil sekaligus di server (satu langkah,
      //    tidak bergantung sesi browser yang belum tentu ada).
      const res = await fetch("/api/daftar/mitra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await res.json();
      if (!res.ok) {
        setStatus("idle");
        setError(result.error ?? "Terjadi kesalahan, coba lagi.");
        return;
      }

      // 2) Login beneran di browser supaya dapat sesi asli, baru redirect.
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (signInError) throw signInError;

      setStatus("submitted");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setStatus("idle");
      setError(translateAuthError(err instanceof Error ? err.message : null));
    }
  }

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
          <p className="text-forest font-medium mb-1">Pendaftaran mitra berhasil.</p>
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
                      Untuk{" "}
                      <span className="text-forest font-medium">{form.email}</span>{" "}
                      Â·{" "}
                      <button type="button" onClick={goBack} className="text-green hover:underline">
                        ganti
                      </button>
                    </p>
                    <FormField
                      label="Kata sandi"
                      type="password"
                      value={form.password}
                      onChange={(e) => update("password", e.target.value)}
                      placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                      minLength={6}
                      required
                      autoFocus
                    />
                  </>
                )}

                {step === 2 && (
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
                    <FormField
                      label="NIK / NIB"
                      type="text"
                      value={form.nik_nib}
                      onChange={(e) => update("nik_nib", e.target.value)}
                      placeholder="Nomor NIK atau NIB"
                      required
                    />
                    <FormField
                      label="Alamat lengkap"
                      type="text"
                      value={form.alamat}
                      onChange={(e) => update("alamat", e.target.value)}
                      placeholder="Jalan, kota, provinsi"
                      required
                    />
                    <FormField
                      label="Nomor telepon"
                      type="tel"
                      value={form.telepon}
                      onChange={(e) => update("telepon", e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      required
                    />

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
              <SubmitButton type="submit" disabled={status === "loading"}>
                {step < stepLabels.length - 1
                  ? "Lanjut"
                  : status === "loading"
                  ? "Memproses..."
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

## FILE: app/dashboard/layout.tsx

```tsx
import { DashboardSidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-cream">
      <DashboardSidebar />
      <main className="flex-1 min-w-0">{children}</main>
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
import { mitraProducts } from "@/lib/mitra-products";

interface MitraProfile {
  nama_mitra: string;
  nik_nib: string;
  alamat: string;
  telepon: string;
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
      <p className="text-forest font-medium">{value || "-"}</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<MitraProfile | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.replace("/masuk");
        return;
      }
      setEmail(data.user.email ?? null);

      const { data: profileData } = await supabase
        .from("mitra_profiles")
        .select("nama_mitra, nik_nib, alamat, telepon, created_at")
        .eq("user_id", data.user.id)
        .maybeSingle();

      setProfile(profileData);
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-ink/40 text-sm">Memuat...</p>
      </div>
    );
  }

  const lowStockCount = mitraProducts.filter((p) => p.stock < 25).length;
  const joinedLabel = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  return (
    <div className="px-6 md:px-12 py-10 md:py-12 max-w-5xl">
      {/* Ringkasan */}
      <section id="ringkasan" className="scroll-mt-8 mb-16">
        <p className="font-mono text-xs tracking-widest uppercase text-green mb-3">
          Ringkasan
        </p>
        <h1 className="font-display font-semibold text-2xl md:text-3xl text-forest mb-2">
          Selamat datang, {profile?.nama_mitra ?? "Mitra"}
        </h1>
        <p className="text-ink/60 mb-8">
          Pantau stok dan kelola profil kemitraan kamu di sini.
        </p>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-paper rounded-2xl border border-forest/10 p-5">
            <p className="text-xs text-ink/45 mb-1.5">Status akun</p>
            <p className="font-display font-semibold text-forest text-lg">Aktif</p>
          </div>
          <div className="bg-paper rounded-2xl border border-forest/10 p-5">
            <p className="text-xs text-ink/45 mb-1.5">Perlu di-restock</p>
            <p className="font-display font-semibold text-forest text-lg">
              {lowStockCount} item
            </p>
          </div>
          <div className="bg-paper rounded-2xl border border-forest/10 p-5">
            <p className="text-xs text-ink/45 mb-1.5">Bergabung sejak</p>
            <p className="font-display font-semibold text-forest text-lg">
              {joinedLabel}
            </p>
          </div>
        </div>
      </section>

      {/* Pesan Stok */}
      <section id="pesan-stok" className="scroll-mt-8 mb-16">
        <p className="font-mono text-xs tracking-widest uppercase text-gold mb-3">
          Pesan stok
        </p>
        <h2 className="font-display font-semibold text-2xl text-forest mb-2">
          Pesan ulang bahan energi
        </h2>
        <p className="text-ink/60 mb-8 max-w-lg">
          Pantau stok yang ada di titikmu dan ajukan permintaan stok ulang
          langsung ke LENTERA.
        </p>
        <div className="grid sm:grid-cols-2 gap-5">
          {mitraProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Profil Mitra */}
      <section id="profil-mitra" className="scroll-mt-8">
        <p className="font-mono text-xs tracking-widest uppercase text-clay mb-3">
          Profil mitra
        </p>
        <h2 className="font-display font-semibold text-2xl text-forest mb-6">
          Informasi mitra
        </h2>
        <div className="bg-paper rounded-2xl border border-forest/10 p-6 md:p-8 grid sm:grid-cols-2 gap-6">
          <InfoRow label="Nama mitra" value={profile?.nama_mitra} />
          <InfoRow label="Email" value={email} />
          <InfoRow label="NIK / NIB" value={profile?.nik_nib} />
          <InfoRow label="Nomor telepon" value={profile?.telepon} />
          <InfoRow
            label="Alamat lengkap"
            value={profile?.alamat}
            className="sm:col-span-2"
          />
        </div>
      </section>
    </div>
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

## FILE: app/masuk/page.tsx

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { AuthShell } from "@/components/auth/auth-shell";
import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { BackButton } from "@/components/auth/back-button";
import { ProgressSteps } from "@/components/auth/progress-steps";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { translateAuthError } from "@/lib/auth-errors";

const stepLabels = ["Email", "Kata Sandi"];

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 24 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -24 }),
};

export default function MasukPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "submitted">("idle");
  const [error, setError] = useState<string | null>(null);

  function goNext() {
    setDirection(1);
    setStep((s) => Math.min(s + 1, stepLabels.length - 1));
  }
  function goBack() {
    setDirection(-1);
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (step < stepLabels.length - 1) {
      goNext();
      return;
    }

    setStatus("loading");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;

      setStatus("submitted");
      router.push("/dashboard");
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@perusahaan.com"
                    required
                    autoFocus
                  />
                )}
                {step === 1 && (
                  <>
                    <p className="text-sm text-ink/55 mb-4">
                      Masuk sebagai{" "}
                      <span className="text-forest font-medium">{email}</span>{" "}
                      Â·{" "}
                      <button
                        type="button"
                        onClick={goBack}
                        className="text-green hover:underline"
                      >
                        ganti
                      </button>
                    </p>
                    <FormField
                      label="Kata sandi"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                      required
                      autoFocus
                    />
                    <div className="flex justify-end mb-2">
                      <a href="#" className="text-xs text-ink/50 hover:text-forest transition-colors">
                        Lupa kata sandi?
                      </a>
                    </div>
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
              <SubmitButton type="submit" disabled={status === "loading"}>
                {step < stepLabels.length - 1
                  ? "Lanjut"
                  : status === "loading"
                  ? "Memproses..."
                  : "Masuk"}
              </SubmitButton>
            </div>
          </form>
        </>
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

export const dynamic = "force-dynamic";

export default async function Home() {
  const leaderboardEntries = await getLeaderboardEntries();

  return (
    <main>
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
export function SubmitButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`${className || "w-full"} bg-forest text-cream font-medium rounded-full py-3.5 transition-colors hover:bg-forest-2 disabled:opacity-60 disabled:pointer-events-none`}
    >
      {children}
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

## FILE: components/cta-footer.tsx

```tsx
import Image from "next/image";
import { Reveal } from "./ui/reveal";
import { MagneticButton } from "./ui/magnetic-button";

const footerLinks = [
  { href: "#cara-kerja", label: "Cara Kerja" },
  { href: "#mitra", label: "Untuk Mitra" },
  { href: "#jaringan", label: "Jaringan" },
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
              <MagneticButton href="mailto:mitra@lentera.id" variant="primary" className="!bg-gold !text-forest hover:!bg-gold-light">
                Hubungi Tim Mitra
              </MagneticButton>
              <a
                href="#cara-kerja"
                className="text-cream font-medium px-7 py-3.5 rounded-full border border-cream/30 hover:border-cream/60 transition-colors"
              >
                Pelajari Alurnya
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="px-6 md:px-10 py-12 bg-forest-2 text-cream/60 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <Image src="/images/logo.png" alt="LENTERA" width={28} height={28} className="h-7 w-auto opacity-90" />
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

## FILE: components/dashboard/product-card.tsx

```tsx
"use client";

import { useState } from "react";
import type { MitraProduct } from "@/lib/mitra-products";

function stockLevel(stock: number) {
  if (stock >= 60) return { label: "Stok aman", cls: "bg-green/10 text-green" };
  if (stock >= 25) return { label: "Stok menipis", cls: "bg-gold/15 text-gold" };
  return { label: "Segera pesan", cls: "bg-clay/10 text-clay" };
}

export function ProductCard({ product }: { product: MitraProduct }) {
  const [qty, setQty] = useState(1);
  const [status, setStatus] = useState<"idle" | "sent">("idle");
  const level = stockLevel(product.stock);

  function handleOrder() {
    setStatus("sent");
    // TODO: kirim permintaan stok ulang ke API sungguhan (mis. POST /api/pesanan)
    setTimeout(() => setStatus("idle"), 2500);
  }

  return (
    <div className="bg-paper rounded-2xl border border-forest/10 p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="font-display font-semibold text-forest leading-snug">
            {product.name}
          </p>
          <p className="text-xs text-ink/50 mt-0.5">{product.category}</p>
        </div>
        <span
          className={`shrink-0 text-[11px] font-mono px-2.5 py-1 rounded-full whitespace-nowrap ${level.cls}`}
        >
          {product.stock} {product.unit}
        </span>
      </div>

      <p className="font-mono text-lg font-semibold text-forest mb-1">
        Rp {product.price.toLocaleString("id-ID")}
        <span className="text-xs text-ink/45 font-body font-normal">
          {" "}
          / {product.unit}
        </span>
      </p>
      <p className="text-[11px] text-ink/40 mb-5">{level.label}</p>

      <div className="flex items-center gap-3">
        <div className="flex items-center border border-forest/15 rounded-full shrink-0">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Kurangi jumlah"
            className="w-8 h-8 flex items-center justify-center text-forest hover:bg-forest/5 rounded-full transition-colors"
          >
            âˆ’
          </button>
          <span className="w-7 text-center text-sm font-mono text-forest">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            aria-label="Tambah jumlah"
            className="w-8 h-8 flex items-center justify-center text-forest hover:bg-forest/5 rounded-full transition-colors"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={handleOrder}
          disabled={status === "sent"}
          className="flex-1 bg-forest text-cream rounded-full py-2.5 text-sm font-medium transition-colors hover:bg-forest-2 disabled:opacity-70"
        >
          {status === "sent" ? "Permintaan terkirim âœ“" : "Pesan Ulang"}
        </button>
      </div>
    </div>
  );
}
```

## FILE: components/dashboard/sidebar.tsx

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [mitraName, setMitraName] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase
        .from("mitra_profiles")
        .select("nama_mitra")
        .eq("user_id", data.user.id)
        .maybeSingle();
      setMitraName(profile?.nama_mitra ?? data.user.email ?? null);
    });
  }, []);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/masuk");
  }

  return (
    <aside className="w-64 shrink-0 bg-forest text-cream flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-cream/10">
        <span className="font-display font-semibold text-lg tracking-tight">
          LENTERA
        </span>
        <p className="text-xs text-cream/45 mt-1">Portal Mitra</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-cream/65 hover:text-cream hover:bg-cream/8 transition-colors"
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
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-cream/65 hover:text-cream hover:bg-cream/8 transition-colors w-full"
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
import { MagneticButton } from "./ui/magnetic-button";

const metrics = [
  {
    label: "Kapasitas olah harian",
    value: "120",
    unit: "ton/hari",
    accent: "border-green",
    position: "left-0 top-4 md:top-8 w-44 md:w-48",
    rotate: -6,
    delay: 0.2,
  },
  {
    label: "Mitra aktif",
    value: "84",
    unit: "titik",
    accent: "border-gold",
    position: "right-0 top-20 md:top-24 w-40 md:w-44",
    rotate: 5,
    delay: 0.7,
  },
  {
    label: "Energi tersalurkan",
    value: "3.240",
    unit: "MWh/bln",
    accent: "border-clay",
    position: "left-2 md:left-4 bottom-2 md:bottom-4 w-48 md:w-52",
    rotate: -4,
    delay: 1.2,
  },
];

export function Hero() {
  return (
    <header className="relative min-h-screen flex items-center pt-28 pb-16 px-6 md:px-10 overflow-hidden">
      <motion.div
        aria-hidden
        className="absolute w-[520px] h-[520px] rounded-full bg-green/30 blur-[80px] -top-40 -left-40"
      />
      <motion.div
        aria-hidden
        className="absolute w-[420px] h-[420px] rounded-full bg-gold/25 blur-[80px] top-1/3 -right-32"
      />

      <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center relative z-10">
        <div>
          <Reveal>
            <div className="inline-flex items-center gap-2 border border-forest/20 rounded-full px-4 py-1.5 mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-green" />
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
              <MagneticButton href="#kontak" variant="primary">
                Jadi Mitra Sekarang
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </MagneticButton>
              <MagneticButton href="#cara-kerja" variant="secondary">
                Lihat Cara Kerja
              </MagneticButton>
            </div>
          </Reveal>
        </div>

        <div className="relative h-[420px] md:h-[520px] flex items-center justify-center">
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10"
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

          {metrics.map((m) => (
            <TiltCard
              key={m.label}
              rotate={m.rotate}
              delay={m.delay}
              className={`absolute ${m.position} z-20`}
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
    <div className="flex items-center gap-2 px-5 py-4 border-b border-forest/8">
      <span className={`w-2.5 h-2.5 rounded-full ${accentStyles[accent].bg}`} />
      <span className="w-2.5 h-2.5 rounded-full bg-forest/15" />
      <span className="w-2.5 h-2.5 rounded-full bg-forest/15" />
      <span className="ml-2 font-mono text-xs text-ink/40">{label}</span>
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
    <div className="p-6 md:p-8">
      <p className="font-mono text-[11px] tracking-widest uppercase text-ink/40 mb-4">
        Jadwal pengumpulan hari ini
      </p>
      <div className="space-y-2.5 mb-8">
        {points.map((p) => (
          <div
            key={p.name}
            className="flex items-center justify-between bg-cream rounded-xl px-4 py-3"
          >
            <span className="text-sm text-forest font-medium">{p.name}</span>
            <span
              className={`text-xs font-mono px-2.5 py-1 rounded-full ${
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
      <div className="flex items-end justify-between border-t border-forest/8 pt-6">
        <div>
          <p className="text-xs text-ink/45 mb-1">Total dikumpulkan</p>
          <p className="font-display font-semibold text-3xl text-forest">
            120 <span className="text-sm font-body font-medium text-ink/45">ton/hari</span>
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
    <div className="p-6 md:p-8">
      <p className="font-mono text-[11px] tracking-widest uppercase text-ink/40 mb-6">
        Status pengolahan real-time
      </p>
      <div className="flex items-center gap-8">
        <svg width="140" height="140" viewBox="0 0 140 140" className="shrink-0">
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
        <div className="space-y-4 flex-1">
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
    <div className="p-6 md:p-8">
      <p className="font-mono text-[11px] tracking-widest uppercase text-ink/40 mb-6">
        Energi tersalurkan per bulan
      </p>
      <div className="flex items-end justify-between gap-3 h-32 mb-3">
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
      <div className="flex justify-between mb-8">
        {labels.map((l) => (
          <span key={l} className="text-xs text-ink/40 flex-1 text-center">
            {l}
          </span>
        ))}
      </div>
      <div className="border-t border-forest/8 pt-6">
        <p className="text-xs text-ink/45 mb-1">Bulan ini</p>
        <p className="font-display font-semibold text-3xl text-forest">
          3.240 <span className="text-sm font-body font-medium text-ink/45">MWh</span>
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
    <section id="cara-kerja" className="py-24 md:py-28 px-6 md:px-10 bg-paper">
      <div className="max-w-7xl mx-auto">
        <Reveal className="max-w-xl mb-14 md:mb-16">
          <p className="font-mono text-xs tracking-widest uppercase text-green mb-3">
            Cara kerja
          </p>
          <h2 className="font-display font-semibold text-3xl md:text-4xl text-forest">
            Satu alur, dari pabrik sampai ke masyarakat.
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-[minmax(0,360px)_1fr] gap-4 md:gap-14 items-start">
          <div>
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
                  className="w-9 h-9 rounded-full border border-forest/15 flex items-center justify-center text-forest transition-colors hover:bg-forest/5 disabled:opacity-25 disabled:pointer-events-none"
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
                  className="w-9 h-9 rounded-full border border-forest/15 flex items-center justify-center text-forest transition-colors hover:bg-forest/5 disabled:opacity-25 disabled:pointer-events-none"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 -mx-6 px-6 md:mx-0 md:px-0">
            {tabs.map((t, i) => {
              const isActive = i === active;
              return (
                <button
                  key={t.number}
                  onClick={() => setActive(i)}
                  className={`relative text-left shrink-0 md:shrink w-64 md:w-auto rounded-2xl px-5 py-4 transition-colors duration-300 ${
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

          <div className="rounded-3xl bg-paper border border-forest/10 shadow-[0_30px_60px_-20px_rgba(23,48,31,0.18)] overflow-hidden">
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
  { height: number; main: string; light: string; dark: string; width: string; delay: number }
> = {
  2: { height: 128, main: "#17301F", light: "#2A4F35", dark: "#0F2417", width: "8rem", delay: 0.2 },
  1: { height: 190, main: "#C99A3D", light: "#E4C078", dark: "#A67D30", width: "9.5rem", delay: 0.05 },
  3: { height: 86, main: "#7A5738", light: "#A9835C", dark: "#5E4229", width: "8rem", delay: 0.35 },
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
    <section id="peringkat" className="py-24 md:py-28 px-6 md:px-10 bg-cream">
      <div className="max-w-7xl mx-auto">
        <Reveal className="max-w-xl mb-16">
          <p className="font-mono text-xs tracking-widest uppercase text-clay mb-3">
            Papan peringkat Â· pratinjau
          </p>
          <h2 className="font-display font-semibold text-3xl md:text-4xl text-forest mb-4">
            Kontributor limbah terbanyak bulan ini.
          </h2>
          <p className="text-ink/65 text-[15px] leading-relaxed max-w-lg">
            Lima industri dengan volume limbah terbesar yang dikumpulkan dan
            diolah lewat jaringan LENTERA bulan ini.
          </p>
        </Reveal>

        <div className="grid lg:grid-cols-[0.95fr_1.2fr] gap-14 lg:gap-10 items-center">
          {/* Peringkat 4-5 + teks penjelasan */}
          <div className="order-2 lg:order-1">
            <RevealGroup className="space-y-3">
              {rest.map((entry) => (
                <RevealItem key={entry.rank}>
                  <div className="flex items-center gap-4 bg-paper rounded-2xl border border-forest/8 px-5 py-4">
                    <span className="font-display font-semibold text-2xl text-ink/25 w-6 shrink-0">
                      {entry.rank}
                    </span>
                    <CompanyLogo
                      name={entry.name}
                      logoUrl={entry.logoUrl}
                      logoType={entry.logoType}
                      accent={entry.accent}
                      className="w-11 h-11"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-forest text-[15px] truncate">
                        {entry.name}
                      </p>
                      <p className="text-ink/50 text-xs">{entry.industry}</p>
                    </div>
                    <span className="ml-auto font-mono text-xs text-ink/50 shrink-0">
                      {entry.volume}
                    </span>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>

            <Reveal delay={0.15}>
              <p className="mt-8 text-ink/55 text-[14.5px] leading-relaxed">
                Peringkat disusun dari volume limbah yang berhasil dikumpulkan
                dan diproses setiap bulan, konsistensi pasokan, serta tingkat
                pemilahan limbah sejak dari sumber. Lima industri di atas
                secara rutin menjadi kontributor terbesar dalam jaringan
                LENTERA.
              </p>
            </Reveal>
          </div>

          {/* Podium peringkat 1-3 â€” dibuat sendiri (SVG), bukan dari foto,
              supaya kartu logo dijamin pas di atas tiap anak tangga */}
          <div className="order-1 lg:order-2 flex items-end justify-center gap-4 md:gap-6">
            {podiumOrder.map((rank) => {
              const entry = top3.find((e) => e.rank === rank)!;
              const cfg = podiumConfig[rank];
              return (
                <div
                  key={rank}
                  className="flex flex-col items-center"
                  style={{ width: cfg.width }}
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
                    className={`mb-4 w-full bg-paper rounded-2xl p-3.5 border-l-[3px] ${accentBorder[entry.accent]} shadow-[0_16px_32px_-12px_rgba(23,48,31,0.18)] text-center`}
                  >
                    <CompanyLogo
                      name={entry.name}
                      logoUrl={entry.logoUrl}
                      logoType={entry.logoType}
                      accent={entry.accent}
                      className="w-10 h-10 mx-auto mb-2"
                    />
                    <p className="font-medium text-forest text-[12.5px] leading-snug line-clamp-2 min-h-[2.4em]">
                      {entry.name}
                    </p>
                    <p className="font-mono text-[11px] text-ink/45 mt-1">
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

## FILE: components/navbar.tsx

```tsx
"use client";

import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { useState } from "react";
import Image from "next/image";

const links = [
  { href: "#cara-kerja", label: "Cara Kerja" },
  { href: "#mitra", label: "Untuk Mitra" },
  { href: "#jaringan", label: "Jaringan" },
  { href: "#kontak", label: "Kontak" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 40);
  });

  return (
    <motion.nav
      animate={{
        backgroundColor: scrolled ? "rgba(246,242,230,0.85)" : "rgba(246,242,230,0)",
        borderColor: scrolled ? "rgba(34,29,22,0.08)" : "rgba(34,29,22,0)",
        backdropFilter: scrolled ? "blur(10px)" : "blur(0px)",
      }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 border-b"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-20 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5">
          <Image src="/images/logo.png" alt="LENTERA" width={40} height={40} className="h-10 w-auto" priority />
          <span className="font-display font-semibold text-lg tracking-tight text-forest">
            LENTERA
          </span>
        </a>

        <div className="hidden md:flex items-center gap-9 text-sm font-medium text-ink/80">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-forest transition-colors">
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-5">
          <a
            href="/masuk"
            className="hidden sm:inline text-sm font-medium text-ink/70 hover:text-forest transition-colors"
          >
            Masuk
          </a>
          <a
            href="/daftar"
            className="bg-forest text-cream text-sm font-medium px-5 py-2.5 rounded-full hover:bg-forest-2 transition-colors"
          >
            Daftar
          </a>
        </div>
      </div>
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
import { networkPoints, networkColors, networkLabels } from "@/lib/network-data";

export function PartnersMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;

      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
      }).setView([-1.5, 110], 5);
      mapRef.current = map;

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution: "&copy; OpenStreetMap &copy; CARTO",
          maxZoom: 18,
        }
      ).addTo(map);

      const pinIcon = (color: string) =>
        L.divIcon({
          className: "",
          html: `<div class="marker-pin" style="background:${color}"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

      networkPoints.forEach((point) => {
        const marker = L.marker([point.lat, point.lng], {
          icon: pinIcon(networkColors[point.type]),
        }).addTo(map);

        marker.bindPopup(
          `<strong style="color:#17301F">${point.name}</strong><br/><span style="color:${networkColors[point.type]}">${networkLabels[point.type]}</span>`
        );

        if (point.type === "mitra") {
          L.circle([point.lat, point.lng], {
            radius: 90000,
            color: networkColors.mitra,
            weight: 1,
            fillOpacity: 0.06,
            opacity: 0.35,
          }).addTo(map);
        }
      });
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-[480px] rounded-2xl overflow-hidden border border-forest/10 shadow-[0_20px_40px_-12px_rgba(23,48,31,0.18)]"
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
  const D = `${x},${yBase}`;
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
          } catch (error) {
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

## FILE: middleware.ts

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // PERBAIKAN: Gunakan app_metadata untuk keamanan tingkat tinggi, bukan user_metadata
  const role = user?.app_metadata?.role;
  const url = request.nextUrl.pathname;

  // Fungsi khusus untuk Redirect sambil tetap membawa Cookie Login yang sudah di-refresh
  const redirectSambilBawaCookie = (tujuan: string) => {
    const redirectRes = NextResponse.redirect(new URL(tujuan, request.url));
    supabaseResponse.cookies.getAll().forEach(cookie => {
      redirectRes.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectRes;
  }

  // Aturan A: Mau masuk dashboard tapi belum login? Tendang ke halaman login!
  if (url.startsWith('/dashboard') && !user) {
    return redirectSambilBawaCookie('/masuk');
  }

  // Aturan B: Orang sudah login, tapi buka halaman '/login' lagi? Kembalikan ke dashboard.
  if (url === '/login' && user) {
    if (role === 'agen') {
      return redirectSambilBawaCookie('/dashboard');
    } else if (role === 'perusahaan') {
      return redirectSambilBawaCookie('/dashboard');
    } else if (role === 'admin') {
      return redirectSambilBawaCookie('/dashboard/admin');
    }
  }

  // Aturan C & D: Setiap area dashboard hanya boleh diakses oleh role yang cocok (Sistem Default Deny).
  const areaByRole: Record<string, string> = {
    agen: '/dashboard/agen',
    perusahaan: '/dashboard/perusahaan',
    admin: '/dashboard/admin',
  };

  if (url.startsWith('/dashboard')) {
    const allowedArea = role ? areaByRole[role] : undefined;

    // Role tidak dikenal atau kosong: tolak akses ke seluruh area dashboard!
    if (!allowedArea) {
      return redirectSambilBawaCookie('/login');
    }

    const isAllowedPath =
      url === allowedArea || url.startsWith(`${allowedArea}/`);

    if (!isAllowedPath) {
      return redirectSambilBawaCookie(allowedArea);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Regex diperbaiki agar tidak memblokir rute seperti /apidocs
    '/((?!_next/static|_next/image|favicon.ico|api(?:/|$)|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

## FILE: next.config.mjs

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['192.168.100.128'],
  images: {
    // Kalau logoUrl nanti berupa URL eksternal (misal dari Supabase Storage
    // atau CDN lain), tambahkan hostname-nya di sini supaya next/image bisa
    // memuatnya. Contoh: { protocol: "https", hostname: "xxxx.supabase.co" }
    remotePatterns: [],
  },
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

## FILE: next-env.d.ts

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
import "./.next/dev/types/routes.d.ts";
import "./.next/dev/types/root-params.d.ts";

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
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
  nik_nib text not null,
  alamat text not null,
  telepon text not null,
  created_at timestamptz not null default now()
);

create table if not exists industri_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nama_perusahaan text not null,
  npwp text not null,
  alamat text not null,
  telepon text not null,
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

