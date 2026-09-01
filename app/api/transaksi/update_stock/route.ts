import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Menggunakan Service Role Key biar punya izin update database
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { product_id, quantity } = body;

    if (!product_id || !quantity) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // 1. Ambil stok dari tabel MASTER (products) dulu biar aman
    const { data: masterData, error: errMaster } = await supabaseAdmin
      .from("products")
      .select("stok, stok_dummy")
      .eq("id", product_id)
      .single();

    if (errMaster || !masterData) {
      return NextResponse.json({ error: "Produk tidak ditemukan di database master" }, { status: 404 });
    }

    const sisaStokMaster = (masterData.stok || 0) - quantity;

    // 2. Update stok di tabel master (products) - INI YANG PALING PENTING
    await supabaseAdmin
      .from("products")
      .update({ stok: sisaStokMaster, stok_dummy: sisaStokMaster })
      .eq("id", product_id);

    // 3. Coba update di tabel regional (Pakai maybeSingle biar kalau kosong NGGAK ERROR)
    const { data: regionalData } = await supabaseAdmin
      .from("regional_product_prices")
      .select("stok")
      .eq("product_id", product_id)
      .maybeSingle(); 

    // Kalau datanya ada di tabel regional, baru kita kurangi
    if (regionalData && regionalData.stok !== null) {
        const sisaStokRegional = regionalData.stok - quantity;
        await supabaseAdmin
          .from("regional_product_prices")
          .update({ stok: sisaStokRegional })
          .eq("product_id", product_id);
    }

    // 4. Kasih laporan sukses ke Frontend!
    return NextResponse.json({ success: true, sisaStok: sisaStokMaster });

  } catch (error) {
    console.error("API Update Stock Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}