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

    // 1. Kurangi Stok Master
    const { data: masterData } = await supabaseAdmin.from("products").select("stok").eq("id", product_id).single();
    if (masterData) {
      const sisa = (masterData.stok || 0) - quantity;
      await supabaseAdmin.from("products").update({ stok: sisa, stok_dummy: sisa }).eq("id", product_id);
    }

    // 2. 🚀 JURUS BARU: Kurangi Stok Regional (Looping Semua Wilayah)
    const { data: regData } = await supabaseAdmin.from("regional_product_prices").select("id, stok").eq("product_id", product_id);
    if (regData && regData.length > 0) {
      for (const reg of regData) {
        const sisaReg = (reg.stok || 0) - quantity;
        await supabaseAdmin.from("regional_product_prices").update({ stok: sisaReg }).eq("id", reg.id);
      }
    }

    // 3. Catat Pesanan
    if (user_id && total_harga) {
      await supabaseAdmin.from("orders").insert({
        id: crypto.randomUUID(), 
        user_id: user_id,
        status: "diproses",
        total_harga: total_harga,
        items: { product_id, quantity }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: "Server Error: " + error.message }, { status: 500 });
  }
}