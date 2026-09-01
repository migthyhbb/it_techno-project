import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { product_id, quantity, user_id, total_harga } = body;

    if (!product_id || !quantity) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // 1. Kurangi Stok di Master Products
    const { data: masterData } = await supabaseAdmin
      .from("products")
      .select("stok")
      .eq("id", product_id)
      .single();

    if (masterData) {
      const sisa = (masterData.stok || 0) - quantity;
      await supabaseAdmin.from("products").update({ stok: sisa, stok_dummy: sisa }).eq("id", product_id);
    }

    // 2. Kurangi Stok di Regional (kalau ada)
    const { data: regData } = await supabaseAdmin
      .from("regional_product_prices")
      .select("stok")
      .eq("product_id", product_id)
      .maybeSingle();

    if (regData && regData.stok !== null) {
      const sisaReg = regData.stok - quantity;
      await supabaseAdmin.from("regional_product_prices").update({ stok: sisaReg }).eq("product_id", product_id);
    }

    // 3. 🚀 CATAT PESANAN KE TABEL ORDERS BIAR MUNCUL DI LAYAR!
    if (user_id && total_harga) {
      const { error: insertError } = await supabaseAdmin.from("orders").insert({
        user_id: user_id,
        status: "diproses",
        total_harga: total_harga,
        items: { product_id, quantity }
      });
      
      if (insertError) console.error("Gagal nyatet order:", insertError);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("API Update Stock Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}