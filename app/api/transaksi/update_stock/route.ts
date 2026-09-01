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

    // 1. Cek stok lama
    const { data: regionalData, error: errCek } = await supabaseAdmin
      .from("regional_product_prices")
      .select("stok")
      .eq("product_id", product_id)
      .single();

    if (errCek || !regionalData) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    // 2. Kurangi stok
    const sisaStok = regionalData.stok - quantity;

    const { error: updateError } = await supabaseAdmin
      .from("regional_product_prices")
      .update({ stok: sisaStok })
      .eq("product_id", product_id);

    if (updateError) throw new Error("Gagal update stok regional");

    // 3. Sinkronkan dengan master produk
    await supabaseAdmin
      .from("products")
      .update({ stok_dummy: sisaStok, stok: sisaStok })
      .eq("id", product_id);

    return NextResponse.json({ success: true, sisaStok });

  } catch (error) {
    console.error("API Update Stock Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}