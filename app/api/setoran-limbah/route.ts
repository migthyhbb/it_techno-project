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
    const authHeader = req.headers.get("Authorization");
    let userId = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) userId = user.id;
    }
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