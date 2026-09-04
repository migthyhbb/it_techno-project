"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { AdminSidebar } from "@/components/dashboard/admin-sidebar";

interface Shipment {
  id: string;
  user_id: string;
  nama_limbah: string;
  perkiraan_berat: number;
  lokasi_penjemputan: string;
  status: string;
  industri_profiles: { nama_perusahaan: string; telepon: string };
}

interface Product {
  id: string;
  nama_produk: string;
  deskripsi: string;
  satuan: string;
  harga_default: number;
  stok_dummy: number;
}

interface RegionalProductPrice {
  id: string;
  product_id: string;
  provinsi: string;
  kota: string;
  harga: number;
  stok: number;
  products?: { nama_produk: string; satuan: string };
}

interface Order {
  id: string;
  created_at: string;
  total_harga: number;
  status: string;
  bukti_pengiriman_url?: string | null;
}

interface UserAccount {
  id: string;
  user_id: string;
  nama: string;
  email?: string;
  nik_nib: string;
  telepon: string;
  provinsi?: string;
  kota_kabupaten?: string;
  kecamatan?: string;
  kelurahan?: string;
  alamat?: string;
  lat?: number | null;
  lng?: number | null;
  foto_doc_url?: string;
  tipe: "mitra" | "industri";
  status_akun: "aktif" | "banned";
  alasan_ban?: string;
  kuota_pemesanan?: number;
  total_pemesanan?: number;
}

