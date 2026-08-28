"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { ProductCard } from "./product-card";
import { AIAssistant } from "@/components/ai-assistant";

interface MitraProfile {
  nama_mitra: string;
  nik_nib: string;
  alamat: string;
  telepon: string;
  provinsi?: string;
  kota?: string;
  created_at: string;
}

interface DisplayProduct {
  id: string;
  nama: string;
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
      <p className="text-forest font-medium text-sm sm:text-base">{value || "-"}</p>
    </div>
  );
}

export default function DashboardMitraPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<MitraProfile | null>(null);
  const [products, setProducts] = useState<DisplayProduct[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        router.replace("/masuk");
        return;
      }
      setEmail(authData.user.email ?? null);

      // 1. Ambil Profil Mitra
      const { data: profileData } = await supabase
        .from("mitra_profiles")
        .select("nama_mitra, nik_nib, alamat, telepon, provinsi, kota, created_at")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      setProfile(profileData);

      // 2. Ambil Produk & Harga Regional
      const { data: rawProducts, error: prodError } = await supabase
        .from("products")
        .select(`
          id,
          nama_produk,
          deskripsi,
          satuan,
          harga_default,
          stok_dummy,
          regional_product_prices(*)
        `)
        .order("created_at", { ascending: false });

      const { data: allRegionalPrices } = await supabase
        .from("regional_product_prices")
        .select("*");

      if (prodError) {
        console.error("Gagal mengambil data produk:", prodError.message);
      }

      if (rawProducts) {
        const cleanCityName = (str: string) => {
          if (!str) return "";
          return str
            .toUpperCase()
            .replace(/KOTA/g, "")
            .replace(/KABUPATEN/g, "")
            .replace(/KAB\./g, "")
            .replace(/KAB/g, "")
            .replace(/[^A-Z0-9]/g, "")
            .trim();
        };

        const rawLocationText = profileData?.kota || profileData?.alamat || "";
        const userKotaClean = cleanCityName(rawLocationText);

        const filteredProducts: DisplayProduct[] = [];

        rawProducts.forEach((p: RawProduct) => {
          const regionalPricesList = [
            ...(p.regional_product_prices || []),
            ...(allRegionalPrices?.filter((rp) => rp.product_id === p.id) || []),
          ];

          const regionalMatch = regionalPricesList.find((rp: RegionalPrice) => {
            const rpKotaClean = cleanCityName(rp.kota || "");
            if (!rpKotaClean || !userKotaClean) return false;

            return (
              rpKotaClean === userKotaClean ||
              userKotaClean.includes(rpKotaClean) ||
              rpKotaClean.includes(userKotaClean)
            );
          });

          if (regionalMatch) {
            filteredProducts.push({
              id: p.id,
              nama: p.nama_produk,
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
    ? new Date(profile.created_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  return (
    <div className="px-4 sm:px-6 md:px-12 py-6 md:py-12 max-w-5xl w-full mx-auto relative">
      {/* Ringkasan */}
      <section id="ringkasan" className="scroll-mt-8 mb-10 md:mb-16">
        <p className="font-mono text-xs tracking-widest uppercase text-green mb-2 sm:mb-3">
          Ringkasan
        </p>
        <h1 className="font-display font-semibold text-xl sm:text-2xl md:text-3xl text-forest mb-2">
          Selamat datang, {profile?.nama_mitra ?? "Mitra"}
        </h1>
        <p className="text-ink/60 text-sm sm:text-base mb-6 md:mb-8">
          Pantau stok dan kelola profil kemitraan kamu di sini.
        </p>

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
            <p className="font-display font-semibold text-forest text-base sm:text-lg">
              {joinedLabel}
            </p>
          </div>
        </div>
      </section>

      {/* Pesan Stok */}
      <section id="pesan-stok" className="scroll-mt-8 mb-10 md:mb-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 sm:mb-3 gap-2">
          <div>
            <p className="font-mono text-xs tracking-widest uppercase text-gold mb-1">
              Pesan stok
            </p>
            <h2 className="font-display font-semibold text-xl sm:text-2xl text-forest">
              Pesan bahan energi
            </h2>
          </div>
          {(profile?.kota || profile?.alamat) && (
            <span className="text-xs bg-forest/10 text-forest font-medium px-3 py-1 rounded-full border border-forest/20">
              Wilayah: {profile.kota || "PALEMBANG"}
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

      {/* Profil Mitra */}
      <section id="profil-mitra" className="scroll-mt-8">
        <p className="font-mono text-xs tracking-widest uppercase text-clay mb-2 sm:mb-3">
          Profil mitra
        </p>
        <h2 className="font-display font-semibold text-xl sm:text-2xl text-forest mb-4 sm:mb-6">
          Informasi mitra
        </h2>
        <div className="bg-paper rounded-2xl border border-forest/10 p-5 sm:p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 shadow-xs">
          <InfoRow label="Nama mitra" value={profile?.nama_mitra} />
          <InfoRow label="Email" value={email} />
          <InfoRow label="NIK / NIB" value={profile?.nik_nib} />
          <InfoRow label="Nomor telepon" value={profile?.telepon} />
          <InfoRow
            label="Wilayah Operasional"
            value={profile?.kota ? `${profile.kota}, ${profile.provinsi}` : "PALEMBANG"}
          />
          <InfoRow
            label="Alamat lengkap"
            value={profile?.alamat}
            className="sm:col-span-2"
          />
        </div>
      </section>

      {/* AI Assistant Floating Widget */}
      <AIAssistant />
    </div>
  );
}