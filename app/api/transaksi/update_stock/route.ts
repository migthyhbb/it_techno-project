import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Wajib pakai Service Role Key biar bisa bypass RLS saat update stok
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { product_id, quantity } = body;

    // 1. Validasi input
    if (!product_id || !quantity) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // 2. Ambil data stok saat ini
    const { data: regionalData, error: errCek } = await supabaseAdmin
      .from("regional_product_prices")
      .select("stok")
      .eq("product_id", product_id)
      .single();

    if (errCek || !regionalData) {
      return NextResponse.json({ error: "Produk tidak ditemukan di regional" }, { status: 404 });
    }

    // 3. Hitung sisa stok
    const sisaStok = regionalData.stok - quantity;

    // 4. Update stok di tabel regional_product_prices
    const { error: updateError } = await supabaseAdmin
      .from("regional_product_prices")
      .update({ stok: sisaStok })
      .eq("product_id", product_id);

    if (updateError) {
      throw new Error("Gagal update stok regional");
    }

    // 5. Update stok di tabel products induk
    const { error: updateProdError } = await supabaseAdmin
      .from("products")
      .update({ stok_dummy: sisaStok, stok: sisaStok })
      .eq("id", product_id);

    if (updateProdError) {
      console.error("Gagal update master product:", updateProdError);
      // Kita tidak melempar error di sini agar transaksi user tetap dianggap sukses 
      // asalkan stok regional sudah berhasil dikurangi.
    }

    // 6. Berikan respons sukses ke frontend
    return NextResponse.json({ success: true, sisaStok });

  } catch (error) {
    console.error("API Update Stock Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}