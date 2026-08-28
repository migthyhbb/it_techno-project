import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { translateAuthError } from "@/lib/auth-errors";

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
    lng
  } = body;

  if (!email || !password || !nama_mitra || !nik_nib || !alamat || !telepon) {
    return NextResponse.json(
      { error: "Semua kolom utama wajib diisi." },
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