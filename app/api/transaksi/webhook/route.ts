import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { isValidMidtransSignature } from "@/lib/midtrans-signature";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const order_id = String(body.order_id || "");
    const transaction_status = String(body.transaction_status || "");
    const status_code = String(body.status_code || "");
    const gross_amount = String(body.gross_amount || "");
    const signature_key = String(body.signature_key || "");
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    
    if (!serverKey) return NextResponse.json({ error: "Webhook belum dikonfigurasi" }, { status: 500 });
    if (!isValidMidtransSignature(signature_key, order_id, status_code, gross_amount, serverKey)) {
      return NextResponse.json({ error: "Invalid Signature" }, { status: 403 });
    }

    const supabase = createAdminClient();

    // -- LOGIKA JIKA GAGAL / BATAL --
    if (["expire", "cancel", "deny"].includes(transaction_status)) {
      if (!order_id.startsWith("B3-")) { 
        const { data: order } = await supabase.from("orders").select("status, items, user_id").eq("id", order_id).single();
        
        if (order && String(order.status).toLowerCase() !== "dibatalkan") {
          await supabase.from("orders").update({ status: "dibatalkan" }).eq("id", order_id);
          
          let produk_id = null;
          let jumlah = 0;
          if (order.items) {
            const itemsData = Array.isArray(order.items) ? order.items[0] : order.items;
            produk_id = itemsData?.product_id;
            jumlah = Number(itemsData?.jumlah || 0);
          }

          if (produk_id && jumlah > 0) {
            const { data: product } = await supabase.from("products").select("stok, stok_dummy").eq("id", produk_id).single();
            if (product) {
              const restoredStock = Number(product.stok || 0) + jumlah;
              await supabase.from("products").update({ stok: restoredStock, stok_dummy: restoredStock }).eq("id", produk_id);
              
              const { data: profile } = await supabase.from("mitra_profiles").select("kota_kabupaten").eq("user_id", order.user_id).maybeSingle();
              if (profile?.kota_kabupaten) {
                const { data: regProduct } = await supabase.from("regional_product_prices").select("id, stok").eq("product_id", produk_id).ilike("kota", `%${profile.kota_kabupaten}%`).maybeSingle();
                if (regProduct) {
                  await supabase.from("regional_product_prices").update({ stok: Number(regProduct.stok || 0) + jumlah }).eq("id", regProduct.id);
                }
              }
            }
          }
        }
      }
      return NextResponse.json({ message: "Pesanan dibatalkan dan stok dikembalikan" }, { status: 200 });
    }

    // -- LOGIKA JIKA SUKSES DIBAYAR --
    if (transaction_status !== "settlement" && transaction_status !== "capture") {
      return NextResponse.json({ message: "Status pembayaran diabaikan" }, { status: 200 });
    }

    if (order_id.startsWith("B3-")) { 
      const cleanId = order_id.replace("B3-", "");
      const { data: existing } = await supabase.from("waste_shipments").select("status").eq("id", cleanId).single();
      if (existing?.status === "menunggu_konfirmasi") {
        await supabase.from("waste_shipments").update({ status: "dijadwalkan" }).eq("id", cleanId).eq("status", "menunggu_konfirmasi");
      }
    } else { 
      await supabase.from("orders").update({ status: "diproses" }).eq("id", order_id).in("status", ["menunggu_pembayaran", "PENDING", "pending"]);
    }

    return NextResponse.json({ message: "Webhook sukses diverifikasi dan diproses" }, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}