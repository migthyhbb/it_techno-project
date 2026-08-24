"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

interface MitraProfile {
  nama_mitra: string;
  nik_nib: string;
  alamat: string;
  telepon: string;
  created_at: string;
}

export default function DashboardMitraPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<MitraProfile | null>(null);
  
  // State untuk harga dinamis dari admin berdasarkan wilayah mitra
  const [mitraKota, setMitraKota] = useState<string>("");
  const [basePrice, setBasePrice] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.replace("/masuk");
        return;
      }
      setEmail(data.user.email ?? null);

      // 1. Ambil Profil Mitra
      const { data: profileData } = await supabase
        .from("mitra_profiles")
        .select("nama_mitra, nik_nib, alamat, telepon, created_at")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (!profileData) {
        router.replace("/masuk");
        return;
      }

      setProfile(profileData);

      // 2. Ekstrak Kota dari Alamat Mitra (Format: "Detail, KOTA, PROVINSI")
      if (profileData.alamat) {
        const parts = profileData.alamat.split(",");
        if (parts.length >= 2) {
          const kotaName = parts[1].trim();
          setMitraKota(kotaName);

          // 3. Tarik Harga dari Tabel regional_prices (Admin) berdasarkan Kota
          const { data: priceData } = await supabase
            .from("regional_prices")
            .select("harga_per_kg")
            .ilike("kota", `%${kotaName}%`)
            .maybeSingle();

          if (priceData && priceData.harga_per_kg) {
            setBasePrice(priceData.harga_per_kg);
          }
        }
      }

      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-ink/40 text-sm">Memuat Dashboard Mitra...</p>
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

  // Fungsi helper untuk menghitung harga dinamis atau kisaran berdasarkan harga admin
  // Jika harga admin X, kita buat kisaran (X - 3000) sampai X
  const getDisplayPrice = (defaultPrice: number, multiplier: number = 1) => {
    if (!basePrice) return `Rp ${defaultPrice.toLocaleString("id-ID")}`;
    
    const adjustedBase = basePrice * multiplier;
    const minRange = adjustedBase - 3000;
    const maxRange = adjustedBase;
    
    return `Rp ${minRange.toLocaleString("id-ID")} - Rp ${maxRange.toLocaleString("id-ID")}`;
  };

  return (
    <div className="px-6 md:px-12 py-10 md:py-12 max-w-5xl">
      
      {/* Ringkasan */}
      <section id="ringkasan" className="scroll-mt-8 mb-10">
        <p className="font-mono text-xs tracking-widest uppercase text-green mb-3">
          Ringkasan Mitra
        </p>
        <h1 className="font-display font-semibold text-2xl md:text-3xl text-forest mb-2">
          Selamat datang, {profile?.nama_mitra ?? "Mitra"}
        </h1>
        <p className="text-ink/60 mb-2">
          Pantau stok di titikmu dan ajukan permintaan stok ulang langsung ke LENTERA.
        </p>
        {mitraKota && (
          <p className="text-xs text-green font-medium">
            📍 Wilayah Penyesuaian Harga: <span className="uppercase">{mitraKota}</span> {basePrice ? "(Sinkron dengan Admin)" : "(Menggunakan Harga Standar)"}
          </p>
        )}
      </section>

      {/* Katalog Produk dengan Harga Dinamis */}
      <section className="mb-12">
        <div className="grid sm:grid-cols-2 gap-6">
          
          {/* Card 1 */}
          <div className="bg-paper rounded-2xl border border-forest/10 p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-display font-semibold text-forest text-lg">Briket Energi LENTERA 5kg</h3>
                <span className="bg-green/10 text-green text-xs font-semibold px-2.5 py-1 rounded-full">128 karung</span>
              </div>
              <p className="text-xs text-ink/50 mb-4">Briket padat siap distribusikan</p>
            </div>
            <div>
              <p className="font-display font-semibold text-forest text-xl mb-1">
                {getDisplayPrice(45000, 1)} <span className="text-xs font-normal text-ink/60">/karung</span>
              </p>
              <p className="text-[11px] text-ink/45 mb-4">Stok aman di gudang mitra</p>
              <button 
                onClick={() => alert("Permintaan stok ulang Briket dikirim ke LENTERA!")}
                className="w-full bg-forest text-paper py-2.5 rounded-xl text-sm font-medium hover:bg-forest/90 transition-colors"
              >
                Pesan Ulang
              </button>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-paper rounded-2xl border border-forest/10 p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-display font-semibold text-forest text-lg">Pelet Biomassa 10kg</h3>
                <span className="bg-green/10 text-green text-xs font-semibold px-2.5 py-1 rounded-full">84 karung</span>
              </div>
              <p className="text-xs text-ink/50 mb-4">Pelet biomassa kualitas tinggi</p>
            </div>
            <div>
              <p className="font-display font-semibold text-forest text-xl mb-1">
                {getDisplayPrice(78000, 1.5)} <span className="text-xs font-normal text-ink/60">/karung</span>
              </p>
              <p className="text-[11px] text-ink/45 mb-4">Stok aman di gudang mitra</p>
              <button 
                onClick={() => alert("Permintaan stok ulang Pelet dikirim ke LENTERA!")}
                className="w-full bg-forest text-paper py-2.5 rounded-xl text-sm font-medium hover:bg-forest/90 transition-colors"
              >
                Pesan Ulang
              </button>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-paper rounded-2xl border border-forest/10 p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-display font-semibold text-forest text-lg">Tabung Energi Cair 20L</h3>
                <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-1 rounded-full">36 tabung</span>
              </div>
              <p className="text-xs text-ink/50 mb-4">Energi cair ramah lingkungan</p>
            </div>
            <div>
              <p className="font-display font-semibold text-forest text-xl mb-1">
                {getDisplayPrice(210000, 4)} <span className="text-xs font-normal text-ink/60">/tabung</span>
              </p>
              <p className="text-[11px] text-yellow-600 font-medium mb-4">Stok menipis, segera pesan</p>
              <button 
                onClick={() => alert("Permintaan stok ulang Tabung Cair dikirim ke LENTERA!")}
                className="w-full bg-forest text-paper py-2.5 rounded-xl text-sm font-medium hover:bg-forest/90 transition-colors"
              >
                Pesan Ulang
              </button>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-paper rounded-2xl border border-forest/10 p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-display font-semibold text-forest text-lg">Serbuk Biomassa Curah 25kg</h3>
                <span className="bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">19 karung</span>
              </div>
              <p className="text-xs text-ink/50 mb-4">Serbuk curah industri</p>
            </div>
            <div>
              <p className="font-display font-semibold text-forest text-xl mb-1">
                {getDisplayPrice(95000, 2)} <span className="text-xs font-normal text-ink/60">/karung</span>
              </p>
              <p className="text-[11px] text-red-600 font-medium mb-4">Segera pesan ulang</p>
              <button 
                onClick={() => alert("Permintaan stok ulang Serbuk Curah dikirim ke LENTERA!")}
                className="w-full bg-forest text-paper py-2.5 rounded-xl text-sm font-medium hover:bg-forest/90 transition-colors"
              >
                Pesan Ulang
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Profil Mitra */}
      <section id="profil-mitra" className="scroll-mt-8 mb-10">
        <h2 className="font-display font-semibold text-xl text-forest mb-6">
          Informasi mitra
        </h2>
        <div className="bg-paper rounded-2xl border border-forest/10 p-6 md:p-8 grid sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-ink/45 mb-1">Nama mitra</p>
            <p className="text-forest font-medium">{profile?.nama_mitra}</p>
          </div>
          <div>
            <p className="text-xs text-ink/45 mb-1">Email</p>
            <p className="text-forest font-medium">{email}</p>
          </div>
          <div>
            <p className="text-xs text-ink/45 mb-1">NIK / NIB</p>
            <p className="text-forest font-medium">{profile?.nik_nib}</p>
          </div>
          <div>
            <p className="text-xs text-ink/45 mb-1">Nomor telepon</p>
            <p className="text-forest font-medium">{profile?.telepon}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-ink/45 mb-1">Alamat lengkap</p>
            <p className="text-forest font-medium">{profile?.alamat}</p>
          </div>
        </div>
      </section>

    </div>
  );
}