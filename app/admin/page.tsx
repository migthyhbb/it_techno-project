"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [nama, setNama] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.replace("/masuk");
        return;
      }

      const { data: adminRow } = await supabase
        .from("admin_profiles")
        .select("nama")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (!adminRow) {
        // Login valid tapi bukan akun admin — jangan biarkan lihat halaman ini.
        router.replace("/masuk");
        return;
      }

      setNama(adminRow.nama);
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <p className="text-ink/40 text-sm">Memuat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-6">
      <div className="text-center max-w-sm">
        <p className="font-mono text-xs tracking-widest uppercase text-green mb-3">
          Portal Admin
        </p>
        <h1 className="font-display font-semibold text-2xl text-forest mb-2">
          Halo, {nama}
        </h1>
        <p className="text-ink/60 text-sm leading-relaxed">
          Jalur login admin sudah berfungsi. Halaman dashboard admin
          sungguhan (data mitra & industri, dll) belum dibuat — ini baru
          placeholder untuk konfirmasi routing-nya jalan.
        </p>
      </div>
    </div>
  );
}
