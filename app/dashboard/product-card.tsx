"use client";

import { useState } from "react";

interface ProductCardProps {
  product: {
    id: string;
    nama?: string;
    nama_produk?: string;
    deskripsi?: string;
    price?: number;
    harga_default?: number;
    unit?: string;
    satuan?: string;
    stock?: number;
    stok?: number;
    stok_dummy?: number;
    isRegional?: boolean;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);

  const title = product.nama || product.nama_produk || "Produk Energi";
  const price = product.price ?? product.harga_default ?? 0;
  const unit = product.unit || product.satuan || "unit";
  
  // Ambil stok dari regional_product_prices (stock / stok)
  const currentStock = product.stock ?? product.stok ?? product.stok_dummy ?? 0;

  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncrease = () => {
    if (quantity < currentStock) setQuantity(quantity + 1);
  };

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
            Rp {price.toLocaleString("id-ID")}{" "}
            <span className="text-xs font-normal text-ink/50">/{unit}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <div className="flex items-center border border-forest/20 rounded-xl bg-white overflow-hidden shrink-0">
            <button
              type="button"
              onClick={handleDecrease}
              disabled={quantity <= 1}
              className="px-2.5 py-1.5 text-forest hover:bg-forest/5 disabled:opacity-30 text-xs font-bold transition-colors cursor-pointer"
            >
              -
            </button>
            <span className="px-2 py-1.5 text-xs font-semibold text-forest min-w-[1.75rem] text-center">
              {quantity}
            </span>
            <button
              type="button"
              onClick={handleIncrease}
              disabled={quantity >= currentStock}
              className="px-2.5 py-1.5 text-forest hover:bg-forest/5 disabled:opacity-30 text-xs font-bold transition-colors cursor-pointer"
            >
              +
            </button>
          </div>

          <button
            type="button"
            disabled={currentStock <= 0}
            className="flex-1 bg-forest text-cream py-2 px-3 rounded-xl text-xs font-medium hover:bg-forest/90 disabled:bg-gray-200 disabled:text-gray-400 transition-colors shadow-xs cursor-pointer"
          >
            {currentStock > 0 ? "Pesan Ulang" : "Stok Habis"}
          </button>
        </div>
      </div>
    </div>
  );
}