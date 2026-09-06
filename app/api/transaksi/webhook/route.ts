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

    if (["expire", "cancel", "deny"].includes(transaction_status)) {
      if (!order_id.startsWith("B3-")) { 
        // Bebas lint error: Variabel pesananError dihapus karena tidak dibutuhkan
        const { data: pesanan } = await supabase.from("pesanan_mitra").select("status, produk_id, jumlah, user_id").eq("id", order_id).single();
        if (pesanan && pesanan.status !== "DIBATALKAN") {
          await supabase.from("pesanan_mitra").update({ status: "DIBATALKAN" }).eq("id", order_id).neq("status", "DIBATALKAN");
          
          const { data: product } = await supabase.from("products").select("stok, stok_dummy").eq("id", pesanan.produk_id).single();
          if (product) {
            const restoredStock = Number(product.stok || 0) + Number(pesanan.jumlah || 0);
            await supabase.from("products").update({ stok: restoredStock, stok_dummy: restoredStock }).eq("id", pesanan.produk_id);
            
            const { data: profile } = await supabase.from("mitra_profiles").select("kota_kabupaten").eq("user_id", pesanan.user_id).maybeSingle();
            if (profile?.kota_kabupaten) {
              const { data: regProduct } = await supabase.from("regional_product_prices").select("id, stok").eq("product_id", pesanan.produk_id).ilike("kota", `%${profile.kota_kabupaten}%`).maybeSingle();
              if (regProduct) {
                await supabase.from("regional_product_prices").update({ stok: Number(regProduct.stok || 0) + Number(pesanan.jumlah || 0) }).eq("id", regProduct.id);
              }
            }
          }
        }
        await supabase.from("orders").update({ status: "dibatalkan" }).eq("id", order_id);
      }
      return NextResponse.json({ message: "Pesanan dibatalkan dan stok dikembalikan" }, { status: 200 });
    }

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
      const { data: pesanan } = await supabase.from("pesanan_mitra").select("status").eq("id", order_id).single();
      if (pesanan && ["PENDING", "MENUNGGU_PEMBAYARAN"].includes(String(pesanan.status).toUpperCase())) {
        await supabase.from("pesanan_mitra").update({ status: "DIPROSES" }).eq("id", order_id).in("status", ["PENDING", "MENUNGGU_PEMBAYARAN"]);
      }
      await supabase.from("orders").update({ status: "diproses" }).eq("id", order_id).in("status", ["menunggu_pembayaran", "PENDING", "pending"]);
    }

    return NextResponse.json({ message: "Webhook sukses diverifikasi dan diproses" }, { status: 200 });
  } catch (error: unknown) {
    // Bebas lint error: error: any diubah jadi error: unknown
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}