"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

interface Shipment {
  id: string; user_id: string; nama_limbah: string; perkiraan_berat: number; lokasi_penjemputan: string; status: string;
  industri_profiles: { nama_perusahaan: string; telepon: string };
}

interface Product {
  id: string; nama_produk: string; deskripsi: string; satuan: string; harga_default: number; stok_dummy: number;
}

interface RegionalProductPrice {
  id: string; product_id: string; provinsi: string; kota: string; harga: number; stok: number;
  products?: { nama_produk: string; satuan: string };
}

export default function DashboardAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [regionalPrices, setRegionalPrices] = useState<RegionalProductPrice[]>([]);
  
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [newStatus, setNewStatus] = useState("");

  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [formPrice, setFormPrice] = useState({ product_id: "", provinsi: "", kota: "", harga: "", stok: "" });
  
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [formProduct, setFormProduct] = useState({ nama_produk: "", deskripsi: "", satuan: "karung", harga_default: "", stok: "50" });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [provinces, setProvinces] = useState<{id: string, name: string}[]>([]);
  const [cities, setCities] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json").then(res => res.json()).then(data => setProvinces(data));
  }, []);

  useEffect(() => {
    const fetchAdminData = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return router.replace("/masuk");

      const { data: shipData } = await supabase.from("waste_shipments").select(`*, industri_profiles(nama_perusahaan, telepon)`).order("created_at", { ascending: false });
      if (shipData) setShipments(shipData as any);

      const { data: productData } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (productData) setProducts(productData);

      const { data: priceData } = await supabase.from("regional_product_prices").select(`*, products(nama_produk, satuan)`).order("kota", { ascending: true });
      if (priceData) setRegionalPrices(priceData as any);
      
      setLoading(false);
    };
    fetchAdminData();
  }, [router]);

  const handleProvinsiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provId = e.target.value;
    const provName = e.target.options[e.target.selectedIndex].text;
    setFormPrice(prev => ({ ...prev, provinsi: provName, kota: "" }));
    if (provId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provId}.json`).then(res => res.json()).then(data => setCities(data));
    } else { setCities([]); }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;
    setIsSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.from("waste_shipments").update({ status: newStatus }).eq("id", selectedShipment.id);
    setShipments(shipments.map(s => s.id === selectedShipment.id ? { ...s, status: newStatus } : s));
    setStatusModalOpen(false);
    setIsSubmitting(false);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.from("products").insert({
      nama_produk: formProduct.nama_produk, deskripsi: formProduct.deskripsi, satuan: formProduct.satuan,
      harga_default: Number(formProduct.harga_default), stok_dummy: Number(formProduct.stok),
    }).select().single();
    if (data) setProducts([data, ...products]);
    setProductModalOpen(false);
    setFormProduct({ nama_produk: "", deskripsi: "", satuan: "karung", harga_default: "", stok: "50" });
    setIsSubmitting(false);
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    
    const { error } = await supabase.from("regional_product_prices").upsert({
      product_id: formPrice.product_id,
      provinsi: formPrice.provinsi.toUpperCase(),
      kota: formPrice.kota.toUpperCase(),
      harga: Number(formPrice.harga),
      stok: Number(formPrice.stok),
    }, { onConflict: 'product_id,kota' });

    if (!error) {
      alert("Harga dan stok wilayah berhasil disimpan!");
      window.location.reload(); 
    } else {
      alert("Gagal menyimpan data wilayah.");
    }
    setIsSubmitting(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Yakin ingin menghapus produk ini?")) return;
    const supabase = createSupabaseBrowserClient();
    await supabase.from("products").delete().eq("id", id);
    setProducts(products.filter(p => p.id !== id));
    setRegionalPrices(regionalPrices.filter(rp => rp.product_id !== id));
  };

  const handleDeleteRegionalPrice = async (id: string) => {
    if (!confirm("Yakin ingin menghapus harga wilayah ini?")) return;
    const supabase = createSupabaseBrowserClient();
    await supabase.from("regional_product_prices").delete().eq("id", id);
    setRegionalPrices(regionalPrices.filter(rp => rp.id !== id));
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><p className="text-ink/40 text-sm">Memuat...</p></div>;

  return (
    <div className="px-6 md:px-12 py-10 md:py-12 max-w-6xl relative">
      <div className="mb-10">
        <p className="font-mono text-xs tracking-widest uppercase text-green mb-3">Administrator</p>
        <h1 className="font-display font-semibold text-2xl md:text-3xl text-forest mb-2">Pusat Kendali LENTERA</h1>
      </div>

      {/* MANAJEMEN PRODUK */}
      <section className="mb-12">
        <div className="flex justify-between items-end mb-4">
          <h2 className="font-display font-semibold text-xl text-forest">Katalog Produk Utama</h2>
          <button onClick={() => setProductModalOpen(true)} className="bg-forest text-paper px-4 py-2 rounded-lg text-sm font-medium hover:bg-forest/90 shadow-sm">
            + Tambah Produk
          </button>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p.id} className="bg-paper border border-forest/10 p-5 rounded-2xl flex flex-col relative group">
              <button 
                onClick={() => handleDeleteProduct(p.id)}
                className="absolute top-4 right-4 text-ink/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
              >
                Hapus
              </button>
              <h4 className="font-display font-semibold text-forest text-lg pr-10">{p.nama_produk}</h4>
              <p className="text-xs text-ink/60 mb-3">{p.deskripsi}</p>
              <div className="mt-auto border-t border-forest/10 pt-3">
                <p className="text-[10px] text-ink/50 uppercase tracking-widest">Harga Nasional (Default)</p>
                <p className="font-semibold text-green">Rp {p.harga_default.toLocaleString("id-ID")} <span className="text-xs font-normal text-ink/50">/{p.satuan}</span></p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HARGA & STOK SPESIFIK DAERAH */}
      <section className="mb-12">
        <div className="flex justify-between items-end mb-4">
          <h2 className="font-display font-semibold text-xl text-forest">Harga & Stok Produk per Wilayah</h2>
          <button onClick={() => setPriceModalOpen(true)} className="bg-forest text-paper px-4 py-2 rounded-lg text-sm font-medium hover:bg-forest/90 shadow-sm">
            + Set Harga & Stok Wilayah
          </button>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {regionalPrices.length === 0 && <div className="col-span-3 p-6 bg-paper border border-forest/10 rounded-2xl text-center text-ink/50 text-sm">Belum ada pengaturan wilayah.</div>}
          {regionalPrices.map((rp) => (
            <div key={rp.id} className="bg-paper rounded-2xl border border-forest/10 p-5 relative group">
              <button 
                onClick={() => handleDeleteRegionalPrice(rp.id)}
                className="absolute top-4 right-4 text-ink/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
              >
                Hapus
              </button>
              <p className="text-[10px] uppercase text-ink/50 mb-1 pr-10">{rp.kota}, {rp.provinsi}</p>
              <h4 className="font-semibold text-forest text-lg mb-1">{rp.products?.nama_produk}</h4>
              <div className="text-sm text-ink/70 space-y-1 mt-2 border-t border-forest/10 pt-2">
                <p>Harga: <span className="font-bold text-green">Rp {rp.harga.toLocaleString("id-ID")}</span></p>
                <p>Stok Gudang: <span className="font-bold text-forest">{rp.stok} {rp.products?.satuan}</span></p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PENGIRIMAN LIMBAH */}
      <section className="mb-12">
        <div className="flex justify-between items-end mb-4">
          <h2 className="font-display font-semibold text-xl text-forest">Semua Pengiriman Limbah</h2>
        </div>
        <div className="bg-paper rounded-2xl border border-forest/10 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-forest/5 text-forest font-medium border-b border-forest/10">
              <tr><th className="p-4">Industri</th><th className="p-4">Limbah & Berat</th><th className="p-4">Lokasi</th><th className="p-4">Status</th><th className="p-4 text-center">Aksi</th></tr>
            </thead>
            <tbody className="divide-y divide-forest/10">
              {shipments.map((ship) => (
                <tr key={ship.id}>
                  <td className="p-4">{ship.industri_profiles?.nama_perusahaan}</td>
                  <td className="p-4">{ship.nama_limbah} ({ship.perkiraan_berat}kg)</td>
                  <td className="p-4 text-xs">{ship.lokasi_penjemputan}</td>
                  <td className="p-4 font-bold text-xs">{ship.status}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => { setSelectedShipment(ship); setNewStatus(ship.status); setStatusModalOpen(true); }} className="text-green hover:underline text-xs">Ubah Status</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL SET HARGA & STOK */}
      {priceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
          <div className="bg-paper rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-display font-semibold text-forest mb-4">Set Harga & Stok Wilayah</h3>
            <form onSubmit={handleSavePrice} className="space-y-4">
              <div>
                <label className="block text-sm text-ink mb-1">Pilih Produk</label>
                <select className="w-full border p-2.5 rounded-md outline-none" required value={formPrice.product_id} onChange={e => setFormPrice({...formPrice, product_id: e.target.value})}>
                  <option value="">-- Pilih Produk --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.nama_produk}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select className="w-full border p-2.5 rounded-md text-sm uppercase outline-none" onChange={handleProvinsiChange} required><option value="">PROVINSI</option>{provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                <select className="w-full border p-2.5 rounded-md text-sm uppercase disabled:bg-gray-100 outline-none" onChange={e => setFormPrice({...formPrice, kota: e.target.options[e.target.selectedIndex].text})} disabled={cities.length===0} required><option value="">KOTA/KAB</option>{cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-ink mb-1">Harga (Rp)</label>
                  <input type="number" placeholder="18000" required className="w-full border p-2.5 rounded-md outline-none" value={formPrice.harga} onChange={e => setFormPrice({...formPrice, harga: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm text-ink mb-1">Stok Gudang</label>
                  <input type="number" placeholder="50" required className="w-full border p-2.5 rounded-md outline-none" value={formPrice.stok} onChange={e => setFormPrice({...formPrice, stok: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setPriceModalOpen(false)} className="text-ink/60">Batal</button>
                <button type="submit" disabled={isSubmitting} className="bg-forest text-paper px-4 py-2 rounded-lg">{isSubmitting ? "Menyimpan..." : "Simpan Data"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH PRODUK & STATUS LAINNYA */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
          <div className="bg-paper rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h3 className="font-display font-semibold text-forest mb-4">Tambah Produk</h3>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <input type="text" placeholder="Nama Produk" required value={formProduct.nama_produk} onChange={e => setFormProduct({...formProduct, nama_produk: e.target.value})} className="w-full border p-2 rounded-md" />
              <input type="text" placeholder="Deskripsi Singkat" required value={formProduct.deskripsi} onChange={e => setFormProduct({...formProduct, deskripsi: e.target.value})} className="w-full border p-2 rounded-md" />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Satuan (karung/liter)" required value={formProduct.satuan} onChange={e => setFormProduct({...formProduct, satuan: e.target.value})} className="w-full border p-2 rounded-md" />
                <input type="number" placeholder="Stok Default" required value={formProduct.stok} onChange={e => setFormProduct({...formProduct, stok: e.target.value})} className="w-full border p-2 rounded-md" />
              </div>
              <input type="number" placeholder="Harga Default Nasional (Rp)" required value={formProduct.harga_default} onChange={e => setFormProduct({...formProduct, harga_default: e.target.value})} className="w-full border p-2 rounded-md" />
              <div className="flex justify-end gap-3"><button type="button" onClick={() => setProductModalOpen(false)} className="text-ink/60">Batal</button><button type="submit" className="bg-forest text-paper px-4 py-2 rounded-lg">Simpan</button></div>
            </form>
          </div>
        </div>
      )}

      {statusModalOpen && selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
          <div className="bg-paper rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-display font-semibold text-forest mb-4">Ubah Status</h3>
            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="w-full border p-2 rounded-md">
                <option value="Menunggu Penjemputan">Menunggu Penjemputan</option><option value="Diperjalanan">Diperjalanan</option><option value="Selesai">Selesai</option><option value="Dibatalkan">Dibatalkan</option>
              </select>
              <div className="flex justify-end gap-3"><button type="button" onClick={() => setSelectedShipment(null)} className="text-ink/60">Batal</button><button type="submit" className="bg-green text-white px-4 py-2 rounded-lg">Simpan</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}