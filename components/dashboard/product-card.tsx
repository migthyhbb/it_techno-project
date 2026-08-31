"use client";

import { useState } from "react";
// 👇 IMPORT SUPABASE DITAMBAHKAN DI SINI 👇
import { createSupabaseBrowserClient } from "@/lib/supabase-browser"; 

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    snap: any;
  }
}

interface ProductCardProps {
  product: {
    id: string;
    nama_produk?: string;
    deskripsi?: string;
    harga_default?: number;
    price?: number;
    satuan?: string;
    unit?: string;
    stok_dummy?: number;
    stok?: number;
    stock?: number;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");

  const title = product.nama_produk || "Produk Energi";
  const price = product.price ?? product.harga_default ?? 0;
  const unit = product.unit || product.satuan || "unit";
  const currentStock = product.stock ?? product.stok ?? product.stok_dummy ?? 0;

  const handleDecrease = () => quantity > 1 && setQuantity(quantity - 1);
  const handleIncrease = () => quantity < currentStock && setQuantity(quantity + 1);

  async function handleOrder() {
    setStatus("loading");
    try {
      const res = await fetch("/api/transaksi/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          volume_terjual_kg: quantity,
          produk_id: product.id
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses pesanan.");
      
      // MUNCULKAN MIDTRANS SNAP POP-UP
      if (window.snap && data.token) {
        window.snap.pay(data.token, {
      onSuccess: async function(result: any) {
            console.log("CCTV 1: MIDTRANS BERHASIL!", result); // Laporan 1
            try {
              setStatus("loading");
              console.log("CCTV 2: Persiapan ngetuk pintu API update_stock...");
              console.log("Data yang mau dikirim:", { id: product.id, qty: quantity });
              
              const res = await fetch("/api/transaksi/update_stock", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  product_id: product.id,
                  quantity: quantity
                })
              });

              console.log("CCTV 3: Pintu API udah diketuk. Status HTTP:", res.status);
              
              const data = await res.json();
              console.log("CCTV 4: Balasan dari server API:", data);

              if (!res.ok) {
                throw new Error(data.error || "Server ngasih respon error");
              }

              alert("Pembayaran Berhasil! Stok telah dikurangi.");
              setStatus("sent");
              // window.location.reload(); <-- Biarin mati dulu buat ngetes

            } catch (err) {
              console.error("🚨 CCTV ERROR DI FRONTEND:", err);
              alert("Gagal nyambung ke API Update Stok!");
            }
          },
          onPending: function() {
            alert("Menunggu pembayaran diselesaikan...");
            setStatus("idle");
          },
          onError: function() {
            alert("Pembayaran Gagal!");
            setStatus("idle");
          },
          onClose: function() {
            setStatus("idle");
          }
        });
      } else {
        alert("Sistem pembayaran sedang tidak siap.");
        setStatus("idle");
      }

    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Gagal terhubung ke server.";
      alert(msg);
      setStatus("idle");
    }
  }

  return (
    <div className="bg-paper p-5 rounded-2xl border border-forest/10 flex flex-col justify-between shadow-xs relative">
      <div>
        <div className="flex justify-between items-start mb-2 gap-2">
          <h3 className="font-display font-semibold text-forest text-lg">{title}</h3>
          <span className="text-[11px] font-mono font-medium bg-gold/15 text-gold-dark px-2.5 py-1 rounded-md shrink-0">
            {currentStock} {unit}
          </span>
        </div>
        <p className="text-xs text-ink/60 mb-4 line-clamp-2">
          {product.deskripsi || "Bahan bakar energi terbarukan."}
        </p>
      </div>

      <div className="border-t border-forest/10 pt-4 space-y-4">
        <div>
          <p className="text-[10px] text-ink/45 uppercase tracking-wider">Harga Wilayah</p>
          <p className="font-semibold text-green text-base">
            Rp {price.toLocaleString("id-ID")} <span className="text-xs font-normal text-ink/50">/{unit}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <div className="flex items-center border border-forest/20 rounded-xl bg-white overflow-hidden shrink-0">
            <button type="button" onClick={handleDecrease} disabled={quantity <= 1 || status !== "idle"} className="px-2.5 py-1.5 text-forest hover:bg-forest/5 disabled:opacity-30 text-xs font-bold transition-colors cursor-pointer">-</button>
            <span className="px-2 py-1.5 text-xs font-semibold text-forest min-w-[1.75rem] text-center">{quantity}</span>
            <button type="button" onClick={handleIncrease} disabled={quantity >= currentStock || status !== "idle"} className="px-2.5 py-1.5 text-forest hover:bg-forest/5 disabled:opacity-30 text-xs font-bold transition-colors cursor-pointer">+</button>
          </div>

          <button
            type="button"
            onClick={handleOrder}
            disabled={currentStock <= 0 || status !== "idle"}
            className="flex-1 bg-forest text-cream py-2 px-3 rounded-xl text-xs font-medium hover:bg-forest/90 disabled:bg-gray-200 disabled:text-gray-400 transition-colors shadow-xs cursor-pointer"
          >
            {status === "loading" ? "Memproses..." : status === "sent" ? "Terkirim ✓" : currentStock > 0 ? "Pesan" : "Stok Habis"}
          </button>
        </div>
      </div>
    </div>
  );
}