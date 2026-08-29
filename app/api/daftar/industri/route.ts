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
    //    Pakai service role jadi tidak kena RLS — tidak bergantung sesi
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
      // Akun sudah kebuat tapi profil gagal disimpan — hapus lagi akunnya
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
