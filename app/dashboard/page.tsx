"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { ProductCard } from "@/components/dashboard/product-card";
import { mitraProducts } from "@/lib/mitra-products";

interface MitraProfile {
  nama_mitra: string;
  nik_nib: string;
  alamat: string;
  telepon: string;
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

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<MitraProfile | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.replace("/masuk");
        return;
      }
      setEmail(data.user.email ?? null);

      const { data: profileData } = await supabase
        .from("mitra_profiles")
        .select("nama_mitra, nik_nib, alamat, telepon, created_at")
        .eq("user_id", data.user.id)
        .maybeSingle();

      setProfile(profileData);
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-ink/40 text-sm">Memuat...</p>
      </div>
    );
  }

  const lowStockCount = mitraProducts.filter((p) => p.stock < 25).length;
  const joinedLabel = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  return (
    <div className="px-6 md:px-12 py-10 md:py-12 max-w-5xl">
      {/* Ringkasan */}
      <section id="ringkasan" className="scroll-mt-8 mb-16">
        <p className="font-mono text-xs tracking-widest uppercase text-green mb-3">
          Ringkasan
        </p>
        <h1 className="font-display font-semibold text-2xl md:text-3xl text-forest mb-2">
          Selamat datang, {profile?.nama_mitra ?? "Mitra"}
        </h1>
        <p className="text-ink/60 mb-8">
          Pantau stok dan kelola profil kemitraan kamu di sini.
        </p>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-paper rounded-2xl border border-forest/10 p-5">
            <p className="text-xs text-ink/45 mb-1.5">Status akun</p>
            <p className="font-display font-semibold text-forest text-lg">Aktif</p>
          </div>
          <div className="bg-paper rounded-2xl border border-forest/10 p-5">
            <p className="text-xs text-ink/45 mb-1.5">Perlu di-restock</p>
            <p className="font-display font-semibold text-forest text-lg">
              {lowStockCount} item
            </p>
          </div>
          <div className="bg-paper rounded-2xl border border-forest/10 p-5">
            <p className="text-xs text-ink/45 mb-1.5">Bergabung sejak</p>
            <p className="font-display font-semibold text-forest text-lg">
              {joinedLabel}
            </p>
          </div>
        </div>
      </section>

      {/* Pesan Stok */}
      <section id="pesan-stok" className="scroll-mt-8 mb-16">
        <p className="font-mono text-xs tracking-widest uppercase text-gold mb-3">
          Pesan stok
        </p>
        <h2 className="font-display font-semibold text-2xl text-forest mb-2">
          Pesan ulang bahan energi
        </h2>
        <p className="text-ink/60 mb-8 max-w-lg">
          Pantau stok yang ada di titikmu dan ajukan permintaan stok ulang
          langsung ke LENTERA.
        </p>
        <div className="grid sm:grid-cols-2 gap-5">
          {mitraProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Profil Mitra */}
      <section id="profil-mitra" className="scroll-mt-8">
        <p className="font-mono text-xs tracking-widest uppercase text-clay mb-3">
          Profil mitra
        </p>
        <h2 className="font-display font-semibold text-2xl text-forest mb-6">
          Informasi mitra
        </h2>
        <div className="bg-paper rounded-2xl border border-forest/10 p-6 md:p-8 grid sm:grid-cols-2 gap-6">
          <InfoRow label="Nama mitra" value={profile?.nama_mitra} />
          <InfoRow label="Email" value={email} />
          <InfoRow label="NIK / NIB" value={profile?.nik_nib} />
          <InfoRow label="Nomor telepon" value={profile?.telepon} />
          <InfoRow
            label="Alamat lengkap"
            value={profile?.alamat}
            className="sm:col-span-2"
          />
        </div>
      </section>
    </div>
  );
}
