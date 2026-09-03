import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("CRITICAL: Supabase URL atau Service Role Key kosong saat Runtime!");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: mitraData, error: mitraError } = await supabaseAdmin
      .from("mitra_profiles")
      .select("*");

    if (mitraError) {
      throw new Error(`DB Mitra Error: ${mitraError.message}`);
    }

    const { data: industriData, error: industriError } = await supabaseAdmin
      .from("industri_profiles")
      .select("*");

    if (industriError) {
      throw new Error(`DB Industri Error: ${industriError.message}`);
    }

    const formattedMitra = (mitraData || []).map((item) => ({
      id: item.id || item.user_id,
      nama: item.nama_mitra || item.nama_lengkap || item.nama || "Mitra Tanpa Nama",
      alamat: item.alamat || item.kota_kabupaten || "Lokasi belum diisi",
      tipe: "mitra",
      tanggalBergabung: item.created_at
        ? new Date(item.created_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "-",
    }));

    const formattedIndustri = (industriData || []).map((item) => ({
      id: item.id || item.user_id,
      nama: item.nama_perusahaan || item.nama || "Industri Tanpa Nama",
      alamat: item.alamat || item.kota_kabupaten || "Lokasi belum diisi",
      tipe: "industri",
      tanggalBergabung: item.created_at
        ? new Date(item.created_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "-",
    }));

    const combinedData = [...formattedMitra, ...formattedIndustri];

    return NextResponse.json(combinedData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}