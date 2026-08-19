"use client";

import { useState } from "react";
import type { MitraProduct } from "@/lib/mitra-products";

function stockLevel(stock: number) {
  if (stock >= 60) return { label: "Stok aman", cls: "bg-green/10 text-green" };
  if (stock >= 25) return { label: "Stok menipis", cls: "bg-gold/15 text-gold" };
  return { label: "Segera pesan", cls: "bg-clay/10 text-clay" };
}

export function ProductCard({ product }: { product: MitraProduct }) {
  const [qty, setQty] = useState(1);
  const [status, setStatus] = useState<"idle" | "sent">("idle");
  const level = stockLevel(product.stock);

  function handleOrder() {
    setStatus("sent");
    // TODO: kirim permintaan stok ulang ke API sungguhan (mis. POST /api/pesanan)
    setTimeout(() => setStatus("idle"), 2500);
  }

  return (
    <div className="bg-paper rounded-2xl border border-forest/10 p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <p className="font-display font-semibold text-forest leading-snug">
            {product.name}
          </p>
          <p className="text-xs text-ink/50 mt-0.5">{product.category}</p>
        </div>
        <span
          className={`shrink-0 text-[11px] font-mono px-2.5 py-1 rounded-full whitespace-nowrap ${level.cls}`}
        >
          {product.stock} {product.unit}
        </span>
      </div>

      <p className="font-mono text-lg font-semibold text-forest mb-1">
        Rp {product.price.toLocaleString("id-ID")}
        <span className="text-xs text-ink/45 font-body font-normal">
          {" "}
          / {product.unit}
        </span>
      </p>
      <p className="text-[11px] text-ink/40 mb-5">{level.label}</p>

      <div className="flex items-center gap-3">
        <div className="flex items-center border border-forest/15 rounded-full shrink-0">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Kurangi jumlah"
            className="w-8 h-8 flex items-center justify-center text-forest hover:bg-forest/5 rounded-full transition-colors"
          >
            −
          </button>
          <span className="w-7 text-center text-sm font-mono text-forest">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            aria-label="Tambah jumlah"
            className="w-8 h-8 flex items-center justify-center text-forest hover:bg-forest/5 rounded-full transition-colors"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={handleOrder}
          disabled={status === "sent"}
          className="flex-1 bg-forest text-cream rounded-full py-2.5 text-sm font-medium transition-colors hover:bg-forest-2 disabled:opacity-70"
        >
          {status === "sent" ? "Permintaan terkirim ✓" : "Pesan Ulang"}
        </button>
      </div>
    </div>
  );
}
