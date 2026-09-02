import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    // Utamakan Service Role Key untuk bypass RLS di server
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "";

    // Inisialisasi admin client khusus backend
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // 1. Fetch data mitra
    const { data: mitraData, error: mitraError } = await supabaseAdmin
      .from("mitra_profiles")
      .select("id, user_id, nama_mitra, alamat, created_at, status_akun");

    if (mitraError) {
      console.error("Error fetching mitra_profiles:", mitraError.message);
    }

    // 2. Fetch data industri
    const { data: industriData, error: industriError } = await supabaseAdmin
      .from("industri_profiles")
      .select("id, user_id, nama_perusahaan, alamat, created_at, status_akun");

    if (industriError) {
      console.error("Error fetching industri_profiles:", industriError.message);
    }

    // Filter hanya akun yang statusnya 'aktif' atau tidak dibanned
    const validMitra = (mitraData || []).filter(
      (m) => !m.status_akun || m.status_akun === "aktif"
    );
    const validIndustri = (industriData || []).filter(
      (i) => !i.status_akun || i.status_akun === "aktif"
    );

    // 3. Mapping data mitra
    const formattedMitra = validMitra.map((item) => ({
      id: item.id || item.user_id,
      nama: item.nama_mitra || "Mitra Tanpa Nama",
      alamat: item.alamat || "Lokasi belum diisi",
      tipe: "mitra" as const,
      tanggalBergabung: item.created_at
        ? new Date(item.created_at).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "-",
    }));

    // 4. Mapping data industri
    const formattedIndustri = validIndustri.map((item) => ({
      id: item.id || item.user_id,
      nama: item.nama_perusahaan || "Industri Tanpa Nama",
      alamat: item.alamat || "Lokasi belum diisi",
      tipe: "industri" as const,
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