"use client";

import { useState } from "react";

interface Product {
  id: string;
  nama_produk?: string;
  nama?: string;
  deskripsi: string;
  price: number;
  unit: string;
  stock: number;
}

export function ProductCard({ product }: { product: Product }) {
  const [jumlah, setJumlah] = useState(1);
  const [loading, setLoading] = useState(false);

  const namaProduk = product.nama_produk || product.nama || "Produk Energi";
  const totalHarga = product.price * jumlah;

  const handleOrder = async () => {
    // 1. Validasi Batas Minimal Midtrans (Rp 10.000)
    if (totalHarga < 10000) {
      alert(
        `Gagal memproses pesanan!\n\n` +
        `Sistem pembayaran mensyaratkan total transaksi minimal Rp 10.000.\n` +
        `Total saat ini: Rp ${totalHarga.toLocaleString("id-ID")}.\n` +
        `Silakan tambah jumlah pesanan kamu.`
      );
      return;
    }

    // 2. Validasi Batas Maksimal Midtrans (Rp 99.999.999.999)
    if (totalHarga > 99999999999) {
      alert(
        `Gagal memproses pesanan!\n\n` +
        `Total pemesanan melebihi batas maksimal pembayaran.\n` +
        `Silakan kurangi jumlah pesanan kamu.`
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/transaksi/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produk_id: product.id,
          jumlah: jumlah,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Gagal membuat pesanan.");
        setLoading(false);
        return;
      }

      // 3. Eksekusi Popup Midtrans Snap jika mendapatkan token
      if (data.token && typeof window !== "undefined" && (window as any).snap) {
        (window as any).snap.pay(data.token, {
          onSuccess: function () {
            alert("Pembayaran berhasil!");
            window.location.reload();
          },
          onPending: function () {
            alert("Menunggu pembayaran Anda.");
            window.location.reload();
          },
          onError: function () {
            alert("Pembayaran gagal!");
          },
          onClose: function () {
            alert("Anda menutup jendela pembayaran sebelum selesai.");
          },
        });
      } else {
        alert(data.message || "Pesanan berhasil dibuat!");
        window.location.reload();
      }
    } catch (err) {
      alert("Terjadi kesalahan koneksi saat memproses pesanan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-paper border border-forest/10 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-display font-semibold text-forest text-lg">{namaProduk}</h3>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-forest/5 text-forest rounded-md">
            {product.stock} {product.unit}
          </span>
        </div>
        <p className="text-xs text-ink/60 mb-4 line-clamp-2">{product.deskripsi}</p>
        <div className="mb-4">
          <p className="text-[10px] text-ink/40 uppercase font-mono">Harga Wilayah</p>
          <p className="font-semibold text-forest text-lg">
            Rp {product.price?.toLocaleString("id-ID")}{" "}
            <span className="text-xs font-normal text-ink/50">/{product.unit}</span>
          </p>
        </div>
      </div>

      <div className="space-y-3 border-t border-forest/10 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink/60 font-medium">Jumlah:</span>
          <div className="flex items-center gap-2 bg-forest/5 rounded-xl p-1 border border-forest/10">
            <button
              type="button"
              onClick={() => setJumlah((j) => Math.max(1, j - 1))}
              className="w-7 h-7 flex items-center justify-center font-bold text-forest bg-white rounded-lg shadow-xs hover:bg-forest/10 cursor-pointer"
            >
              -
            </button>
            <span className="w-8 text-center text-xs font-mono font-bold text-forest">{jumlah}</span>
            <button
              type="button"
              onClick={() => setJumlah((j) => Math.min(product.stock || 99, j + 1))}
              className="w-7 h-7 flex items-center justify-center font-bold text-forest bg-white rounded-lg shadow-xs hover:bg-forest/10 cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOrder}
          disabled={loading || product.stock <= 0}
          className="w-full py-2.5 bg-forest text-cream rounded-xl text-xs font-semibold hover:bg-forest/90 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Memproses..." : product.stock <= 0 ? "Stok Habis" : "Pesan Stok"}
        </button>
      </div>
    </div>
  );
}