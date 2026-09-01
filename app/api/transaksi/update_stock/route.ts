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

    // 🚀 CEK KETAT: Pastikan user_id nyampe ke server!
    if (!user_id) {
      return NextResponse.json({ error: "Data User ID hilang di jalan!" }, { status: 400 });
    }

    // 1. Kurangi Stok Master
    const { data: masterData } = await supabaseAdmin.from("products").select("stok").eq("id", product_id).single();
    if (masterData) {
      const sisa = (masterData.stok || 0) - quantity;
      await supabaseAdmin.from("products").update({ stok: sisa, stok_dummy: sisa }).eq("id", product_id);
    }

    // 2. Kurangi Stok Regional
    const { data: regData } = await supabaseAdmin.from("regional_product_prices").select("stok").eq("product_id", product_id).maybeSingle();
    if (regData && regData.stok !== null) {
      const sisaReg = regData.stok - quantity;
      await supabaseAdmin.from("regional_product_prices").update({ stok: sisaReg }).eq("product_id", product_id);
    }

    // 3. 🚀 CATAT PESANAN (Paksa bikin ID sendiri pakai crypto.randomUUID biar aman)
    const { error: insertError } = await supabaseAdmin.from("orders").insert({
      id: crypto.randomUUID(), 
      user_id: user_id,
      status: "diproses",
      total_harga: total_harga,
      items: { product_id, quantity }
    });
    
    // 🚨 KALAU DATABASE NOLAK, KITA LEMPAR KE LAYAR BIAR KETAHUAN!
    if (insertError) {
      return NextResponse.json({ error: "Database Nolak: " + insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: "Server Error: " + error.message }, { status: 500 });
  }
}