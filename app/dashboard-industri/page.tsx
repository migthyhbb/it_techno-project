"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { AIAssistant } from "@/components/ai-assistant";

interface IndustriProfile {
  nama_perusahaan: string;
  npwp: string;
  alamat: string;
  telepon: string;
  provinsi?: string;
  kota_kabupaten?: string;
  created_at: string;
  status_akun?: string;
  alasan_ban?: string;
}

interface WasteShipment {
  id: string;
  nama_limbah: string;
  perkiraan_berat: number;
  lokasi_penjemputan: string;
  status: string;
  is_b3?: boolean;
  kategori_b3?: string;
  biaya_pengolahan?: number;
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
      <p className="text-forest font-medium text-sm md:text-base">{value || "-"}</p>
    </div>
  );
}

const KREDIT_PER_KG = 100;

// HARDCODED REKENING TUJUAN B3
const REKENING_PEMBAYARAN_B3 = "BCA 123-456-7890 a.n. LENTERA BERKAH";

const KATEGORI_B3 = [
  { id: "cair_kimia", nama: "Limbah Cair & Kimia Industri", tarif: 15000 },
  { id: "oli_pelumas", nama: "Oli Bekas & Pelumas Sintetis", tarif: 12000 },
  { id: "baterai_elektronik", nama: "Baterai & E-Waste B3", tarif: 20000 },
  { id: "medis_farmasi", nama: "Limbah Medis & Farmasi", tarif: 25000 },
  { id: "sludge_lumpur", nama: "Sludge / Lumpur Berbahaya", tarif: 18000 },
];

