"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const navItems = [
  {
    href: "#ringkasan",
    label: "Ringkasan",
    icon: (
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12 12 3l9 9" />
        <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
      </svg>
    ),
  },
  {
    href: "#pesan-stok",
    label: "Pesan Stok",
    icon: (
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8 12 3 3 8l9 5 9-5Z" />
        <path d="M3 8v8l9 5 9-5V8" />
        <path d="M12 13v8" />
      </svg>
    ),
  },
  {
    href: "#status-pesanan",
    label: "Status Pesanan",
    icon: (
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    href: "#profil-mitra",
    label: "Profil Mitra",
    icon: (
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
      </svg>
    ),
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function DashboardSidebar({ isOpen = false, onClose }: SidebarProps) {
  const router = useRouter();
  const [mitraName, setMitraName] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;

      const role = data.user.app_metadata?.role;
      let namaTampil = data.user.email ?? "Pengguna";

      if (role === 'agen') {
        const { data: profile } = await supabase
          .from("agen")
          .select("nama_agen")
          .eq("auth_id", data.user.id)
          .maybeSingle();
        if (profile?.nama_agen) namaTampil = profile.nama_agen;
      }
      else if (role === 'perusahaan') {
        const { data: profile } = await supabase
          .from("perusahaan_industri")
          .select("nama_perusahaan")
          .eq("auth_id", data.user.id)
          .maybeSingle();
        if (profile?.nama_perusahaan) namaTampil = profile.nama_perusahaan;
      } else {
        // Fallback untuk akun Mitra default
        const { data: profile } = await supabase
          .from("mitra_profiles")
          .select("nama_mitra")
          .eq("user_id", data.user.id)
          .maybeSingle();
        if (profile?.nama_mitra) namaTampil = profile.nama_mitra;
      }

      setMitraName(namaTampil);
    });
  }, []);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/masuk");
    router.refresh();
  }

  return (
    <>
      {/* Backdrop Gelap saat Mobile Sidebar Terbuka */}
      {isOpen && (
        <div
          onClick={onClose}
          className="md:hidden fixed inset-0 bg-ink/60 z-40 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Drawer Sidebar: Nempel rata dari ujung atas sampai ujung bawah */}
      <aside
        className={`fixed md:sticky top-0 left-0 bottom-0 z-50 h-screen w-72 bg-forest text-cream flex flex-col justify-between p-6 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Header Mobile Drawer */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-cream/10">
            <div>
              <span className="font-display font-semibold text-lg tracking-tight text-cream">
                LENTERA
              </span>
              <p className="text-xs text-cream/45 mt-0.5">Portal Mitra</p>
            </div>

            {/* Tombol Close (X) */}
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg hover:bg-cream/10 text-cream/70 hover:text-cream transition-colors"
              aria-label="Tutup Menu"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Menu Navigasi */}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-cream/70 hover:text-cream hover:bg-cream/10 transition-colors"
              >
                {item.icon}
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        {/* User Info & Logout Button */}
        <div className="pt-6 border-t border-cream/10 space-y-2">
          {mitraName && (
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center font-display font-semibold text-xs shrink-0">
                {mitraName.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm font-medium text-cream/90 truncate">{mitraName}</p>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-cream/70 hover:text-cream hover:bg-cream/10 transition-colors w-full text-left cursor-pointer"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17 21 12 16 7" />
              <path d="M21 12H9" />
            </svg>
            Keluar
          </button>
        </div>
      </aside>
    </>
  );
}