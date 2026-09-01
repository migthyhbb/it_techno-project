"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { ProductCard } from "@/components/dashboard/product-card";
import { AIAssistant } from "@/components/ai-assistant";
import Script from "next/script";

interface MitraProfile {
  nama_mitra: string;
  nik_nib: string;
  alamat: string;
  telepon: string;
  provinsi?: string;
  kota_kabupaten?: string;
  status_akun?: string;
  alasan_ban?: string;
  created_at: string;
}

interface DisplayProduct {
  id: string;
  nama: string;
  nama_produk: string;
  deskripsi: string;
  price: number;
  unit: string;
  stock: number;
  stok: number;
  isRegional: boolean;
}

interface RegionalPrice {
  product_id: string;
  kota?: string;
  harga?: number;
  harga_min?: number;
  stok?: number;
}

interface RawProduct {
  id: string;
  nama_produk: string;
  deskripsi: string;
  satuan: string;
  harga_default: number;
  regional_product_prices?: RegionalPrice[];
}

interface Order {
  id: string;
  status: string;
  total_harga: number;
  created_at: string;
}

function InfoRow({
  label,
  value,
  className = "",
}: {
  label: string;
  value?: string | null;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-ink/45 mb-1">{label}</p>
      <p className="text-forest font-medium text-sm sm:text-base">
        {value || "-"}
      </p>
    </div>
  );
}

