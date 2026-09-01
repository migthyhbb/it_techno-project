"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"; 

interface Product {
  id: string;
  nama?: string;
  nama_produk?: string;
  deskripsi: string;
  price: number;
  unit: string;
  stock: number;
  stok?: number;
}

export function ProductCard({ product }: { product: Product }) {
  const [jumlah, setJumlah] = useState(1);
  const [loading, setLoading] = useState(false);

  const namaProduk = product.nama || product.nama_produk || "Produk Energi";
  const stokTersedia = product.stock ?? product.stok ?? 0;

  const handleOrder = async () => {
    if (jumlah > stokTersedia) {
      alert("Jumlah pesanan melebihi stok yang tersedia!");
      return;
    }

    setLoading(true);

    try {
      // 🚀 JURUS AMAN: Ambil data user SEKARANG sebelum buka Midtrans
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        alert("Gagal: Sesi login kamu tidak terbaca. Silakan refresh halaman.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/transaksi/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produk_id: product.id,
          volume_terjual_kg: Number(jumlah),
        }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Respon server bermasalah. Pastikan dev server sudah direstart.");
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat pesanan.");

      const windowSnap = (window as unknown as { snap?: any }).snap;

      if (data.token && windowSnap) {
        windowSnap.pay(data.token, {
          onSuccess: async function (result: any) {
            try {
              const updateRes = await fetch("/api/transaksi/update_stock", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  product_id: product.id,
                  quantity: jumlah,
                  user_id: user.id, // PASTI AMAN KARENA DIAMBIL DI AWAL
                  total_harga: product.price * jumlah
                })
              });

              const updateData = await updateRes.json();

              if (!updateRes.ok) {
                throw new Error(updateData.error || "Gagal nyatet ke database.");
              }

              alert("Pembayaran Berhasil! Pesanan tercatat & Stok dikurangi.");
              window.location.reload(); 
              
            } catch (err: any) {
              console.error(err);
              // 🚨 MENAMPILKAN ALASAN ASLI KENAPA DATABASE NOLAK
              alert("ERROR SYSTEM: " + err.message);
              window.location.reload();
            }
          },
          onPending: function () {
            alert("Menunggu pembayaran Anda.");
            window.location.reload();
          },
          onError: function () {
            alert("Pembayaran gagal!");
            window.location.reload();
          },
          onClose: function () {
            alert("Kamu menutup pop-up pembayaran sebelum selesai.");
            window.location.reload();
          },
        });
      } else {
        alert(data.message || "Pesanan berhasil dibuat!");
        window.location.reload();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan saat memesan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-paper rounded-2xl border border-forest/10 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="font-display font-semibold text-lg text-forest leading-snug">
            {namaProduk}
          </h3>
          <span className="text-[10px] font-bold px-2.5 py-1 bg-forest/10 text-forest rounded-full uppercase tracking-wider shrink-0">
            {stokTersedia} {product.unit}
          </span>
        </div>
        <p className="text-xs text-ink/60 mb-4 line-clamp-2">{product.deskripsi}</p>
      </div>

      <div>
        <div className="mb-4">
          <p className="text-[10px] uppercase font-mono tracking-widest text-ink/40 mb-0.5">Harga Wilayah</p>
          <p className="font-display font-bold text-forest text-lg">
            Rp {product.price.toLocaleString("id-ID")}{" "}
            <span className="text-xs font-normal text-ink/60">/{product.unit}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border border-forest/20 rounded-xl bg-cream/50 overflow-hidden">
            <button type="button" onClick={() => setJumlah((prev) => Math.max(1, prev - 1))} className="px-3 py-1.5 text-xs text-forest font-bold hover:bg-forest/10 transition-colors cursor-pointer">-</button>
            <span className="px-3 text-xs font-semibold text-forest">{jumlah}</span>
            <button type="button" onClick={() => setJumlah((prev) => prev + 1)} className="px-3 py-1.5 text-xs text-forest font-bold hover:bg-forest/10 transition-colors cursor-pointer">+</button>
          </div>

          <button type="button" onClick={handleOrder} disabled={loading || stokTersedia <= 0} className="flex-1 bg-forest text-cream py-2 px-4 rounded-xl text-xs font-semibold hover:bg-forest/90 transition-colors disabled:opacity-50 cursor-pointer">
            {loading ? "Memproses..." : "Pesan Stok"}
          </button>
        </div>
      </div>
    </div>
  );
}