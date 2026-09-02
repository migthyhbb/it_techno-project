import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// PANGGIL JALUR VIP (SERVICE ROLE) BIAR BISA NEMBUS RLS DARI BACKEND
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET() {
  try {
    // 1. Fetch data mitra (CUMA AMBIL KOLOM YANG AMAN DILIHAT PUBLIK!)
    const { data: mitraData, error: mitraError } = await supabaseAdmin
      .from("mitra_profiles")
      .select("id, user_id, nama_mitra, alamat, created_at");

    // 2. Fetch data industri (CUMA AMBIL KOLOM YANG AMAN DILIHAT PUBLIK!)
    const { data: industriData, error: industriError } = await supabaseAdmin
      .from("industri_profiles")
      .select("id, user_id, nama_perusahaan, alamat, created_at");

    if (mitraError) {
      console.error("Error fetching mitra_profiles:", mitraError.message);
    }

    if (industriError) {
      console.error("Error fetching industri_profiles:", industriError.message);
    }

    // 3. Mapping data mitra
    const formattedMitra = (mitraData || []).map((item) => ({
      id: item.id || item.user_id,
      nama: item.nama_mitra || "Mitra Tanpa Nama",
      alamat: item.alamat || "Lokasi belum diisi",
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
    const formattedIndustri = (industriData || []).map((item) => ({
      id: item.id || item.user_id,
      nama: item.nama_perusahaan || "Industri Tanpa Nama",
      alamat: item.alamat || "Lokasi belum diisi",
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