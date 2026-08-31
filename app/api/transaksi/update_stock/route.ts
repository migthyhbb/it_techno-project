import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Menggunakan SERVICE ROLE KEY (Kunci Master rahasia) agar aman dan bisa bypass RLS di server
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Pastikan key ini ada di .env Abang
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { product_id, quantity } = body;

    if (!product_id || !quantity) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // 1. Cek stok saat ini di tabel regional
    const { data: regionalData, error: errCek } = await supabaseAdmin
      .from("regional_product_prices")
      .select("stok")
      .eq("product_id", product_id)
      .single();

    if (errCek || !regionalData) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    // 2. Hitung sisa stok
    const sisaStok = regionalData.stok - quantity;
    if (sisaStok < 0) {
      return NextResponse.json({ error: "Stok tidak mencukupi" }, { status: 400 });
    }

    // 3. Update stok di tabel regional
    await supabaseAdmin
      .from("regional_product_prices")
      .update({ stok: sisaStok })
      .eq("product_id", product_id);

    // 4. Update stok di tabel products
    await supabaseAdmin
      .from("products")
      .update({ stok_dummy: sisaStok, stok: sisaStok })
      .eq("id", product_id);

    return NextResponse.json({ success: true, sisaStok });
  } catch (error) {
    console.error("Gagal update stok:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}