export default function DashboardIndustriPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<IndustriProfile | null>(null);

  const [totalTerkirim, setTotalTerkirim] = useState(0);
  const [totalKredit, setTotalKredit] = useState(0);
  const [shipments, setShipments] = useState<WasteShipment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formLimbah, setFormLimbah] = useState({
    nama_limbah: "",
    berat: "",
    lokasi: "",
    foto: null as File | null,
  });
  const [isB3ModalOpen, setIsB3ModalOpen] = useState(false);
  const [formB3, setFormB3] = useState({
    nama_limbah: "",
    kategori_id: "cair_kimia",
    berat: "",
    lokasi: "",
    foto: null as File | null,
  });
  const [selectedPayShipment, setSelectedPayShipment] = useState<WasteShipment | null>(null);
  const [buktiBayarFile, setBuktiBayarFile] = useState<File | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [formWithdraw, setFormWithdraw] = useState({
    jumlah_token: "",
    metode: "Bank Transfer",
    nomor_rekening: "",
  });
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    nama_perusahaan: "",
    npwp: "",
    telepon: "",
    provinsi: "",
    kota_kabupaten: "",
    alamat: "",
  });
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    const supabase = createSupabaseBrowserClient();

    const fetchTrackingData = async (uid: string) => {
      const { data: shipmentData } = await supabase
        .from("waste_shipments")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      const { data: withdrawData } = await supabase
        .from("pencairan_dana")
        .select("jumlah_tarik_tunai")
        .eq("id_agen", uid);

      if (shipmentData) {
        setShipments(shipmentData);
        const totalKg = shipmentData
          .filter((s) => s.status.toLowerCase() === "selesai")
          .reduce((sum, s) => sum + Number(s.perkiraan_berat), 0);

        setTotalTerkirim(totalKg);

        const grossToken = totalKg * KREDIT_PER_KG;
        const totalDicairkan = withdrawData
          ? withdrawData.reduce((sum, w) => sum + Number(w.jumlah_tarik_tunai), 0)
          : 0;

        const netKredit = grossToken - totalDicairkan;
        setTotalKredit(netKredit > 0 ? netKredit : 0);
      }
    };

    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.replace("/masuk");
        return;
      }
      setUserId(data.user.id);
      setEmail(data.user.email ?? null);

      const { data: profileData } = await supabase
        .from("industri_profiles")
        .select("nama_perusahaan, npwp, alamat, telepon, provinsi, kota_kabupaten, created_at, status_akun, alasan_ban")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (!profileData) {
        router.replace("/daftar/industri");
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
        nama_perusahaan: profileData.nama_perusahaan || "",
        npwp: profileData.npwp || "",
        telepon: profileData.telepon || "",
        provinsi: profileData.provinsi || "",
        kota_kabupaten: profileData.kota_kabupaten || "",
        alamat: profileData.alamat || "",
      });

      fetchTrackingData(data.user.id);
      setLoading(false);

      intervalId = setInterval(() => {
        fetchTrackingData(data.user.id);
      }, 300000);
    });

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setEditLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("industri_profiles")
      .update({
        nama_perusahaan: editForm.nama_perusahaan,
        npwp: editForm.npwp,
        telepon: editForm.telepon,
        provinsi: editForm.provinsi,
        kota_kabupaten: editForm.kota_kabupaten,
        alamat: editForm.alamat,
      })
      .eq("user_id", userId);

    setEditLoading(false);

    if (!error) {
      setProfile((prev) =>
        prev ? { ...prev, ...editForm } : null
      );
      setIsEditOpen(false);
      alert("Profil industri berhasil diperbarui!");
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

      alert("Akun industri berhasil dihapus permanen.");
      router.push("/masuk");
    } catch {
      alert("Terjadi kesalahan jaringan saat menghapus akun.");
      setDeleteLoading(false);
    }
  };

  async function handleKirimLimbah(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) throw new Error("Sesi Anda telah berakhir, silakan login kembali.");

      let fotoUrl = "";
      if (formLimbah.foto) {
        const fileExt = formLimbah.foto.name.split('.').pop();
        const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('waste_images')
          .upload(`limbah/${fileName}`, formLimbah.foto, { upsert: true });

        if (uploadError) throw new Error(`Gagal mengunggah foto: ${uploadError.message}`);

        const { data: publicUrlData } = supabase.storage
          .from('waste_images')
          .getPublicUrl(`limbah/${fileName}`);

        fotoUrl = publicUrlData.publicUrl;
      }

      const response = await fetch("/api/setoran-limbah", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          deskripsi_input: formLimbah.nama_limbah,
          berat_kg: Number(formLimbah.berat),
          lokasi: formLimbah.lokasi.toUpperCase(),
          foto_url: fotoUrl,
          is_b3: false,
        }),
      });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.error || "Gagal menyimpan data limbah.");

      setFormLimbah({ nama_limbah: "", berat: "", lokasi: "", foto: null });
      setIsModalOpen(false);

      const { data: newData } = await supabase
        .from("waste_shipments")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (newData) setShipments(newData);

    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleKirimLimbahB3(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const katSelected = KATEGORI_B3.find((k) => k.id === formB3.kategori_id);
    const tarifPerKg = katSelected ? katSelected.tarif : 15000;
    const totalBiaya = Number(formB3.berat || 0) * tarifPerKg;

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) throw new Error("Sesi Anda telah berakhir, silakan login kembali.");

      let fotoUrl = "";
      if (formB3.foto) {
        const fileExt = formB3.foto.name.split('.').pop();
        const fileName = `b3-${session.user.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('waste_images')
          .upload(`limbah_b3/${fileName}`, formB3.foto, { upsert: true });

        if (uploadError) throw new Error(`Gagal mengunggah foto: ${uploadError.message}`);

        const { data: publicUrlData } = supabase.storage
          .from('waste_images')
          .getPublicUrl(`limbah_b3/${fileName}`);

        fotoUrl = publicUrlData.publicUrl;
      }

      const response = await fetch("/api/setoran-limbah", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          deskripsi_input: `[B3] ${formB3.nama_limbah}`,
          berat_kg: Number(formB3.berat),
          lokasi: formB3.lokasi.toUpperCase(),
          foto_url: fotoUrl,
          is_b3: true,
          kategori_b3: katSelected?.nama,
          biaya_pengolahan: totalBiaya,
          status: "Menunggu Pembayaran",
        }),
      });

      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.error || "Gagal mendaftarkan limbah B3.");

      alert(`Pendaftaran Berhasil!\nLimbah B3 kamu telah didaftarkan. Silakan lakukan konfirmasi pembayaran pada tabel 'Status Pembayaran Limbah B3' di bawah.`);
      setFormB3({ nama_limbah: "", kategori_id: "cair_kimia", berat: "", lokasi: "", foto: null });
      setIsB3ModalOpen(false);

      const { data: newData } = await supabase
        .from("waste_shipments")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (newData) setShipments(newData);

    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan saat mendaftarkan data.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleKonfirmasiPembayaran = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayShipment || !buktiBayarFile) return;

    setIsPaying(true);

    try {
      const supabase = createSupabaseBrowserClient();
      
      const { error: updateError } = await supabase
        .from("waste_shipments")
        .update({ status: "Menunggu Verifikasi" })
        .eq("id", selectedPayShipment.id);

      if (updateError) throw updateError;

      alert("Bukti pembayaran berhasil dikirim! Tim kami akan melakukan verifikasi.");
      setSelectedPayShipment(null);
      setBuktiBayarFile(null);

      if (userId) {
        const { data: newData } = await supabase
          .from("waste_shipments")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (newData) setShipments(newData);
      }

    } catch (err) {
      console.error(err);
      alert("Gagal mengirim konfirmasi pembayaran.");
    } finally {
      setIsPaying(false);
    }
  };

  const handlePencairan = async (e: React.FormEvent) => {
    e.preventDefault();
    const jumlahCair = Number(formWithdraw.jumlah_token);

    if (jumlahCair > totalKredit) {
      alert("Token yang ingin dicairkan melebihi saldo tersedia!");
      return;
    }

    setIsWithdrawing(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert("Sesi Anda telah berakhir. Silakan login kembali.");
        router.replace("/masuk");
        return;
      }

      const response = await fetch("/api/gamifikasi/redeem", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          jumlah_poin: jumlahCair,
          metode_pencairan: `${formWithdraw.metode} - ${formWithdraw.nomor_rekening}`,
        }),
      });

      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.error || "Gagal memproses penukaran poin.");

      setTotalKredit((prev) => prev - jumlahCair);
      setWithdrawSuccess(true);

      setTimeout(() => {
        setWithdrawSuccess(false);
        setIsWithdrawModalOpen(false);
        setFormWithdraw({ jumlah_token: "", metode: "Bank Transfer", nomor_rekening: "" });
      }, 3000);

    } catch (error: unknown) {
      console.error("Gagal melakukan pencairan:", error);
      const message = error instanceof Error ? error.message : "Terjadi kesalahan pada database.";
      alert(`Gagal pencairan: ${message}`);
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-forest border-t-transparent rounded-full animate-spin"></div>
          <p className="text-forest font-medium text-sm">Memuat data portal...</p>
        </div>
      </div>
    );
  }

  const joinedLabel = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  const estimasiKredit = Number(formLimbah.berat || 0) * KREDIT_PER_KG;
  const selectedKatB3 = KATEGORI_B3.find((k) => k.id === formB3.kategori_id);
  const estimasiBiayaB3 = Number(formB3.berat || 0) * (selectedKatB3?.tarif || 0);
  const estimasiRupiah = Number(formWithdraw.jumlah_token || 0) * 500;

  const b3Shipments = shipments.filter((s) => s.is_b3);

  return (
    <div className="px-4 sm:px-8 md:px-12 py-6 md:py-10 max-w-6xl mx-auto w-full relative">
      {/* Ringkasan */}
      <section id="ringkasan" className="scroll-mt-8 mb-10">
        <p className="font-mono text-[11px] tracking-widest uppercase text-green mb-2">
          Ringkasan
        </p>
        <h1 className="font-display font-semibold text-2xl md:text-3xl text-forest mb-1.5">
          Selamat datang, {profile?.nama_perusahaan ?? "Industri"}
        </h1>
        <p className="text-ink/60 mb-6 text-sm">
          Pantau ringkasan kemitraan industri kamu dengan LENTERA di sini.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-paper rounded-2xl border border-forest/10 p-5 shadow-xs flex flex-col justify-between">
            <p className="text-xs text-ink/45 mb-1">Status akun</p>
            <div className="flex items-center gap-1.5 mt-2">
              <svg className="w-4 h-4 text-forest opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-display font-semibold text-forest text-lg">Aktif</p>
            </div>
          </div>
          <div className="bg-paper rounded-2xl border border-forest/10 p-5 shadow-xs flex flex-col justify-between">
            <p className="text-xs text-ink/45 mb-1">Total limbah terkirim</p>
            <p className="font-display font-semibold text-forest text-lg mt-2">
              {totalTerkirim.toLocaleString("id-ID")} <span className="text-sm font-normal text-ink/60">kg</span>
            </p>
          </div>

          <div className="bg-gradient-to-br from-forest to-forest/90 rounded-2xl border border-forest p-5 shadow-sm flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
            <div className="flex justify-between items-start relative z-10">
              <p className="text-xs text-cream/70 mb-1">Kredit Tersedia</p>
              <button
                onClick={() => setIsWithdrawModalOpen(true)}
                disabled={totalKredit <= 0}
                className="bg-gold/20 hover:bg-gold/40 disabled:bg-gold/10 text-gold disabled:text-gold/50 text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full transition-colors cursor-pointer"
              >
                Cairkan
              </button>
            </div>
            <div className="flex items-end gap-1.5 mt-2 relative z-10">
              <span className="text-gold font-display font-bold text-2xl">
                {totalKredit.toLocaleString("id-ID")}
              </span>
              <span className="text-xs text-cream/70 font-medium mb-1.5 uppercase tracking-wider">Token</span>
            </div>
          </div>

          <div className="bg-paper rounded-2xl border border-forest/10 p-5 shadow-xs flex flex-col justify-between">
            <p className="text-xs text-ink/45 mb-1">Bergabung sejak</p>
            <p className="font-display font-semibold text-forest text-lg mt-2">{joinedLabel}</p>
          </div>
        </div>
      </section>

      {/* Lacak Pengiriman */}
      <section id="lacak-pengiriman" className="scroll-mt-8 mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="font-display font-semibold text-xl text-forest">Status Pengiriman</h2>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-forest/5 border border-forest/10 text-[10px] text-forest/70 font-semibold tracking-wide uppercase">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sistem tersinkronisasi
              </div>
            </div>
            <p className="text-xs text-ink/60">Pantau pergerakan limbah yang sedang diproses secara real-time.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
            <button
              onClick={() => {
                setErrorMsg(null);
                setIsModalOpen(true);
              }}
              className="bg-forest text-paper px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium hover:bg-forest/90 transition-colors shadow-xs text-center flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
              Penjemputan Limbah Biasa
            </button>

            <button
              onClick={() => {
                setErrorMsg(null);
                setIsB3ModalOpen(true);
              }}
              className="bg-amber-600 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-amber-700 transition-colors shadow-xs text-center flex items-center justify-center gap-1.5 cursor-pointer border border-amber-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              Daftar Pengolahan B3
            </button>
          </div>
        </div>

        {shipments.length === 0 ? (
          <div className="bg-paper rounded-2xl border border-forest/10 p-10 text-center">
            <p className="text-ink/60 text-sm">Belum ada riwayat pengiriman limbah.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {shipments.map((shipment) => {
              const isPendingPayment = shipment.status.toLowerCase() === "menunggu pembayaran";

              return (
                <div key={shipment.id} className="bg-paper rounded-2xl border border-forest/10 p-5 flex flex-col justify-between shadow-xs hover:border-forest/20 transition-colors">
                  <div>
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <div>
                        <h3 className="font-semibold text-forest text-base leading-snug">{shipment.nama_limbah}</h3>
                        {shipment.is_b3 && (
                          <span className="inline-block mt-0.5 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                            Kategori B3
                          </span>
                        )}
                      </div>
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full shrink-0 ${
                        shipment.status.toLowerCase() === 'selesai' ? 'bg-green/10 text-green'
                        : isPendingPayment ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : shipment.status.toLowerCase() === 'diperjalanan' ? 'bg-blue-100 text-blue-700'
                        : 'bg-amber-100 text-amber-800'
                      }`}>
                        {shipment.status}
                      </span>
                    </div>

                    <div className="text-sm text-ink/70 space-y-1.5 mb-4">
                      <p><strong className="font-medium text-ink">Berat:</strong> {shipment.perkiraan_berat} kg</p>
                      <p className="line-clamp-2"><strong className="font-medium text-ink">Lokasi:</strong> {shipment.lokasi_penjemputan}</p>

                      {shipment.is_b3 && shipment.biaya_pengolahan && (
                        <p className="text-xs font-semibold text-amber-900 pt-1">
                          Biaya Pengolahan: Rp {shipment.biaya_pengolahan.toLocaleString("id-ID")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-forest/10 pt-3 mt-auto">
                    <p className="text-xs text-ink/40">
                      Dibuat: {new Date(shipment.created_at).toLocaleDateString("id-ID")}
                    </p>

                    {!shipment.is_b3 && shipment.status.toLowerCase() === 'selesai' && (
                      <p className="text-[10px] font-medium text-gold bg-gold/10 px-2 py-0.5 rounded-md">
                        +{Number(shipment.perkiraan_berat) * KREDIT_PER_KG} Token
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION: STATUS PEMBAYARAN LIMBAH B3 & KONFIRMASI */}
      {b3Shipments.length > 0 && (
        <section id="pembayaran-b3" className="scroll-mt-8 mb-10">
          <div className="mb-4">
            <p className="font-mono text-xs tracking-widest uppercase text-amber-700 mb-1">
              Tagihan & Transaksi
            </p>
            <h2 className="font-display font-semibold text-xl text-forest">
              Status Pembayaran Limbah B3
            </h2>
            <p className="text-xs text-ink/60 mt-0.5">
              Lakukan pembayaran dan upload konfirmasi untuk pesanan B3 yang masih menunggu.
            </p>
          </div>

          <div className="bg-paper rounded-2xl border border-amber-200 overflow-hidden shadow-xs p-4 md:p-0">
            {/* TAMPILAN CARD - KHUSUS MOBILE (sm ke bawah) */}
            <div className="block md:hidden space-y-3">
              {b3Shipments.map((b3) => {
                const isPending = b3.status.toLowerCase() === "menunggu pembayaran";

                return (
                  <div key={b3.id} className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-semibold text-forest text-sm leading-tight">{b3.nama_limbah}</h4>
                        <p className="text-xs text-ink/60 mt-1">Berat: {b3.perkiraan_berat} kg</p>
                        <p className="text-[11px] font-medium text-amber-900/80 mt-1">
                          Rekening Tujuan: <span className="font-bold text-amber-950">{REKENING_PEMBAYARAN_B3}</span>
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full shrink-0 ${
                        isPending ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : b3.status.toLowerCase() === "menunggu verifikasi" ? "bg-blue-100 text-blue-800"
                        : "bg-green/10 text-green"
                      }`}>
                        {b3.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-amber-200/60 pt-2.5">
                      <div>
                        <p className="text-[10px] text-ink/50 uppercase font-medium">Total Biaya</p>
                        <p className="text-sm font-bold text-amber-900">
                          Rp {(b3.biaya_pengolahan || 0).toLocaleString("id-ID")}
                        </p>
                      </div>

                      {isPending ? (
                        <button
                          onClick={() => setSelectedPayShipment(b3)}
                          className="text-xs font-bold px-3 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors cursor-pointer shadow-xs"
                        >
                          Konfirmasi Bayar
                        </button>
                      ) : (
                        <span className="text-xs text-ink/40 italic">Lunas / Diproses</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TAMPILAN TABEL - KHUSUS DESKTOP (md ke atas) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-amber-50/80 border-b border-amber-200 text-xs font-bold text-amber-900 uppercase tracking-wider">
                    <th className="p-4">Deskripsi Limbah</th>
                    <th className="p-4">Berat Total</th>
                    <th className="p-4">Total Biaya</th>
                    <th className="p-4">Rekening Tujuan</th>
                    <th className="p-4">Status Pembayaran</th>
                    <th className="p-4 text-right">Aksi Konfirmasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest/10">
                  {b3Shipments.map((b3) => {
                    const isPending = b3.status.toLowerCase() === "menunggu pembayaran";

                    return (
                      <tr key={b3.id} className="hover:bg-cream/40 transition-colors">
                        <td className="p-4 font-medium text-forest">{b3.nama_limbah}</td>
                        <td className="p-4 text-ink/70">{b3.perkiraan_berat} kg</td>
                        <td className="p-4 font-semibold text-amber-900">
                          Rp {(b3.biaya_pengolahan || 0).toLocaleString("id-ID")}
                        </td>
                        <td className="p-4 text-xs font-semibold text-amber-950">
                          {REKENING_PEMBAYARAN_B3}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full ${
                            isPending ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : b3.status.toLowerCase() === "menunggu verifikasi" ? "bg-blue-100 text-blue-800"
                            : "bg-green/10 text-green"
                          }`}>
                            {b3.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {isPending ? (
                            <button
                              onClick={() => setSelectedPayShipment(b3)}
                              className="text-xs font-bold px-3.5 py-1.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors cursor-pointer"
                            >
                              Konfirmasi Bayar
                            </button>
                          ) : (
                            <span className="text-xs text-ink/40 italic">Lunas / Diproses</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Profil Industri */}
      <section id="profil-industri" className="scroll-mt-8 mb-10">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="font-mono text-xs tracking-widest uppercase text-clay mb-1">
              Profil industri
            </p>
            <h2 className="font-display font-semibold text-xl text-forest">
              Informasi Industri
            </h2>
          </div>
          <button
            onClick={() => setIsEditOpen(true)}
            className="text-xs font-semibold px-4 py-2 bg-forest text-cream rounded-xl hover:bg-forest/90 transition-colors cursor-pointer"
          >
            Ubah Profil
          </button>
        </div>

        <div className="bg-paper rounded-2xl border border-forest/10 p-6 md:p-8 grid sm:grid-cols-2 gap-6 shadow-xs">
          <InfoRow label="Nama Perusahaan" value={profile?.nama_perusahaan} />
          <InfoRow label="Email Kontak" value={email} />
          <InfoRow label="NPWP" value={profile?.npwp} />
          <InfoRow label="Nomor Telepon" value={profile?.telepon} />
          <InfoRow
            label="Wilayah Operasional"
            value={
              profile?.kota_kabupaten
                ? `${profile.kota_kabupaten}, ${profile.provinsi}`
                : "BELUM DISET"
            }
          />
          <InfoRow label="Alamat Lengkap" value={profile?.alamat} className="sm:col-span-2" />
        </div>
      </section>

      {/* Danger Zone: Hapus Akun */}
      <section className="bg-red-50/50 border border-red-200/60 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-display font-semibold text-red-900 text-base sm:text-lg">
            Hapus Akun Industri
          </h3>
          <p className="text-xs sm:text-sm text-red-700/80 mt-0.5">
            Tindakan ini permanen. Seluruh profil perusahaan dan riwayat pengiriman kamu akan dihapus.
          </p>
        </div>
        <button
          onClick={() => setIsDeleteOpen(true)}
          className="text-xs font-semibold px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shrink-0 cursor-pointer"
        >
          Hapus Akun
        </button>
      </section>

      {/* MODAL KONFIRMASI PEMBAYARAN B3 */}
      {selectedPayShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
          <div className="bg-paper border border-amber-200 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="font-display font-semibold text-lg text-amber-900 mb-1">
              Konfirmasi Pembayaran Limbah B3
            </h3>
            <p className="text-xs text-ink/60 mb-4">
              Silakan transfer sesuai tagihan dan unggah foto bukti transfer.
            </p>

            <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-xs space-y-1.5 mb-4">
              <p><strong>Item:</strong> {selectedPayShipment.nama_limbah}</p>
              <p><strong>Total Tagihan:</strong> Rp {(selectedPayShipment.biaya_pengolahan || 0).toLocaleString("id-ID")}</p>
              <p><strong>Rekening Bank:</strong> {REKENING_PEMBAYARAN_B3}</p>
            </div>

            <form onSubmit={handleKonfirmasiPembayaran} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-ink">Upload Bukti Transfer</label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  required
                  onChange={(e) => setBuktiBayarFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-ink/80 border border-ink/20 rounded-xl p-2 bg-white file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:bg-amber-100 file:text-amber-800"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPayShipment(null)}
                  className="text-xs font-semibold px-4 py-2 text-ink/60 hover:text-ink cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPaying || !buktiBayarFile}
                  className="text-xs font-bold px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
                >
                  {isPaying ? "Mengirim..." : "Kirim Bukti Pembayaran"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL UBAH PROFIL INDUSTRI */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest/40 backdrop-blur-xs p-4">
          <div className="bg-paper border border-forest/10 rounded-2xl max-w-lg w-full p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <h3 className="font-display font-semibold text-xl text-forest mb-4">
              Ubah Data Industri
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs text-ink/60 mb-1">Nama Perusahaan</label>
                <input
                  type="text"
                  required
                  value={editForm.nama_perusahaan}
                  onChange={(e) =>
                    setEditForm({ ...editForm, nama_perusahaan: e.target.value })
                  }
                  className="w-full text-sm bg-cream/50 border border-forest/20 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-forest"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-ink/60 mb-1">NPWP</label>
                  <input
                    type="text"
                    required
                    value={editForm.npwp}
                    onChange={(e) =>
                      setEditForm({ ...editForm, npwp: e.target.value })
                    }
                    className="w-full text-sm bg-cream/50 border border-forest/20 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-forest"
                  />
                </div>
                <div>
                  <label className="block text-xs text-ink/60 mb-1">Nomor Telepon</label>
                  <input
                    type="text"
                    required
                    value={editForm.telepon}
                    onChange={(e) =>
                      setEditForm({ ...editForm, telepon: e.target.value })
                    }
                    className="w-full text-sm bg-cream/50 border border-forest/20 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-forest"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-ink/60 mb-1">Provinsi</label>
                  <input
                    type="text"
                    value={editForm.provinsi}
                    onChange={(e) =>
                      setEditForm({ ...editForm, provinsi: e.target.value })
                    }
                    className="w-full text-sm bg-cream/50 border border-forest/20 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-forest"
                  />
                </div>
                <div>
                  <label className="block text-xs text-ink/60 mb-1">Kota / Kabupaten</label>
                  <input
                    type="text"
                    value={editForm.kota_kabupaten}
                    onChange={(e) =>
                      setEditForm({ ...editForm, kota_kabupaten: e.target.value })
                    }
                    className="w-full text-sm bg-cream/50 border border-forest/20 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-forest"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-ink/60 mb-1">Alamat Lengkap</label>
                <textarea
                  rows={3}
                  value={editForm.alamat}
                  onChange={(e) =>
                    setEditForm({ ...editForm, alamat: e.target.value })
                  }
                  className="w-full text-sm bg-cream/50 border border-forest/20 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-forest resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-forest/10">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="text-xs font-semibold px-4 py-2.5 text-ink/60 hover:text-ink cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="text-xs font-semibold px-4 py-2.5 bg-forest text-cream rounded-xl hover:bg-forest/90 disabled:opacity-50 cursor-pointer"
                >
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
            <h3 className="font-display font-semibold text-xl text-red-900 mb-2">
              Konfirmasi Hapus Akun
            </h3>
            <p className="text-sm text-ink/70 mb-6">
              Apakah kamu yakin ingin menghapus akun industri ini? Semua data profil dan riwayat penjemputan limbah kamu akan dihapus permanen.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="text-xs font-semibold px-4 py-2.5 text-ink/60 hover:text-ink cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="text-xs font-semibold px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                {deleteLoading ? "Menghapus..." : "Ya, Hapus Akun"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PENCAIRAN KREDIT */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
          <div className="bg-paper rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col transform transition-all">

            {!withdrawSuccess ? (
              <>
                <div className="px-6 py-4 border-b border-forest/10 flex justify-between items-center bg-forest text-cream">
                  <h3 className="font-display font-semibold text-lg">Pencairan Token</h3>
                  <button onClick={() => setIsWithdrawModalOpen(false)} className="hover:text-gold transition-colors cursor-pointer">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                  </button>
                </div>

                <form onSubmit={handlePencairan} className="p-6 space-y-4">
                  <div className="bg-gold/10 border border-gold/20 rounded-xl p-3 text-center mb-2">
                    <p className="text-xs text-ink/60 mb-0.5">Saldo Tersedia</p>
                    <p className="text-lg font-bold text-gold-dark">{totalKredit.toLocaleString("id-ID")} Token</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-ink">Jumlah Token</label>
                    <input
                      type="number"
                      className="block w-full text-sm text-ink border border-ink/20 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-gold bg-white"
                      placeholder="Masukkan jumlah"
                      value={formWithdraw.jumlah_token}
                      onChange={(e) => setFormWithdraw({ ...formWithdraw, jumlah_token: e.target.value })}
                      required
                      min="100"
                      max={totalKredit}
                    />
                    <div className="flex justify-between mt-1 px-1">
                      <p className="text-[10px] text-ink/50">Min. 100 Token</p>
                      <p className="text-[10px] font-medium text-green">
                        Est: Rp {estimasiRupiah.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-ink">Pilih Tujuan Pencairan</label>
                    <select
                      className="block w-full text-sm text-ink border border-ink/20 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-gold bg-white"
                      value={formWithdraw.metode}
                      onChange={(e) => setFormWithdraw({ ...formWithdraw, metode: e.target.value })}
                    >
                      <option value="Bank Transfer">Bank Transfer (BCA, BNI, BRI)</option>
                      <option value="GoPay">GoPay</option>
                      <option value="DANA">DANA</option>
                      <option value="OVO">OVO</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-ink">Nomor Rekening / E-Wallet</label>
                    <input
                      type="text"
                      className="block w-full text-sm text-ink border border-ink/20 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-gold bg-white"
                      placeholder="Contoh: 081200000000"
                      value={formWithdraw.nomor_rekening}
                      onChange={(e) => setFormWithdraw({ ...formWithdraw, nomor_rekening: e.target.value })}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isWithdrawing || !formWithdraw.jumlah_token || !formWithdraw.nomor_rekening}
                    className="w-full bg-gold text-forest mt-2 py-2.5 rounded-xl text-sm font-bold hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:bg-gray-300 disabled:text-gray-500 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isWithdrawing ? (
                      <>
                        <span className="w-4 h-4 border-2 border-forest border-t-transparent rounded-full animate-spin"></span>
                        Memproses...
                      </>
                    ) : (
                      "Cairkan Sekarang"
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="p-8 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-16 h-16 bg-green/10 text-green rounded-full flex items-center justify-center mb-2">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-display font-bold text-xl text-forest">Pencairan Berhasil!</h3>
                <p className="text-sm text-ink/60">
                  Dana sebesar <strong className="text-ink">Rp {(Number(formWithdraw.jumlah_token) * 500).toLocaleString("id-ID")}</strong> sedang diproses ke {formWithdraw.metode} kamu.
                </p>
              </div>
            )}

          </div>
        </div>
      )}

      {/* POP-UP MODAL KIRIM LIMBAH BIASA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
          <div className="bg-paper rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">

            <div className="px-6 py-4 border-b border-forest/10 flex justify-between items-center shrink-0">
              <h3 className="font-display font-semibold text-forest text-lg">Formulir Penjemputan Limbah Biasa</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-forest/5 text-ink/40 hover:text-ink transition-colors cursor-pointer"
                aria-label="Tutup"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleKirimLimbah} className="p-6 space-y-4 overflow-y-auto">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs leading-relaxed">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5 text-ink">Nama Limbah</label>
                <input
                  type="text"
                  className="block w-full text-sm text-ink border border-ink/20 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-green bg-white"
                  placeholder="Contoh: Limbah Plastik Cair"
                  value={formLimbah.nama_limbah}
                  onChange={(e) => setFormLimbah({ ...formLimbah, nama_limbah: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-ink">Perkiraan Berat (kg)</label>
                <input
                  type="number"
                  className="block w-full text-sm text-ink border border-ink/20 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-green bg-white"
                  placeholder="0"
                  value={formLimbah.berat}
                  onChange={(e) => setFormLimbah({ ...formLimbah, berat: e.target.value })}
                  required
                  min="1"
                />

                <div className={`mt-2 p-3 rounded-xl border flex items-center justify-between transition-colors ${
                  estimasiKredit > 0 ? 'bg-gold/10 border-gold/30' : 'bg-forest/5 border-forest/10'
                }`}>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-ink/50 mb-0.5">Potensi Pendapatan</p>
                    <p className="text-xs text-ink/70">Estimasi token yang didapat</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-display font-bold text-lg ${estimasiKredit > 0 ? 'text-gold-dark' : 'text-ink/40'}`}>
                      +{estimasiKredit.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-ink">Detail Lokasi Penjemputan</label>
                <textarea
                  className="block w-full text-sm text-ink border border-ink/20 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-green bg-white resize-none"
                  rows={3}
                  placeholder="Jalan, No. Gedung, Patokan (Otomatis Kapital)"
                  value={formLimbah.lokasi}
                  onChange={(e) => setFormLimbah({ ...formLimbah, lokasi: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-ink">Upload Foto Limbah</label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  className="block w-full text-sm text-ink/80 border border-ink/20 rounded-xl p-2 focus:outline-none focus:ring-1 focus:ring-green bg-white file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-green/10 file:text-green hover:file:bg-green/20"
                  onChange={(e) => setFormLimbah({ ...formLimbah, foto: e.target.files?.[0] || null })}
                  required
                />
                <p className="text-[11px] text-ink/50 mt-1">Format dukungan: JPG, JPEG, PNG.</p>
              </div>

              <div className="pt-4 mt-2 border-t border-forest/10 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-ink/60 hover:text-ink transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-forest text-cream px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-forest/90 transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-cream border-t-transparent rounded-full animate-spin"></span>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    "Kirim Jadwal"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POP-UP MODAL PENGOLAHAN LIMBAH B3 */}
      {isB3ModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
          <div className="bg-paper rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">

            <div className="px-6 py-4 border-b border-amber-200 bg-amber-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-display font-semibold text-amber-900 text-lg">Formulir Pendaftaran Limbah B3</h3>
                <p className="text-xs text-amber-700">Daftarkan limbah B3 terlebih dahulu untuk mendapatkan rincian tagihan.</p>
              </div>
              <button
                onClick={() => setIsB3ModalOpen(false)}
                className="p-1 rounded-lg hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                aria-label="Tutup"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleKirimLimbahB3} className="p-6 space-y-4 overflow-y-auto">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs leading-relaxed">
                  {errorMsg}
                </div>
              )}

              {/* KOTAK INFORMASI REKENING TUJUAN HARDCODED */}
              <div className="p-3.5 bg-amber-100/70 border border-amber-300 rounded-xl text-xs text-amber-900 space-y-1">
                <p className="font-semibold text-amber-950 flex items-center gap-1.5">
                  <svg className="w-4 h-4 shrink-0 text-amber-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Informasi Rekening Pembayaran
                </p>
                <p className="text-amber-800">
                  Pembayaran dilakukan via Transfer Bank ke:
                </p>
                <p className="font-mono font-bold text-sm text-amber-950 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 inline-block mt-0.5">
                  {REKENING_PEMBAYARAN_B3}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-ink">Pilih Kategori Limbah B3</label>
                <select
                  value={formB3.kategori_id}
                  onChange={(e) => setFormB3({ ...formB3, kategori_id: e.target.value })}
                  className="block w-full text-sm text-ink border border-ink/20 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                >
                  {KATEGORI_B3.map((kat) => (
                    <option key={kat.id} value={kat.id}>
                      {kat.nama} (Rp {kat.tarif.toLocaleString("id-ID")}/kg)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-ink">Nama / Deskripsi Spesifik Limbah</label>
                <input
                  type="text"
                  className="block w-full text-sm text-ink border border-ink/20 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                  placeholder="Contoh: Sludge Hasil Filtrasi Pabrik"
                  value={formB3.nama_limbah}
                  onChange={(e) => setFormB3({ ...formB3, nama_limbah: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-ink">Perkiraan Berat Total (kg)</label>
                <input
                  type="number"
                  className="block w-full text-sm text-ink border border-ink/20 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                  placeholder="0"
                  value={formB3.berat}
                  onChange={(e) => setFormB3({ ...formB3, berat: e.target.value })}
                  required
                  min="1"
                />

                <div className="mt-2 p-3 rounded-xl border bg-amber-50/80 border-amber-200 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-amber-800 mb-0.5">Estimasi Biaya Pengolahan</p>
                    <p className="text-xs text-amber-900/70">Dapat dibayar setelah pendaftaran</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-lg text-amber-900">
                      Rp {estimasiBiayaB3.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-ink">Detail Lokasi Penjemputan</label>
                <textarea
                  className="block w-full text-sm text-ink border border-ink/20 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white resize-none"
                  rows={3}
                  placeholder="Jalan, No. Gedung, Patokan (Otomatis Kapital)"
                  value={formB3.lokasi}
                  onChange={(e) => setFormB3({ ...formB3, lokasi: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-ink">Upload Foto Dokumentasi Limbah B3</label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  className="block w-full text-sm text-ink/80 border border-ink/20 rounded-xl p-2 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200"
                  onChange={(e) => setFormB3({ ...formB3, foto: e.target.files?.[0] || null })}
                  required
                />
                <p className="text-[11px] text-ink/50 mt-1">Format dukungan: JPG, JPEG, PNG.</p>
              </div>

              <div className="pt-4 mt-2 border-t border-forest/10 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsB3ModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-ink/60 hover:text-ink transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Mendaftarkan...</span>
                    </>
                  ) : (
                    "Daftarkan Sekarang"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Assistant Floating Widget */}
      <AIAssistant />
    </div>
  );
}