export default function DashboardMitraPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<MitraProfile | null>(null);
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    nama_mitra: "",
    nik_nib: "",
    telepon: "",
    provinsi: "",
    kota_kabupaten: "",
    alamat: "",
  });

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fungsi pengambil data pesanan bersih
  const fetchOrdersOnly = async (currentUserId: string) => {
    const supabase = createSupabaseBrowserClient();
    const [ordersRes, pmRes] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("pesanan_mitra").select("*").order("created_at", { ascending: false })
    ]);

    const combinedOrders: Order[] = [];

    if (ordersRes.data) {
      ordersRes.data.forEach((o) => {
        const oUser = o.user_id || o.mitra_id;
        if (!oUser || oUser === currentUserId) {
          combinedOrders.push({
            id: String(o.id),
            status: String(o.status || "diproses").toLowerCase(),
            total_harga: Number(o.total_harga || o.total || 0),
            created_at: o.created_at || new Date().toISOString(),
          });
        }
      });
    }

    if (pmRes.data) {
      pmRes.data.forEach((pm) => {
        const pmUser = pm.user_id || pm.mitra_id;
        if (!pmUser || pmUser === currentUserId) {
          if (!combinedOrders.some((o) => o.id === String(pm.id))) {
            combinedOrders.push({
              id: String(pm.id),
              status: String(pm.status || "diproses").toLowerCase(),
              total_harga: Number(pm.total_harga || pm.jumlah * 15000 || 0),
              created_at: pm.created_at || new Date().toISOString(),
            });
          }
        }
      });
    }

    combinedOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setOrders(combinedOrders);
  };

  // Efek 1: Inisialisasi awal profil & produk
  useEffect(() => {
    const fetchDashboardData = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        router.replace("/masuk");
        return;
      }
      setUserId(authData.user.id);
      setEmail(authData.user.email ?? null);

      const { data: blacklisted } = await supabase
        .from("blacklists")
        .select("alasan")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (blacklisted) {
        alert(`Akses Ditolak: Akun Anda diblokir!\nAlasan: ${blacklisted.alasan}`);
        await supabase.auth.signOut();
        router.replace("/masuk");
        return;
      }

      const { data: profileData } = await supabase
        .from("mitra_profiles")
        .select(
          "nama_mitra, nik_nib, alamat, telepon, provinsi, kota_kabupaten, status_akun, alasan_ban, created_at"
        )
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (!profileData) {
        alert("Akses Ditolak: Profil mitra Anda tidak ditemukan atau pendaftaran sebelumnya ditolak.");
        await supabase.auth.signOut();
        router.replace("/masuk");
        return;
      }

      if (profileData.status_akun === "banned") {
        alert(
          `Akun Anda telah di-ban oleh Administrator!\nAlasan: ${
            profileData.alasan_ban || "Pelanggaran ketentuan layanan."
          }`
        );
        await supabase.auth.signOut();
        router.replace("/masuk");
        return;
      }

      setProfile(profileData);
      setEditForm({
        nama_mitra: profileData.nama_mitra || "",
        nik_nib: profileData.nik_nib || "",
        telepon: profileData.telepon || "",
        provinsi: profileData.provinsi || "",
        kota_kabupaten: profileData.kota_kabupaten || "",
        alamat: profileData.alamat || "",
      });

      // Ambil Data Produk
      const { data: rawProducts } = await supabase
        .from("products")
        .select(`id, nama_produk, deskripsi, satuan, harga_default, stok_dummy, regional_product_prices(*)`)
        .order("created_at", { ascending: false });

      const { data: allRegionalPrices } = await supabase
        .from("regional_product_prices")
        .select("*");

      if (rawProducts) {
        const cleanCityName = (str: string) => {
          if (!str) return "";
          return str.toUpperCase().replace(/KOTA/g, "").replace(/KABUPATEN/g, "").replace(/KAB\./g, "").replace(/KAB/g, "").replace(/[^A-Z0-9]/g, "").trim();
        };

        const rawLocationText = profileData?.kota_kabupaten || profileData?.alamat || "";
        const userKotaClean = cleanCityName(rawLocationText);

        const filteredProducts: DisplayProduct[] = [];

        rawProducts.forEach((p: RawProduct) => {
          const regionalPricesList = [...(p.regional_product_prices || []), ...(allRegionalPrices?.filter((rp) => rp.product_id === p.id) || [])];
          const regionalMatch = regionalPricesList.find((rp: RegionalPrice) => {
            const rpKotaClean = cleanCityName(rp.kota || "");
            if (!rpKotaClean || !userKotaClean) return false;
            return rpKotaClean === userKotaClean || userKotaClean.includes(rpKotaClean) || rpKotaClean.includes(userKotaClean);
          });

          if (regionalMatch) {
            filteredProducts.push({
              id: p.id,
              nama: p.nama_produk,
              nama_produk: p.nama_produk,
              deskripsi: p.deskripsi,
              unit: p.satuan,
              price: Number(regionalMatch.harga ?? regionalMatch.harga_min ?? p.harga_default),
              stock: Number(regionalMatch.stok ?? 0),
              stok: Number(regionalMatch.stok ?? 0),
              isRegional: true,
            });
          }
        });

        setProducts(filteredProducts);
      }
      setLoading(false);
    };

    fetchDashboardData();
  }, [router]);

  // Efek 2: Menggunakan Supabase Realtime (WebSockets) instan tanpa polling
  useEffect(() => {
    if (!userId) return;

    fetchOrdersOnly(userId);

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel('realtime-orders-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchOrdersOnly(userId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pesanan_mitra' },
        () => fetchOrdersOnly(userId)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleConfirmOrder = async (orderId: string) => {
    setConfirmingOrderId(orderId);
    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase.from("orders").update({ status: "selesai" }).eq("id", orderId);
    await supabase.from("pesanan_mitra").update({ status: "SELESAI" }).eq("id", orderId);

    setConfirmingOrderId(null);

    if (error) {
      alert("Gagal mengonfirmasi pesanan: " + error.message);
    } else {
      alert("Terima kasih! Pesanan telah dikonfirmasi diterima.");
      fetchOrdersOnly(userId!);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setEditLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("mitra_profiles")
      .update({
        nama_mitra: editForm.nama_mitra,
        nik_nib: editForm.nik_nib,
        telepon: editForm.telepon,
        provinsi: editForm.provinsi,
        kota_kabupaten: editForm.kota_kabupaten,
        alamat: editForm.alamat,
      })
      .eq("user_id", userId);

    setEditLoading(false);

    if (!error) {
      setProfile((prev) => prev ? { ...prev, ...editForm } : null);
      setIsEditOpen(false);
    } else {
      alert("Gagal memperbarui profil: " + error.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (!userId) return;
    setDeleteLoading(true);

    try {
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert("Gagal menghapus akun: " + data.error);
        setDeleteLoading(false);
        return;
      }

      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      alert("Akun berhasil dihapus permanen.");
      router.push("/masuk");
    } catch {
      alert("Terjadi kesalahan jaringan saat menghapus akun.");
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-forest border-t-transparent rounded-full animate-spin"></div>
          <p className="text-forest font-medium text-sm">Memuat portal mitra...</p>
        </div>
      </div>
    );
  }

  const joinedLabel = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "-";

  return (
    <>
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="afterInteractive"
      />

      <div className="px-4 sm:px-6 md:px-12 py-6 md:py-12 max-w-5xl w-full mx-auto relative">
        
        {/* Ringkasan */}
        <section id="ringkasan" className="scroll-mt-8 mb-10 md:mb-16">
          <p className="font-mono text-xs tracking-widest uppercase text-green mb-2 sm:mb-3">Ringkasan</p>
          <h1 className="font-display font-semibold text-xl sm:text-2xl md:text-3xl text-forest mb-2">
            Selamat datang, {profile?.nama_mitra ?? "Mitra"}
          </h1>
          <p className="text-ink/60 text-sm sm:text-base mb-6 md:mb-8">Pantau stok dan kelola profil kemitraan kamu di sini.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-paper rounded-2xl border border-forest/10 p-4 sm:p-5 shadow-xs">
              <p className="text-xs text-ink/45 mb-1">Status akun</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green animate-pulse"></span>
                <p className="font-display font-semibold text-forest text-base sm:text-lg">Aktif</p>
              </div>
            </div>
            <div className="bg-paper rounded-2xl border border-forest/10 p-4 sm:p-5 shadow-xs">
              <p className="text-xs text-ink/45 mb-1">Bergabung sejak</p>
              <p className="font-display font-semibold text-forest text-base sm:text-lg">{joinedLabel}</p>
            </div>
          </div>
        </section>

        {/* Pesan Stok */}
        <section id="pesan-stok" className="scroll-mt-8 mb-10 md:mb-16">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 sm:mb-3 gap-2">
            <div>
              <p className="font-mono text-xs tracking-widest uppercase text-gold mb-1">Pesan stok</p>
              <h2 className="font-display font-semibold text-xl sm:text-2xl text-forest">Pesan bahan energi</h2>
            </div>
            {(profile?.kota_kabupaten || profile?.alamat) && (
              <span className="text-xs bg-forest/10 text-forest font-medium px-3 py-1 rounded-full border border-forest/20">
                Wilayah: {profile.kota_kabupaten ? profile.kota_kabupaten.toUpperCase() : "BELUM DISET"}
              </span>
            )}
          </div>
          <p className="text-ink/60 text-sm sm:text-base mb-6 md:mb-8 max-w-lg">
            Pantau stok yang ada di titikmu dan ajukan permintaan stok langsung ke LENTERA.
          </p>

          {products.length === 0 ? (
            <div className="bg-paper rounded-2xl border border-forest/10 p-8 text-center">
              <p className="text-ink/60 text-sm">Tidak ada produk yang dialokasikan untuk wilayah ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>

        {/* Status Pengiriman */}
        <section id="pesanan-saya" className="scroll-mt-8 mb-10 md:mb-16">
          <p className="font-mono text-xs tracking-widest uppercase text-forest mb-1">Daftar Pesanan</p>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display font-semibold text-xl sm:text-2xl text-forest">
              Status Pengiriman & Penerimaan
            </h2>
            <div className="flex items-center gap-2 text-[10px] text-green font-medium">
              <span className="w-2 h-2 rounded-full bg-green animate-pulse"></span>
              Realtime Sync Aktif
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="bg-paper rounded-2xl border border-forest/10 p-6 text-center">
              <p className="text-ink/60 text-sm">Belum ada pesanan aktif saat ini.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-paper rounded-2xl border border-forest/10 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-ink/50">ID: {order.id.slice(0, 16)}...</span>
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                          order.status === "dikirim"
                            ? "bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
                            : order.status === "selesai"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-blue-100 text-blue-800 border border-blue-300"
                        }`}
                      >
                        {order.status === "dikirim"
                          ? "Barang Dalam Pengiriman"
                          : order.status === "selesai"
                          ? "Pesanan Selesai"
                          : order.status === "pending" || order.status === "menunggu_pembayaran"
                          ? "Menunggu Pembayaran / Diproses"
                          : "Sedang Diproses"}
                      </span>
                    </div>
                    <p className="font-display font-semibold text-forest text-base">
                      Total: Rp {order.total_harga?.toLocaleString("id-ID")}
                    </p>
                    <p className="text-xs text-ink/55 mt-0.5">
                      Tanggal: {new Date(order.created_at).toLocaleDateString("id-ID")}
                    </p>
                  </div>

                  {order.status === "dikirim" && (
                    <button
                      onClick={() => handleConfirmOrder(order.id)}
                      disabled={confirmingOrderId === order.id}
                      className="text-xs font-semibold px-4 py-2.5 bg-green text-white rounded-xl hover:bg-forest transition-colors shadow-xs shrink-0 disabled:opacity-50 cursor-pointer"
                    >
                      {confirmingOrderId === order.id ? "Memproses..." : "Konfirmasi Barang Diterima"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Profil Mitra */}
        <section id="profil-mitra" className="scroll-mt-8 mb-10">
          <div className="flex justify-between items-end mb-4 sm:mb-6">
            <div>
              <p className="font-mono text-xs tracking-widest uppercase text-clay mb-1 sm:mb-2">Profil mitra</p>
              <h2 className="font-display font-semibold text-xl sm:text-2xl text-forest">Informasi mitra</h2>
            </div>
            <button onClick={() => setIsEditOpen(true)} className="text-xs font-semibold px-4 py-2 bg-forest text-cream rounded-xl hover:bg-forest/90 transition-colors cursor-pointer">
              Ubah Profil
            </button>
          </div>

          <div className="bg-paper rounded-2xl border border-forest/10 p-5 sm:p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 shadow-xs">
            <InfoRow label="Nama mitra" value={profile?.nama_mitra} />
            <InfoRow label="Email" value={email} />
            <InfoRow label="NIK / NIB" value={profile?.nik_nib} />
            <InfoRow label="Nomor telepon" value={profile?.telepon} />
            <InfoRow label="Wilayah Operasional" value={profile?.kota_kabupaten ? `${profile.kota_kabupaten}, ${profile.provinsi}` : "BELUM DISET"} />
            <InfoRow label="Alamat lengkap" value={profile?.alamat} className="sm:col-span-2" />
          </div>
        </section>

        {/* Hapus Akun */}
        <section className="bg-red-50/50 border border-red-200/60 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-display font-semibold text-red-900 text-base sm:text-lg">Hapus Akun Kemitraan</h3>
            <p className="text-xs sm:text-sm text-red-700/80 mt-0.5">Tindakan ini permanen. Seluruh data profil dan alokasi wilayah kamu akan dihapus.</p>
          </div>
          <button onClick={() => setIsDeleteOpen(true)} className="text-xs font-semibold px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shrink-0 cursor-pointer">
            Hapus Akun
          </button>
        </section>

        {/* MODAL UBAH PROFIL */}
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest/40 backdrop-blur-xs p-4">
            <div className="bg-paper border border-forest/10 rounded-2xl max-w-lg w-full p-6 shadow-lg max-h-[90vh] overflow-y-auto">
              <h3 className="font-display font-semibold text-xl text-forest mb-4">Ubah Data Profil</h3>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-xs text-ink/60 mb-1">Nama Mitra</label>
                  <input type="text" required value={editForm.nama_mitra} onChange={(e) => setEditForm({ ...editForm, nama_mitra: e.target.value })} className="w-full text-sm bg-cream/50 border border-forest/20 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-forest" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-ink/60 mb-1">NIK / NIB</label>
                    <input type="text" required value={editForm.nik_nib} onChange={(e) => setEditForm({ ...editForm, nik_nib: e.target.value })} className="w-full text-sm bg-cream/50 border border-forest/20 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-forest" />
                  </div>
                  <div>
                    <label className="block text-xs text-ink/60 mb-1">Nomor Telepon</label>
                    <input type="text" required value={editForm.telepon} onChange={(e) => setEditForm({ ...editForm, telepon: e.target.value })} className="w-full text-sm bg-cream/50 border border-forest/20 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-forest" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-ink/60 mb-1">Provinsi</label>
                    <input type="text" value={editForm.provinsi} onChange={(e) => setEditForm({ ...editForm, provinsi: e.target.value })} className="w-full text-sm bg-cream/50 border border-forest/20 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-forest" />
                  </div>
                  <div>
                    <label className="block text-xs text-ink/60 mb-1">Kota / Kabupaten</label>
                    <input type="text" value={editForm.kota_kabupaten} onChange={(e) => setEditForm({ ...editForm, kota_kabupaten: e.target.value })} className="w-full text-sm bg-cream/50 border border-forest/20 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-forest" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-ink/60 mb-1">Alamat Lengkap</label>
                  <textarea rows={3} value={editForm.alamat} onChange={(e) => setEditForm({ ...editForm, alamat: e.target.value })} className="w-full text-sm bg-cream/50 border border-forest/20 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-forest resize-none" />
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-forest/10">
                  <button type="button" onClick={() => setIsEditOpen(false)} className="text-xs font-semibold px-4 py-2.5 text-ink/60 hover:text-ink cursor-pointer">Batal</button>
                  <button type="submit" disabled={editLoading} className="text-xs font-semibold px-4 py-2.5 bg-forest text-cream rounded-xl hover:bg-forest/90 disabled:opacity-50 cursor-pointer">
                    {editLoading ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL KONFIRMASI HAPUS AKUN */}
        {isDeleteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest/40 backdrop-blur-xs p-4">
            <div className="bg-paper border border-red-200 rounded-2xl max-w-md w-full p-6 shadow-lg">
              <h3 className="font-display font-semibold text-xl text-red-900 mb-2">Konfirmasi Hapus Akun</h3>
              <p className="text-sm text-ink/70 mb-6">Apakah kamu yakin ingin menghapus akun kemitraan ini? Semua data profil akan dihapus dan kamu akan dikembalikan ke halaman awal.</p>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsDeleteOpen(false)} className="text-xs font-semibold px-4 py-2.5 text-ink/60 hover:text-ink cursor-pointer">Batal</button>
                <button type="button" onClick={handleDeleteAccount} disabled={deleteLoading} className="text-xs font-semibold px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 cursor-pointer">
                  {deleteLoading ? "Menghapus..." : "Ya, Hapus Akun"}
                </button>
              </div>
            </div>
          </div>
        )}

        <AIAssistant />
      </div>
    </>
  );
}