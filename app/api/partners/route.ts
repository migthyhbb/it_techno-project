import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-client";

export async function GET() {
  try {
    // 1. Fetch data dari tabel mitra_profiles
    const { data: mitraData, error: mitraError } = await supabase
      .from("mitra_profiles")
      .select("*");

    // 2. Fetch data dari tabel industri_profiles
    const { data: industriData, error: industriError } = await supabase
      .from("industri_profiles")
      .select("*");

    if (mitraError) {
      console.error("Error fetching mitra_profiles:", mitraError.message);
    }

    if (industriError) {
      console.error("Error fetching industri_profiles:", industriError.message);
    }

    // 3. Mapping data mitra
    const formattedMitra = (mitraData || []).map((item: any) => ({
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
    const formattedIndustri = (industriData || []).map((item: any) => ({
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
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}