export default function DashboardAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("ringkasan");

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [regionalPrices, setRegionalPrices] = useState<RegionalProductPrice[]>(
    [],
  );
  const [usersList, setUsersList] = useState<UserAccount[]>([]);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] =
    useState<UserAccount | null>(null);

  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [newQuota, setNewQuota] = useState<number>(30);

  const [orderStatusModalOpen, setOrderStatusModalOpen] = useState(false);
  const [selectedOrderUpdate, setSelectedOrderUpdate] = useState<Order | null>(
    null,
  );
  const [newOrderStatus, setNewOrderStatus] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

  const [banModalOpen, setBanModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [banReason, setBanReason] = useState("");

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(
    null,
  );
  const [newStatus, setNewStatus] = useState("");

  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [formPrice, setFormPrice] = useState({
    product_id: "",
    provinsi: "",
    kota: "",
    harga: "",
    stok: "",
  });

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [formProduct, setFormProduct] = useState({
    nama_produk: "",
    deskripsi: "",
    satuan: "karung",
    harga_default: "",
    stok: "50",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [provinces, setProvinces] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json")
      .then((res) => res.json())
      .then((data) => setProvinces(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetch provinsi:", err));
  }, []);

  useEffect(() => {
    const fetchAdminData = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        router.replace("/masuk");
        return;
      }

      const { data: adminProfile } = await supabase
        .from("admin_profiles")
        .select("user_id")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (!adminProfile) {
        router.replace("/dashboard");
        return;
      }

      const { data: shipData } = await supabase
        .from("waste_shipments")
        .select(`*, industri_profiles(nama_perusahaan, telepon)`)
        .order("created_at", { ascending: false });
      if (shipData) setShipments(shipData as unknown as Shipment[]);

      const { data: productData } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (productData) setProducts(productData);

      const { data: priceData } = await supabase
        .from("regional_product_prices")
        .select(`*, products(nama_produk, satuan)`)
        .order("kota", { ascending: true });
      if (priceData)
        setRegionalPrices(priceData as unknown as RegionalProductPrice[]);

      const { data: mitraData } = await supabase
        .from("mitra_profiles")
        .select("*");
      const { data: industriData } = await supabase
        .from("industri_profiles")
        .select("*");
      const { data: ordersCount } = await supabase
        .from("orders")
        .select("user_id");

      const orderCountMap: Record<string, number> = {};
      (ordersCount || []).forEach((o: { user_id: string }) => {
        orderCountMap[o.user_id] = (orderCountMap[o.user_id] || 0) + 1;
      });

      const combinedUsers: UserAccount[] = [
        ...(mitraData || []).map((m: Record<string, unknown>, idx: number) => ({
          id: (m.id as string) || (m.user_id as string) || `mitra-${idx}`,
          user_id: (m.user_id as string) || `uid-mitra-${idx}`,
          nama: (m.nama_mitra as string) || "Tanpa Nama",
          nik_nib: (m.nik_nib as string) || "-",
          telepon: (m.telepon as string) || "-",
          provinsi: (m.provinsi as string) || "-",
          kota_kabupaten: (m.kota_kabupaten as string) || "-",
          kecamatan: (m.kecamatan as string) || "-",
          kelurahan: (m.kelurahan as string) || "-",
          alamat: (m.alamat as string) || "-",
          lat: m.lat as number | null,
          lng: m.lng as number | null,
          foto_doc_url: m.foto_nik_url as string,
          tipe: "mitra" as const,
          status_akun: (m.status_akun as "aktif" | "banned") || "aktif",
          alasan_ban: m.alasan_ban as string,
          kuota_pemesanan: (m.kuota_pemesanan as number) ?? 30,
          total_pemesanan: orderCountMap[m.user_id as string] || 0,
        })),
        ...(industriData || []).map(
          (i: Record<string, unknown>, idx: number) => ({
            id: (i.id as string) || (i.user_id as string) || `industri-${idx}`,
            user_id: (i.user_id as string) || `uid-industri-${idx}`,
            nama: (i.nama_perusahaan as string) || "Tanpa Nama",
            nik_nib: (i.nik_nib as string) || (i.npwp as string) || "-",
            telepon: (i.telepon as string) || "-",
            provinsi: (i.provinsi as string) || "-",
            kota_kabupaten: (i.kota_kabupaten as string) || "-",
            kecamatan: (i.kecamatan as string) || "-",
            kelurahan: (i.kelurahan as string) || "-",
            alamat: (i.alamat as string) || "-",
            lat: i.lat as number | null,
            lng: i.lng as number | null,
            foto_doc_url: i.foto_npwp_url as string,
            tipe: "industri" as const,
            status_akun: (i.status_akun as "aktif" | "banned") || "aktif",
            alasan_ban: i.alasan_ban as string,
          }),
        ),
      ];

      setUsersList(combinedUsers);
      setLoading(false);
    };

    fetchAdminData();
  }, [router]);

  const handleOpenOrdersModal = async (usr: UserAccount) => {
    setSelectedUserDetail(usr);
    setNewQuota(usr.kuota_pemesanan ?? 30);
    setOrdersModalOpen(true);
    setLoadingOrders(true);

    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", usr.user_id)
      .order("created_at", { ascending: false });

    setUserOrders(data || []);
    setLoadingOrders(false);
  };

  const handleSaveOrderStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderUpdate) return;
    setIsSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    let finalProofUrl = selectedOrderUpdate.bukti_pengiriman_url;

    try {
      if (proofFile) {
        const fileExt = proofFile.name.split(".").pop();
        const fileName = `bukti-${selectedOrderUpdate.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("bukti_pengiriman")
          .upload(fileName, proofFile);

        if (uploadError)
          throw new Error("Gagal upload gambar: " + uploadError.message);

        const { data: publicUrlData } = supabase.storage
          .from("bukti_pengiriman")
          .getPublicUrl(fileName);

        finalProofUrl = publicUrlData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: newOrderStatus,
          ...(finalProofUrl ? { bukti_pengiriman_url: finalProofUrl } : {}),
        })
        .eq("id", selectedOrderUpdate.id);

      if (updateError)
        throw new Error("Gagal update status: " + updateError.message);

      setUserOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrderUpdate.id
            ? {
                ...o,
                status: newOrderStatus,
                bukti_pengiriman_url: finalProofUrl,
              }
            : o,
        ),
      );

      alert("Status & Bukti berhasil diperbarui!");
      setOrderStatusModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserDetail) return;
    setIsSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("mitra_profiles")
      .update({ kuota_pemesanan: Number(newQuota) })
      .eq("user_id", selectedUserDetail.user_id);

    if (!error) {
      setUsersList((prev) =>
        prev.map((u) =>
          u.user_id === selectedUserDetail.user_id
            ? { ...u, kuota_pemesanan: Number(newQuota) }
            : u,
        ),
      );
      alert(`Kuota pemesanan berhasil diubah menjadi ${newQuota}!`);
    } else {
      alert("Gagal memperbarui kuota: " + error.message);
    }
    setIsSubmitting(false);
  };

  const handleBanUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !banReason.trim()) return;
    setIsSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    const table =
      selectedUser.tipe === "mitra" ? "mitra_profiles" : "industri_profiles";

    await supabase.from("blacklists").insert({
      nik_nib: selectedUser.nik_nib,
      user_id: selectedUser.user_id,
      alasan: banReason,
      tipe_akun: selectedUser.tipe,
    });

    await supabase
      .from(table)
      .update({ status_akun: "banned", alasan_ban: banReason })
      .eq("user_id", selectedUser.user_id);

    setUsersList(
      usersList.map((u) =>
        u.user_id === selectedUser.user_id
          ? { ...u, status_akun: "banned", alasan_ban: banReason }
          : u,
      ),
    );

    alert(`Akun ${selectedUser.nama} berhasil di-ban!`);
    setBanModalOpen(false);
    setBanReason("");
    setIsSubmitting(false);
  };

  const handleUnbanUser = async (user: UserAccount) => {
    if (
      !confirm(`Apakah Anda yakin ingin melepas ban untuk akun ${user.nama}?`)
    )
      return;

    const supabase = createSupabaseBrowserClient();
    const table =
      user.tipe === "mitra" ? "mitra_profiles" : "industri_profiles";

    await supabase.from("blacklists").delete().eq("user_id", user.user_id);

    const { error } = await supabase
      .from(table)
      .update({ status_akun: "aktif", alasan_ban: null })
      .eq("user_id", user.user_id);

    if (!error) {
      setUsersList(
        usersList.map((u) =>
          u.user_id === user.user_id
            ? { ...u, status_akun: "aktif", alasan_ban: undefined }
            : u,
        ),
      );
      alert(
        `Ban untuk akun ${user.nama} berhasil dilepas! Akun kini aktif kembali.`,
      );
    } else {
      alert("Gagal melepas ban: " + error.message);
    }
  };

  const handleProvinsiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provId = e.target.value;
    const provName = e.target.options[e.target.selectedIndex]?.text || "";

    setFormPrice((prev) => ({ ...prev, provinsi: provName, kota: "" }));
    setCities([]);

    if (provId) {
      fetch(
        `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provId}.json`,
      )
        .then((res) => res.json())
        .then((data) => setCities(Array.isArray(data) ? data : []))
        .catch((err) => console.error("Error fetch kota:", err));
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;
    setIsSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("waste_shipments")
      .update({ status: newStatus })
      .eq("id", selectedShipment.id);

    setIsSubmitting(false);

    if (error) {
      alert("Gagal mengubah status pengiriman: " + error.message);
      return;
    }

    setShipments(
      shipments.map((s) =>
        s.id === selectedShipment.id ? { ...s, status: newStatus } : s,
      ),
    );
    setStatusModalOpen(false);
    alert("Status pengiriman berhasil diubah!");
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("products")
      .insert({
        nama_produk: formProduct.nama_produk,
        deskripsi: formProduct.deskripsi,
        satuan: formProduct.satuan,
        harga_default: Number(formProduct.harga_default),
        stok_dummy: Number(formProduct.stok),
      })
      .select()
      .single();

    if (data) setProducts([data, ...products]);
    if (error) alert("Gagal menambah produk: " + error.message);

    setProductModalOpen(false);
    setFormProduct({
      nama_produk: "",
      deskripsi: "",
      satuan: "karung",
      harga_default: "",
      stok: "50",
    });
    setIsSubmitting(false);
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase.from("regional_product_prices").upsert(
      {
        product_id: formPrice.product_id,
        provinsi: formPrice.provinsi.toUpperCase(),
        kota: formPrice.kota.toUpperCase(),
        harga: Number(formPrice.harga),
        stok: Number(formPrice.stok),
      },
      { onConflict: "product_id,kota" },
    );

    if (!error) {
      alert("Harga dan stok wilayah berhasil disimpan!");
      window.location.reload();
    } else {
      alert("Gagal menyimpan data wilayah: " + error.message);
    }
    setIsSubmitting(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Yakin ingin menghapus produk ini?")) return;
    const supabase = createSupabaseBrowserClient();
    await supabase.from("products").delete().eq("id", id);
    setProducts(products.filter((p) => p.id !== id));
    setRegionalPrices(regionalPrices.filter((rp) => rp.product_id !== id));
  };

  const handleDeleteRegionalPrice = async (id: string) => {
    if (!confirm("Yakin ingin menghapus harga wilayah ini?")) return;
    const supabase = createSupabaseBrowserClient();
    await supabase.from("regional_product_prices").delete().eq("id", id);
    setRegionalPrices(regionalPrices.filter((rp) => rp.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-forest border-t-transparent rounded-full animate-spin"></div>
          <p className="text-forest font-medium text-sm">
            Memuat pusat kendali admin...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-cream relative overflow-x-hidden">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* KONTEN UTAMA */}
      <main className="flex-1 min-w-0 px-4 sm:px-6 md:px-12 py-6 md:py-12 max-w-6xl pt-24 md:pt-12">
        <div className="mb-8">
          <p className="font-mono text-xs tracking-widest uppercase text-green mb-1">
            Administrator Portal
          </p>
          <h1 className="font-display font-semibold text-2xl md:text-3xl text-forest capitalize">
            {activeTab.replace("-", " ")}
          </h1>
        </div>

        {activeTab === "ringkasan" && (
          <div className="space-y-5">
            <div className="bg-paper p-5 md:p-6 rounded-2xl border border-forest/10 shadow-xs">
              <h3 className="font-display font-semibold text-lg text-forest mb-1.5">
                Selamat Datang di Portal Kendali
              </h3>
              <p className="text-sm text-ink/60 leading-relaxed">
                Pantau statistik utama, kelola akun, dan navigasikan katalog
                produk serta pengiriman dari satu tempat.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-paper p-4 md:p-5 rounded-2xl border border-forest/10 shadow-xs flex flex-col justify-center">
                <p className="text-[10px] sm:text-xs text-ink/50 uppercase font-mono mb-1">
                  Total Mitra
                </p>
                <p className="font-display font-semibold text-xl md:text-2xl text-forest">
                  {usersList.filter((u) => u.tipe === "mitra").length}
                </p>
              </div>
              <div className="bg-paper p-4 md:p-5 rounded-2xl border border-forest/10 shadow-xs flex flex-col justify-center">
                <p className="text-[10px] sm:text-xs text-ink/50 uppercase font-mono mb-1">
                  Total Industri
                </p>
                <p className="font-display font-semibold text-xl md:text-2xl text-forest">
                  {usersList.filter((u) => u.tipe === "industri").length}
                </p>
              </div>
              <div className="bg-paper p-4 md:p-5 rounded-2xl border border-forest/10 shadow-xs flex flex-col justify-center">
                <p className="text-[10px] sm:text-xs text-ink/50 uppercase font-mono mb-1">
                  Pengiriman Limbah
                </p>
                <p className="font-display font-semibold text-xl md:text-2xl text-forest">
                  {shipments.length}
                </p>
              </div>
              <div className="bg-paper p-4 md:p-5 rounded-2xl border border-forest/10 shadow-xs flex flex-col justify-center">
                <p className="text-[10px] sm:text-xs text-ink/50 uppercase font-mono mb-1">
                  Produk Katalog
                </p>
                <p className="font-display font-semibold text-xl md:text-2xl text-forest">
                  {products.length}
                </p>
              </div>
            </div>
          </div>
        )}

        {(activeTab === "manajemen-pengguna" ||
          activeTab === "manajemen-akun") && (
          <section className="bg-paper rounded-2xl border border-forest/10 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-forest/10 bg-forest/5 flex justify-between items-center">
              <div>
                <h3 className="font-display font-semibold text-forest text-base">
                  Daftar Akun Mitra & Industri
                </h3>
                <p className="text-xs text-ink/60">
                  Inspeksi profil lengkap, foto KTP/NPWP, dan set kuota
                  transaksi.
                </p>
              </div>
            </div>

            <div className="block md:hidden p-4 space-y-4 bg-cream/30">
              {usersList.map((usr, index) => (
                <div
                  key={`${usr.tipe}-${usr.user_id}-${index}`}
                  className="bg-white border border-forest/10 rounded-xl p-4 shadow-sm flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-forest text-sm">
                        {usr.nama}
                      </h4>
                      <p className="text-xs text-ink/60 uppercase font-mono mt-0.5">
                        {usr.tipe} • {usr.nik_nib}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full uppercase tracking-wider text-[10px] font-bold shrink-0 ${
                        usr.status_akun === "banned"
                          ? "bg-red-100 text-red-700"
                          : "bg-green/10 text-green"
                      }`}
                    >
                      {usr.status_akun}
                    </span>
                  </div>

                  {usr.tipe === "mitra" && (
                    <div className="text-xs text-ink/70">
                      Penggunaan Kuota:{" "}
                      <span className="font-mono font-medium text-forest">
                        {usr.total_pemesanan} / {usr.kuota_pemesanan ?? 30}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-forest/5 mt-1">
                    <button
                      onClick={() => {
                        setSelectedUserDetail(usr);
                        setDetailModalOpen(true);
                      }}
                      className="flex-1 text-xs font-medium py-2 bg-forest/5 text-forest rounded-lg hover:bg-forest/10 transition-colors text-center cursor-pointer"
                    >
                      Detail
                    </button>
                    {usr.tipe === "mitra" && (
                      <button
                        onClick={() => handleOpenOrdersModal(usr)}
                        className="flex-1 text-xs font-medium py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-center cursor-pointer"
                      >
                        Pesanan
                      </button>
                    )}
                    {usr.status_akun === "banned" ? (
                      <button
                        onClick={() => handleUnbanUser(usr)}
                        className="flex-1 text-xs font-semibold py-2 bg-emerald-100 text-emerald-800 rounded-lg hover:bg-emerald-200 transition-colors text-center cursor-pointer"
                      >
                        Lepas Ban
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedUser(usr);
                          setBanModalOpen(true);
                        }}
                        className="flex-1 text-xs font-semibold py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-center cursor-pointer"
                      >
                        Ban
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-forest/5 text-forest font-medium border-b border-forest/10">
                  <tr>
                    <th className="p-4">Nama / Perusahaan</th>
                    <th className="p-4">Tipe</th>
                    <th className="p-4">NIK / NIB / NPWP</th>
                    <th className="p-4">Penggunaan Kuota</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest/10">
                  {usersList.map((usr, index) => (
                    <tr
                      key={`desktop-${usr.tipe}-${usr.user_id}-${index}`}
                      className="hover:bg-forest/[0.02] transition-colors"
                    >
                      <td className="p-4 font-medium text-forest">
                        {usr.nama}
                      </td>
                      <td className="p-4 capitalize text-xs font-mono">
                        {usr.tipe}
                      </td>
                      <td className="p-4 text-xs font-mono">{usr.nik_nib}</td>
                      <td className="p-4 text-xs">
                        {usr.tipe === "mitra" ? (
                          <span className="font-mono font-medium text-forest">
                            {usr.total_pemesanan} / {usr.kuota_pemesanan ?? 30}
                          </span>
                        ) : (
                          <span className="text-ink/40 italic">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full uppercase tracking-wider text-[10px] font-bold ${
                            usr.status_akun === "banned"
                              ? "bg-red-100 text-red-700"
                              : "bg-green/10 text-green"
                          }`}
                        >
                          {usr.status_akun}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedUserDetail(usr);
                              setDetailModalOpen(true);
                            }}
                            className="text-xs font-medium px-2.5 py-1.5 bg-forest/10 text-forest rounded-lg hover:bg-forest/20 transition-colors cursor-pointer"
                          >
                            Detail
                          </button>

                          {usr.tipe === "mitra" && (
                            <button
                              onClick={() => handleOpenOrdersModal(usr)}
                              className="text-xs font-medium px-2.5 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors cursor-pointer"
                            >
                              Pesanan
                            </button>
                          )}

                          {usr.status_akun === "banned" ? (
                            <button
                              onClick={() => handleUnbanUser(usr)}
                              className="text-xs font-semibold px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
                            >
                              Lepas Ban
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedUser(usr);
                                setBanModalOpen(true);
                              }}
                              className="text-xs font-semibold px-2.5 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                            >
                              Ban
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "katalog-produk" && (
          <section className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-ink/60">
                Daftar produk energi yang terdaftar secara nasional.
              </p>
              <button
                onClick={() => setProductModalOpen(true)}
                className="bg-forest text-paper px-4 py-2 rounded-xl text-xs font-medium hover:bg-forest/90 shadow-xs cursor-pointer"
              >
                + Tambah Produk Baru
              </button>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="bg-paper border border-forest/10 p-5 rounded-2xl flex flex-col relative group shadow-xs"
                >
                  <button
                    onClick={() => handleDeleteProduct(p.id)}
                    className="absolute top-4 right-4 text-ink/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium cursor-pointer"
                  >
                    Hapus
                  </button>
                  <h3 className="font-display font-semibold text-forest text-lg pr-10">
                    {p.nama_produk}
                  </h3>
                  <p className="text-xs text-ink/60 mb-3 leading-relaxed">
                    {p.deskripsi}
                  </p>
                  <div className="mt-auto border-t border-forest/10 pt-3">
                    <p className="text-[10px] text-ink/50 uppercase tracking-widest">
                      Harga Nasional (Default)
                    </p>
                    <p className="font-semibold text-green">
                      Rp {p.harga_default?.toLocaleString("id-ID")}{" "}
                      <span className="text-xs font-normal text-ink/50">
                        /{p.satuan}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "harga-wilayah" && (
          <section className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-ink/60">
                Penyesuaian harga dan ketersediaan stok produk per daerah.
              </p>
              <button
                onClick={() => setPriceModalOpen(true)}
                className="bg-forest text-paper px-4 py-2 rounded-xl text-xs font-medium hover:bg-forest/90 shadow-xs cursor-pointer"
              >
                + Set Harga Wilayah
              </button>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {regionalPrices.length === 0 && (
                <div className="col-span-3 p-8 bg-paper border border-forest/10 rounded-2xl text-center text-ink/50 text-sm">
                  Belum ada penyesuaian harga spesifik daerah.
                </div>
              )}
              {regionalPrices.map((rp) => (
                <div
                  key={rp.id}
                  className="bg-paper rounded-2xl border border-forest/10 p-5 relative group shadow-xs"
                >
                  <button
                    onClick={() => handleDeleteRegionalPrice(rp.id)}
                    className="absolute top-4 right-4 text-ink/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium cursor-pointer"
                  >
                    Hapus
                  </button>
                  <p className="text-[10px] uppercase text-ink/50 mb-1 pr-10">
                    {rp.kota}, {rp.provinsi}
                  </p>
                  <h3 className="font-semibold text-forest text-lg mb-1">
                    {rp.products?.nama_produk}
                  </h3>
                  <div className="text-sm text-ink/70 space-y-1 mt-2 border-t border-forest/10 pt-2">
                    <p>
                      Harga:{" "}
                      <span className="font-bold text-green">
                        Rp {rp.harga?.toLocaleString("id-ID")}
                      </span>
                    </p>
                    <p>
                      Stok:{" "}
                      <span className="font-bold text-forest">
                        {rp.stok} {rp.products?.satuan || "karung"}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "pengiriman" && (
          <section className="bg-paper rounded-2xl border border-forest/10 overflow-hidden shadow-xs">
            <div className="block md:hidden p-4 space-y-4 bg-cream/30">
              {shipments.map((ship) => (
                <div
                  key={`mobile-ship-${ship.id}`}
                  className="bg-white border border-forest/10 rounded-xl p-4 shadow-sm flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-forest text-sm">
                        {ship.industri_profiles?.nama_perusahaan || "-"}
                      </h4>
                      <p className="text-xs text-ink/70 mt-1">
                        {ship.nama_limbah}{" "}
                        <span className="font-semibold">
                          ({ship.perkiraan_berat}kg)
                        </span>
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full uppercase tracking-wider text-[10px] font-bold shrink-0 ${
                        ship.status.toLowerCase() === "selesai"
                          ? "bg-green/10 text-green"
                          : ship.status.toLowerCase() === "diperjalanan"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {ship.status}
                    </span>
                  </div>

                  <div className="text-xs text-ink/60 bg-forest/5 p-2 rounded-lg">
                    <span className="block font-medium text-ink/80 mb-0.5">
                      Lokasi Penjemputan:
                    </span>
                    {ship.lokasi_penjemputan}
                  </div>

                  <div className="pt-2 border-t border-forest/5 mt-1">
                    <button
                      onClick={() => {
                        setSelectedShipment(ship);
                        setNewStatus(ship.status);
                        setStatusModalOpen(true);
                      }}
                      className="w-full text-xs font-semibold py-2 bg-green/10 text-green rounded-lg hover:bg-green/20 transition-colors text-center cursor-pointer"
                    >
                      Ubah Status
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-forest/5 text-forest font-medium border-b border-forest/10">
                  <tr>
                    <th className="p-4">Industri</th>
                    <th className="p-4">Limbah & Berat</th>
                    <th className="p-4">Lokasi Penjemputan</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest/10">
                  {shipments.map((ship) => (
                    <tr
                      key={`desktop-ship-${ship.id}`}
                      className="hover:bg-forest/[0.02] transition-colors"
                    >
                      <td className="p-4 font-medium text-forest">
                        {ship.industri_profiles?.nama_perusahaan || "-"}
                      </td>
                      <td className="p-4">
                        {ship.nama_limbah} ({ship.perkiraan_berat}kg)
                      </td>
                      <td className="p-4 text-xs max-w-xs truncate">
                        {ship.lokasi_penjemputan}
                      </td>
                      <td className="p-4 font-bold text-xs">
                        <span
                          className={`px-2.5 py-1 rounded-full uppercase tracking-wider text-[10px] ${
                            ship.status.toLowerCase() === "selesai"
                              ? "bg-green/10 text-green"
                              : ship.status.toLowerCase() === "diperjalanan"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {ship.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedShipment(ship);
                            setNewStatus(ship.status);
                            setStatusModalOpen(true);
                          }}
                          className="text-green hover:underline text-xs font-medium cursor-pointer"
                        >
                          Ubah Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {detailModalOpen && selectedUserDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4">
            <div className="bg-paper rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4 border-b border-forest/10 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-green">
                    Profil {selectedUserDetail.tipe}
                  </span>
                  <h3 className="font-display font-semibold text-xl text-forest">
                    {selectedUserDetail.nama}
                  </h3>
                </div>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="text-ink/40 hover:text-ink text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-6">
                <div className="bg-white p-3 rounded-xl border border-forest/10 space-y-1.5">
                  <p className="text-ink/50 uppercase font-mono text-[10px]">
                    Identitas Resmi
                  </p>
                  <p>
                    <span className="font-semibold">NIK / NIB / NPWP:</span>{" "}
                    {selectedUserDetail.nik_nib}
                  </p>
                  <p>
                    <span className="font-semibold">Telepon:</span>{" "}
                    {selectedUserDetail.telepon}
                  </p>
                  <p>
                    <span className="font-semibold">Status Akun:</span>{" "}
                    <span className="capitalize font-bold">
                      {selectedUserDetail.status_akun}
                    </span>
                  </p>
                  {selectedUserDetail.alasan_ban && (
                    <p className="text-red-600">
                      <span className="font-semibold">Alasan Ban:</span>{" "}
                      {selectedUserDetail.alasan_ban}
                    </p>
                  )}
                </div>

                <div className="bg-white p-3 rounded-xl border border-forest/10 space-y-1.5">
                  <p className="text-ink/50 uppercase font-mono text-[10px]">
                    Alamat & Wilayah Operasional
                  </p>
                  <p>
                    <span className="font-semibold">Provinsi:</span>{" "}
                    {selectedUserDetail.provinsi}
                  </p>
                  <p>
                    <span className="font-semibold">Kota / Kab:</span>{" "}
                    {selectedUserDetail.kota_kabupaten}
                  </p>
                  <p>
                    <span className="font-semibold">Kec / Kel:</span>{" "}
                    {selectedUserDetail.kecamatan},{" "}
                    {selectedUserDetail.kelurahan}
                  </p>
                  <p>
                    <span className="font-semibold">Detail Alamat:</span>{" "}
                    {selectedUserDetail.alamat}
                  </p>
                  <p>
                    <span className="font-semibold">Koordinat GPS:</span>{" "}
                    {selectedUserDetail.lat && selectedUserDetail.lng
                      ? `${selectedUserDetail.lat}, ${selectedUserDetail.lng}`
                      : "Belum di-set"}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xs font-semibold text-forest mb-2">
                  Dokumen Verifikasi (Foto KTP / NPWP):
                </p>
                {selectedUserDetail.foto_doc_url ? (
                  <div className="bg-black/5 rounded-xl p-2 border border-forest/10 overflow-hidden text-center">
                    <a
                      href={selectedUserDetail.foto_doc_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={selectedUserDetail.foto_doc_url}
                        alt="Foto Dokumen"
                        className="max-h-64 object-contain mx-auto rounded-lg hover:opacity-90 transition-opacity"
                      />
                    </a>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 text-center text-ink/40 text-xs">
                    Foto dokumen tidak diunggah atau belum tersedia.
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-forest/10">
                <button
                  type="button"
                  onClick={() => setDetailModalOpen(false)}
                  className="bg-forest text-paper px-4 py-2 rounded-xl text-xs font-medium hover:bg-forest/90 cursor-pointer"
                >
                  Tutup Profil
                </button>
              </div>
            </div>
          </div>
        )}

        {ordersModalOpen && selectedUserDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4">
            <div className="bg-paper rounded-2xl shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4 border-b border-forest/10 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-blue-600">
                    Riwayat & Status Pesanan Mitra
                  </span>
                  <h3 className="font-display font-semibold text-xl text-forest">
                    {selectedUserDetail.nama}
                  </h3>
                </div>
                <button
                  onClick={() => setOrdersModalOpen(false)}
                  className="text-ink/40 hover:text-ink text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={handleUpdateQuota}
                className="bg-blue-50/50 border border-blue-200/60 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-end gap-3"
              >
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-blue-900 mb-1">
                    Atur Batas Kuota Pemesanan Akun Ini:
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={newQuota}
                    onChange={(e) => setNewQuota(Number(e.target.value))}
                    className="w-full border border-blue-300 p-2 rounded-xl text-sm bg-white outline-none font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Kuota Baru"}
                </button>
              </form>

              <div className="mb-4">
                <h4 className="font-semibold text-forest text-sm mb-2">
                  Daftar Transaksi Pemesanan
                </h4>
                {loadingOrders ? (
                  <p className="text-xs text-ink/50 py-4 text-center">
                    Memuat riwayat transaksi...
                  </p>
                ) : userOrders.length === 0 ? (
                  <div className="bg-white border border-forest/10 rounded-xl p-6 text-center text-xs text-ink/50">
                    Mitra ini belum pernah melakukan pemesanan produk.
                  </div>
                ) : (
                  <div className="border border-forest/10 rounded-xl overflow-hidden bg-white">
                    <table className="w-full text-left text-xs block md:table overflow-x-auto">
                      <thead className="bg-forest/5 text-forest font-medium border-b border-forest/10 hidden md:table-header-group">
                        <tr>
                          <th className="p-3">ID Pesanan</th>
                          <th className="p-3">Tanggal</th>
                          <th className="p-3">Total Biaya</th>
                          <th className="p-3">Status Pengiriman</th>
                          <th className="p-3 text-center">Ubah Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-forest/10 block md:table-row-group">
                        {userOrders.map((ord) => (
                          <tr
                            key={ord.id}
                            className="block md:table-row p-4 md:p-0"
                          >
                            <td className="p-1 md:p-3 font-mono font-medium text-forest truncate block md:table-cell mb-2 md:mb-0">
                              <span className="inline-block md:hidden text-ink/50 mr-2">
                                ID:
                              </span>
                              {ord.id.slice(0, 8)}...
                            </td>
                            <td className="p-1 md:p-3 text-ink/60 block md:table-cell mb-2 md:mb-0">
                              <span className="inline-block md:hidden text-ink/50 mr-2">
                                Tgl:
                              </span>
                              {new Date(ord.created_at).toLocaleDateString(
                                "id-ID",
                              )}
                            </td>
                            <td className="p-1 md:p-3 font-semibold text-green block md:table-cell mb-3 md:mb-0">
                              <span className="inline-block md:hidden text-ink/50 mr-2">
                                Total:
                              </span>
                              Rp {ord.total_harga?.toLocaleString("id-ID")}
                            </td>
                            <td className="p-1 md:p-3 block md:table-cell mb-4 md:mb-0">
                              <div className="flex flex-col gap-1 items-start">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                    ord.status === "dikirim"
                                      ? "bg-amber-100 text-amber-800"
                                      : ord.status === "selesai"
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {ord.status}
                                </span>
                                {ord.bukti_pengiriman_url && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setSelectedProofUrl(
                                        ord.bukti_pengiriman_url!,
                                      );
                                      setProofModalOpen(true);
                                    }}
                                    className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 mt-1 cursor-pointer font-medium"
                                  >
                                    📎 Lihat Bukti
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="p-1 md:p-3 text-center block md:table-cell border-t md:border-0 border-forest/10 pt-3 md:pt-0 mt-2 md:mt-0">
                              <button
                                onClick={() => {
                                  setSelectedOrderUpdate(ord);
                                  setNewOrderStatus(ord.status);
                                  setProofFile(null);
                                  setOrderStatusModalOpen(true);
                                }}
                                className="w-full md:w-auto text-green hover:underline text-xs font-medium cursor-pointer bg-green/10 md:bg-transparent py-2 md:py-0 rounded-lg md:rounded-none"
                              >
                                Ubah Status & Bukti
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-forest/10">
                <button
                  type="button"
                  onClick={() => setOrdersModalOpen(false)}
                  className="bg-forest text-paper px-4 py-2 rounded-xl text-xs font-medium hover:bg-forest/90 cursor-pointer"
                >
                  Tutup Modal
                </button>
              </div>
            </div>
          </div>
        )}

        {orderStatusModalOpen && selectedOrderUpdate && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
            <div className="bg-paper rounded-2xl shadow-xl w-full max-w-sm p-6">
              <h3 className="font-display font-semibold text-forest mb-4">
                Ubah Status & Upload Bukti
              </h3>
              <form onSubmit={handleSaveOrderStatus} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">
                    Status Pesanan
                  </label>
                  <select
                    value={newOrderStatus}
                    onChange={(e) => setNewOrderStatus(e.target.value)}
                    className="w-full border border-ink/20 p-2.5 rounded-xl text-sm bg-white outline-none cursor-pointer"
                  >
                    <option value={newOrderStatus} className="hidden">
                      {newOrderStatus}
                    </option>
                    <option value="menunggu_pembayaran">
                      Menunggu Pembayaran
                    </option>
                    <option value="diproses">Diproses</option>
                    <option value="dikirim">Dikirim (Dalam Pengiriman)</option>
                    <option value="selesai">Selesai</option>
                    <option value="dibatalkan">Dibatalkan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink mb-1">
                    Foto Bukti Pengiriman (Opsional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-ink/70 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-forest/10 file:text-forest hover:file:bg-forest/20 cursor-pointer border border-ink/20 rounded-xl p-1 bg-white"
                  />
                  {selectedOrderUpdate.bukti_pengiriman_url && !proofFile && (
                    <p className="text-[10px] text-green mt-1">
                      ✓ Bukti sudah pernah diupload sebelumnya.
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-forest/10">
                  <button
                    type="button"
                    onClick={() => setOrderStatusModalOpen(false)}
                    className="px-4 py-2 text-xs text-ink/60 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-green text-white px-4 py-2 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {banModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4">
            <div className="bg-paper rounded-2xl shadow-xl w-full max-w-md p-6">
              <h3 className="font-display font-semibold text-red-800 mb-2">
                Blokir / Ban Akun
              </h3>
              <p className="text-xs text-ink/70 mb-4">
                Anda akan memblokir{" "}
                <span className="font-bold">{selectedUser.nama}</span> (
                {selectedUser.nik_nib}). NIK/NIB ini akan dimasukkan ke daftar
                hitam.
              </p>
              <form onSubmit={handleBanUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">
                    Alasan Pemblokiran
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Misal: Pengiriman data fiktif / deskripsi limbah tidak sesuai."
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    className="w-full border border-ink/20 p-2.5 rounded-xl text-sm bg-white outline-none resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-forest/10">
                  <button
                    type="button"
                    onClick={() => setBanModalOpen(false)}
                    className="px-4 py-2 text-xs text-ink/60 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    {isSubmitting ? "Memproses..." : "Ya, Ban Akun"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {priceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4">
            <div className="bg-paper rounded-2xl shadow-xl w-full max-w-md p-6">
              <h3 className="font-display font-semibold text-forest mb-4">
                Set Harga & Stok Wilayah
              </h3>
              <form onSubmit={handleSavePrice} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">
                    Pilih Produk
                  </label>
                  <select
                    className="w-full border border-ink/20 p-2.5 rounded-xl outline-none text-sm bg-white cursor-pointer"
                    required
                    value={formPrice.product_id}
                    onChange={(e) =>
                      setFormPrice({ ...formPrice, product_id: e.target.value })
                    }
                  >
                    <option value="">-- Pilih Produk --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nama_produk}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-ink mb-1">
                      Provinsi
                    </label>
                    <select
                      className="w-full border border-ink/20 p-2.5 rounded-xl text-xs uppercase outline-none bg-white cursor-pointer"
                      onChange={handleProvinsiChange}
                      required
                    >
                      <option value="">PROVINSI</option>
                      {provinces.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink mb-1">
                      Kota / Kab
                    </label>
                    <select
                      className="w-full border border-ink/20 p-2.5 rounded-xl text-xs uppercase disabled:bg-gray-100 outline-none bg-white cursor-pointer"
                      value={formPrice.kota}
                      onChange={(e) =>
                        setFormPrice((prev) => ({
                          ...prev,
                          kota:
                            e.target.options[e.target.selectedIndex]?.text ||
                            "",
                        }))
                      }
                      disabled={cities.length === 0}
                      required
                    >
                      <option value="">KOTA/KAB</option>
                      {cities.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-ink mb-1">
                      Harga (Rp)
                    </label>
                    <input
                      type="number"
                      placeholder="18000"
                      required
                      className="w-full border border-ink/20 p-2.5 rounded-xl outline-none text-sm bg-white"
                      value={formPrice.harga}
                      onChange={(e) =>
                        setFormPrice({ ...formPrice, harga: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink mb-1">
                      Stok Gudang
                    </label>
                    <input
                      type="number"
                      placeholder="50"
                      required
                      className="w-full border border-ink/20 p-2.5 rounded-xl outline-none text-sm bg-white"
                      value={formPrice.stok}
                      onChange={(e) =>
                        setFormPrice({ ...formPrice, stok: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-forest/10">
                  <button
                    type="button"
                    onClick={() => setPriceModalOpen(false)}
                    className="px-4 py-2 text-xs text-ink/60 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-forest text-cream px-4 py-2 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    {isSubmitting ? "Menyimpan..." : "Simpan Data"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {productModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4">
            <div className="bg-paper rounded-2xl shadow-xl w-full max-w-lg p-6">
              <h3 className="font-display font-semibold text-forest mb-4">
                Tambah Produk Utama
              </h3>
              <form onSubmit={handleSaveProduct} className="space-y-4">
                <input
                  type="text"
                  placeholder="Nama Produk"
                  required
                  value={formProduct.nama_produk}
                  onChange={(e) =>
                    setFormProduct({
                      ...formProduct,
                      nama_produk: e.target.value,
                    })
                  }
                  className="w-full border border-ink/20 p-2.5 rounded-xl text-sm bg-white outline-none"
                />
                <input
                  type="text"
                  placeholder="Deskripsi Singkat"
                  required
                  value={formProduct.deskripsi}
                  onChange={(e) =>
                    setFormProduct({
                      ...formProduct,
                      deskripsi: e.target.value,
                    })
                  }
                  className="w-full border border-ink/20 p-2.5 rounded-xl text-sm bg-white outline-none"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Satuan (karung/liter)"
                    required
                    value={formProduct.satuan}
                    onChange={(e) =>
                      setFormProduct({ ...formProduct, satuan: e.target.value })
                    }
                    className="w-full border border-ink/20 p-2.5 rounded-xl text-sm bg-white outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Stok Default"
                    required
                    value={formProduct.stok}
                    onChange={(e) =>
                      setFormProduct({ ...formProduct, stok: e.target.value })
                    }
                    className="w-full border border-ink/20 p-2.5 rounded-xl text-sm bg-white outline-none"
                  />
                </div>
                <input
                  type="number"
                  placeholder="Harga Default Nasional (Rp)"
                  required
                  value={formProduct.harga_default}
                  onChange={(e) =>
                    setFormProduct({
                      ...formProduct,
                      harga_default: e.target.value,
                    })
                  }
                  className="w-full border border-ink/20 p-2.5 rounded-xl text-sm bg-white outline-none"
                />
                <div className="flex justify-end gap-3 pt-3 border-t border-forest/10">
                  <button
                    type="button"
                    onClick={() => setProductModalOpen(false)}
                    className="px-4 py-2 text-xs text-ink/60 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-forest text-cream px-4 py-2 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    {isSubmitting ? "Menyimpan..." : "Simpan Produk"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {statusModalOpen && selectedShipment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4">
            <div className="bg-paper rounded-2xl shadow-xl w-full max-w-sm p-6">
              <h3 className="font-display font-semibold text-forest mb-4">
                Ubah Status Pengiriman Limbah
              </h3>
              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border border-ink/20 p-2.5 rounded-xl text-sm bg-white outline-none cursor-pointer"
                >
                  <option value={newStatus} className="hidden">
                    {newStatus}
                  </option>
                  <option value="MENUNGGU PEMBAYARAN">
                    Menunggu Pembayaran
                  </option>
                  <option value="Menunggu Penjemputan">
                    Menunggu Penjemputan
                  </option>
                  <option value="Diperjalanan">Diperjalanan</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>
                <div className="flex justify-end gap-3 pt-3 border-t border-forest/10">
                  <button
                    type="button"
                    onClick={() => setStatusModalOpen(false)}
                    className="px-4 py-2 text-xs text-ink/60 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-green text-white px-4 py-2 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    {isSubmitting ? "Menyimpan..." : "Simpan Status"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {proofModalOpen && selectedProofUrl && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4 transition-opacity animate-in fade-in"
            onClick={() => setProofModalOpen(false)}
          >
            <div
              className="relative bg-paper rounded-2xl shadow-2xl max-w-2xl w-full p-2 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-3 border-b border-forest/10 mb-2">
                <h3 className="font-display font-semibold text-forest text-sm">
                  Foto Bukti Pengiriman
                </h3>
                <button
                  onClick={() => setProofModalOpen(false)}
                  className="text-ink/50 hover:text-ink font-bold w-8 h-8 flex items-center justify-center rounded-full bg-forest/5 hover:bg-forest/10 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="relative w-full flex justify-center items-center bg-black/5 rounded-xl overflow-hidden min-h-[200px]">
                <img
                  src={selectedProofUrl}
                  alt="Bukti Pengiriman Barang"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              </div>
              <div className="p-3 text-center">
                <a
                  href={selectedProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-medium text-blue-600 hover:underline"
                >
                  Buka gambar resolusi penuh di tab baru
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
