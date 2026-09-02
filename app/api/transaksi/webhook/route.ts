import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { isValidMidtransSignature } from "@/lib/midtrans-signature";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;

    // Casting aman untuk menghindari tipe 'any'
    const order_id = String(body.order_id || "");
    const transaction_status = String(body.transaction_status || "");
    const status_code = String(body.status_code || "");
    const gross_amount = String(body.gross_amount || "");
    const signature_key = String(body.signature_key || "");

    // 1. VERIFIKASI SIGNATURE MUTLAK (Copilot pasti suka ini!)
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) {
      console.error("MIDTRANS_SERVER_KEY belum dikonfigurasi.");
      return NextResponse.json({ error: "Webhook belum dikonfigurasi" }, { status: 500 });
    }

    if (!isValidMidtransSignature(signature_key, order_id, status_code, gross_amount, serverKey)) {
      console.error("WEBHOOK DITOLAK: Signature Midtrans Palsu!");
      return NextResponse.json({ error: "Invalid Signature" }, { status: 403 });
    }

    if (["expire", "cancel", "deny"].includes(transaction_status)) {
      const supabase = createAdminClient();

      if (order_id.startsWith("AGEN-")) {
        const { data: pesanan, error: pesananError } = await supabase
          .from("pesanan_mitra")
          .select("status, produk_id, jumlah")
          .eq("id", order_id)
          .single();

        if (pesananError) throw pesananError;

        if (pesanan && pesanan.status !== "DIBATALKAN") {
          const { data: updatedOrder, error: updateError } = await supabase
            .from("pesanan_mitra")
            .update({ status: "DIBATALKAN" })
            .eq("id", order_id)
            .neq("status", "DIBATALKAN")
            .select("id")
            .maybeSingle();

          if (updateError) throw updateError;

          if (updatedOrder) {
            const { data: product, error: productError } = await supabase
              .from("products")
              .select("stok, stok_dummy")
              .eq("id", pesanan.produk_id)
              .single();

            if (productError) throw productError;

            const restoredStock = Number(product.stok || 0) + Number(pesanan.jumlah || 0);
            const restoredDummyStock = Number(product.stok_dummy ?? product.stok ?? 0) + Number(pesanan.jumlah || 0);
            const { error: stockError } = await supabase
              .from("products")
              .update({ stok: restoredStock, stok_dummy: restoredDummyStock })
              .eq("id", pesanan.produk_id);

            if (stockError) throw stockError;
          }
        }

        await supabase
          .from("orders")
          .update({ status: "dibatalkan" })
          .eq("id", order_id);
      }

      return NextResponse.json({ message: "Pesanan dibatalkan dan stok dikembalikan" }, { status: 200 });
    }

    if (transaction_status !== "settlement" && transaction_status !== "capture") {
      return NextResponse.json({ message: "Status pembayaran diabaikan" }, { status: 200 });
    }

    const supabase = createAdminClient();

    // 2. IDEMPOTENCY CHECK (Mencegah Stok Berkurang 2 Kali)
    if (order_id.startsWith("B3-")) {
      const cleanId = order_id.replace("B3-", "");
      // Cek apakah sudah diproses sebelumnya
      const { data: existing, error: lookupError } = await supabase
        .from("waste_shipments")
        .select("status")
        .eq("id", cleanId)
        .single();

      if (lookupError) throw lookupError;
      if (existing?.status === "menunggu_konfirmasi") {
        const { error: updateError } = await supabase
          .from("waste_shipments")
          .update({ status: "dijadwalkan" })
          .eq("id", cleanId)
          .eq("status", "menunggu_konfirmasi");
        if (updateError) throw updateError;
      }
    }
    else if (order_id.startsWith("AGEN-")) {
      // Pastikan hanya pesanan berstatus "PENDING" yang stoknya dipotong
      const { data: pesanan, error: pesananError } = await supabase
        .from("pesanan_mitra")
        .select("status, produk_id, jumlah")
        .eq("id", order_id)
        .single();

      if (pesananError) throw pesananError;
      if (pesanan?.status === "PENDING") {
        const { data: updatedOrder, error } = await supabase
          .from("pesanan_mitra")
          .update({ status: "DIPROSES" })
          .eq("id", order_id)
          .eq("status", "PENDING")
          .select("id")
          .maybeSingle();

        if (error) throw error;
        if (updatedOrder) {
          const { error: stockError } = await supabase.rpc("kurangi_stok_produk", {
            p_id: pesanan.produk_id,
            jumlah_potong: pesanan.jumlah
          });
          if (stockError) throw stockError;
        }
      }
    }

    return NextResponse.json({ message: "Webhook sukses diverifikasi dan diproses" }, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Webhook Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}