"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

interface IndustriProfile {
  nama_perusahaan: string;
  npwp: string;
  alamat: string;
  telepon: string;
  created_at: string;
}

interface WasteShipment {
  id: string;
  nama_limbah: string;
  perkiraan_berat: number;
  lokasi_penjemputan: string;
  status: string;
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
      <p className="text-forest font-medium">{value || "-"}</p>
    </div>
  );
}

export default function DashboardIndustriPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<IndustriProfile | null>(null);
  
  // State untuk fitur pengiriman & tracking
  const [totalTerkirim, setTotalTerkirim] = useState(0);
  const [shipments, setShipments] = useState<WasteShipment[]>([]);
  
  // State untuk Modal / Pop-up
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formLimbah, setFormLimbah] = useState({
    nama_limbah: "",
    berat: "",
    lokasi: "",
    foto: null as File | null,
  });

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    const supabase = createSupabaseBrowserClient();

    const fetchTrackingData = async (userId: string) => {
      const { data } = await supabase
        .from("waste_shipments")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (data) {
        setShipments(data);
        const total = data
          .filter((s) => s.status.toLowerCase() === "selesai")
          .reduce((sum, s) => sum + Number(s.perkiraan_berat), 0);
        setTotalTerkirim(total);
      }
    };

    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.replace("/masuk");
        return;
      }
      setEmail(data.user.email ?? null);

      const { data: profileData } = await supabase
        .from("industri_profiles")
        .select("nama_perusahaan, npwp, alamat, telepon, created_at")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (!profileData) {
        router.replace("/masuk");
        return;
      }

      setProfile(profileData);
      fetchTrackingData(data.user.id);
      setLoading(false);

      // Auto-update setiap 5 menit
      intervalId = setInterval(() => {
        fetchTrackingData(data.user.id);
      }, 300000);
    });

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [router]);

  async function handleKirimLimbah(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Sesi tidak valid");

      let fotoUrl = "";
      if (formLimbah.foto) {
        const fileExt = formLimbah.foto.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('waste_images')
          .upload(`limbah/${fileName}`, formLimbah.foto);

        if (uploadError) {
            alert(`Error upload foto: ${uploadError.message}. Pastikan bucket 'waste_images' sudah dibuat!`);
            throw uploadError;
        }

        const { data: publicUrlData } = supabase.storage
          .from('waste_images')
          .getPublicUrl(`limbah/${fileName}`);
        
        fotoUrl = publicUrlData.publicUrl;
      }

      const { error: insertError } = await supabase.from("waste_shipments").insert({
        user_id: user.id,
        nama_limbah: formLimbah.nama_limbah,
        perkiraan_berat: Number(formLimbah.berat),
        lokasi_penjemputan: formLimbah.lokasi.toUpperCase(), // Otomatis capslock
        foto_url: fotoUrl,
        status: "Menunggu Penjemputan",
      });

      if (insertError) throw insertError;

      // Sukses: Reset form, tutup modal, dan perbarui data tabel
      setFormLimbah({ nama_limbah: "", berat: "", lokasi: "", foto: null });
      setIsModalOpen(false); 
      
      const { data: newData } = await supabase
        .from("waste_shipments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (newData) setShipments(newData);

      alert("Limbah berhasil dikirim!");
    } catch (err) {
      console.error(err);
      // Hapus alert error generik, biarkan error Supabase yang spesifik muncul di log
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-ink/40 text-sm">Memuat...</p>
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

  return (
    <div className="px-6 md:px-12 py-10 md:py-12 max-w-5xl relative">
      {/* Ringkasan */}
      <section id="ringkasan" className="scroll-mt-8 mb-10">
        <p className="font-mono text-xs tracking-widest uppercase text-green mb-3">
          Ringkasan
        </p>
        <h1 className="font-display font-semibold text-2xl md:text-3xl text-forest mb-2">
          Selamat datang, {profile?.nama_perusahaan ?? "Industri"}
        </h1>
        <p className="text-ink/60 mb-8">
          Pantau ringkasan kemitraan industri kamu dengan LENTERA di sini.
        </p>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-paper rounded-2xl border border-forest/10 p-5">
            <p className="text-xs text-ink/45 mb-1.5">Status akun</p>
            <p className="font-display font-semibold text-forest text-lg">Aktif</p>
          </div>
          <div className="bg-paper rounded-2xl border border-forest/10 p-5">
            <p className="text-xs text-ink/45 mb-1.5">Total limbah terkirim</p>
            <p className="font-display font-semibold text-forest text-lg">
              {totalTerkirim.toLocaleString("id-ID")} kg
            </p>
          </div>
          <div className="bg-paper rounded-2xl border border-forest/10 p-5">
            <p className="text-xs text-ink/45 mb-1.5">Bergabung sejak</p>
            <p className="font-display font-semibold text-forest text-lg">{joinedLabel}</p>
          </div>
        </div>
      </section>

      {/* Profil Industri */}
      <section id="profil-industri" className="scroll-mt-8 mb-10">
        <h2 className="font-display font-semibold text-xl text-forest mb-6">
          Informasi industri
        </h2>
        <div className="bg-paper rounded-2xl border border-forest/10 p-6 md:p-8 grid sm:grid-cols-2 gap-6">
          <InfoRow label="Nama perusahaan" value={profile?.nama_perusahaan} />
          <InfoRow label="Email" value={email} />
          <InfoRow label="NPWP" value={profile?.npwp} />
          <InfoRow label="Nomor telepon" value={profile?.telepon} />
          <InfoRow label="Alamat lengkap" value={profile?.alamat} className="sm:col-span-2" />
        </div>
      </section>

      {/* Lacak Pengiriman (Header dengan Tombol Tambah) */}
      <section id="lacak-pengiriman" className="scroll-mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="font-display font-semibold text-xl text-forest mb-1">Status Pengiriman</h2>
            <p className="text-xs text-ink/60">Sistem diperbarui otomatis (Auto-update: Aktif)</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-forest text-paper px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-forest/90 transition-colors shadow-sm"
          >
            + Buat Jadwal Penjemputan
          </button>
        </div>
        
        {shipments.length === 0 ? (
          <div className="bg-paper rounded-2xl border border-forest/10 p-10 text-center">
            <p className="text-ink/60">Belum ada riwayat pengiriman limbah.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {shipments.map((shipment) => (
              <div key={shipment.id} className="bg-paper rounded-2xl border border-forest/10 p-5 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <h5 className="font-semibold text-forest">{shipment.nama_limbah}</h5>
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                      shipment.status.toLowerCase() === 'selesai' ? 'bg-green/10 text-green' 
                    : shipment.status.toLowerCase() === 'diperjalanan' ? 'bg-blue-100 text-blue-700'
                    : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {shipment.status}
                  </span>
                </div>
                <div className="text-sm text-ink/70 space-y-1.5 mb-4 flex-1">
                  <p><strong className="font-medium text-ink">Berat:</strong> {shipment.perkiraan_berat} kg</p>
                  <p><strong className="font-medium text-ink">Lokasi:</strong> {shipment.lokasi_penjemputan}</p>
                </div>
                <p className="text-xs text-ink/40 border-t border-forest/10 pt-3 mt-auto">
                  Dibuat pada: {new Date(shipment.created_at).toLocaleString("id-ID")}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* POP-UP MODAL KIRIM LIMBAH */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
          <div className="bg-paper rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            
            {/* Header Modal */}
            <div className="sticky top-0 bg-paper z-10 px-6 py-4 border-b border-forest/10 flex justify-between items-center">
              <h3 className="font-display font-semibold text-forest text-lg">Formulir Kirim Limbah</h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-ink/40 hover:text-red-500 transition-colors text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Body Modal / Form */}
            <form onSubmit={handleKirimLimbah} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-ink">Nama Limbah</label>
                <input 
                  type="text" 
                  className="block w-full text-sm text-ink/80 border border-ink/20 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-green bg-white"
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
                  className="block w-full text-sm text-ink/80 border border-ink/20 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-green bg-white"
                  placeholder="0"
                  value={formLimbah.berat} 
                  onChange={(e) => setFormLimbah({ ...formLimbah, berat: e.target.value })} 
                  required 
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-ink">Detail Lokasi Penjemputan</label>
                <textarea 
                  className="block w-full text-sm text-ink/80 border border-ink/20 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-green bg-white"
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
                  className="block w-full text-sm text-ink/80 border border-ink/20 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-green bg-white file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green/10 file:text-green hover:file:bg-green/20"
                  onChange={(e) => setFormLimbah({ ...formLimbah, foto: e.target.files?.[0] || null })} 
                  required 
                />
                <p className="text-[11px] text-ink/50 mt-1">Format: JPG, JPEG, PNG.</p>
              </div>

              {/* Footer Modal */}
              <div className="pt-4 mt-2 border-t border-forest/10 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-ink/60 hover:text-ink transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-green text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Memproses..." : "Kirim Jadwal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}