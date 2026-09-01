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

    // Paksa pastikan quantity jadi format Angka (Number)
    const qtyNum = Number(quantity);

    if (!product_id || !qtyNum) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // 1. Kurangi Stok Master (Products)
    const { data: masterData } = await supabaseAdmin.from("products").select("stok").eq("id", product_id).single();
    if (masterData) {
      const sisa = Number(masterData.stok || 0) - qtyNum;
      await supabaseAdmin.from("products").update({ stok: sisa, stok_dummy: sisa }).eq("id", product_id);
    }

    // 2. Kurangi Stok Wilayah (Regional)
    const { data: regData } = await supabaseAdmin.from("regional_product_prices").select("id, stok").eq("product_id", product_id);
    if (regData && regData.length > 0) {
      for (const reg of regData) {
        const sisaReg = Number(reg.stok || 0) - qtyNum;
        await supabaseAdmin.from("regional_product_prices").update({ stok: sisaReg }).eq("id", reg.id);
      }
    }

    // 3. Catat Struk Pesanan ke Orders
    if (user_id && total_harga) {
      const { error: errOrder } = await supabaseAdmin.from("orders").insert({
        id: crypto.randomUUID(), 
        user_id: user_id,
        status: "diproses",
        total_harga: Number(total_harga),
        items: { product_id, quantity: qtyNum }
      });
      
      // Kalau nolak, panggil error ke layar!
      if (errOrder) throw new Error("Gagal catat pesanan: " + errOrder.message);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}