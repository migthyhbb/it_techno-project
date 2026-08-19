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
<<<<<<< HEAD
=======
    if (!supabase) {
      return NextResponse.json(
        {
          error:
            "Server belum dikonfigurasi untuk pendaftaran. Pastikan NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY sudah diisi di .env.local, lalu restart server.",
        },
        { status: 500 }
      );
    }
>>>>>>> 23577b581cc61de8da2b7c68da516d87b8dadee4

    // 1) Buat akun. email_confirm: true supaya akun langsung aktif dan bisa
    //    langsung masuk tanpa menunggu klik link konfirmasi di email.
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError) {
<<<<<<< HEAD
=======
      console.error("Gagal membuat akun mitra:", createError);
>>>>>>> 23577b581cc61de8da2b7c68da516d87b8dadee4
      return NextResponse.json(
        { error: translateAuthError(createError.message) },
        { status: 400 }
      );
    }

    // 2) Simpan detail profil, ditautkan ke user_id yang baru dibuat.
    //    Pakai service role jadi tidak kena RLS — tidak bergantung sesi
    //    login yang belum tentu ada di titik ini.
    const { error: profileError } = await supabase.from("mitra_profiles").insert({
      user_id: userData.user.id,
      nama_mitra,
      nik_nib,
      alamat,
      telepon,
    });
    if (profileError) {
<<<<<<< HEAD
=======
      console.error("Gagal menyimpan profil mitra:", profileError);
>>>>>>> 23577b581cc61de8da2b7c68da516d87b8dadee4
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
<<<<<<< HEAD
  } catch {
=======
  } catch (err) {
    console.error("Kesalahan tak terduga saat daftar mitra:", err);
>>>>>>> 23577b581cc61de8da2b7c68da516d87b8dadee4
    return NextResponse.json(
      { error: "Terjadi kesalahan di server, coba lagi." },
      { status: 500 }
    );
  }
}
