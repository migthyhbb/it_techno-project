"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const navItems = [
  {
    href: "#ringkasan",
    label: "Ringkasan",
    icon: (
      <>
        <path d="M3 12 12 3l9 9" />
        <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
      </>
    ),
  },
  {
    href: "#pesan-stok",
    label: "Pesan Stok",
    icon: (
      <>
        <path d="M21 8 12 3 3 8l9 5 9-5Z" />
        <path d="M3 8v8l9 5 9-5V8" />
        <path d="M12 13v8" />
      </>
    ),
  },
  {
    href: "#profil-mitra",
    label: "Profil Mitra",
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
      </>
    ),
  },
];

export function DashboardSidebar() {
  const router = useRouter();
  const [mitraName, setMitraName] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

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
  }

  return (
    <>
      {/* 1. MOBILE TOP BAR (Tampil hanya di HP < md) */}
      <div className="md:hidden sticky top-0 z-40 bg-forest text-cream flex items-center justify-between px-4 py-3 border-b border-cream/10 w-full">
        <div>
          <span className="font-display font-semibold text-base tracking-tight block leading-none">
            LENTERA
          </span>
          <span className="text-[10px] text-cream/45">Portal Mitra</span>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
          className="p-2 text-cream/80 hover:text-cream rounded-lg focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* 2. MOBILE MENU DROPDOWN (Tampil saat Hamburger di-klik) */}
      {isOpen && (
        <div className="md:hidden sticky top-[53px] z-30 bg-forest text-cream border-b border-cream/10 px-4 py-4 space-y-3 w-full shadow-lg">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-cream/80 hover:text-cream hover:bg-cream/10"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 shrink-0"
                >
                  {item.icon}
                </svg>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="pt-3 border-t border-cream/10">
            {mitraName && (
              <div className="flex items-center gap-2.5 px-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-gold/20 text-gold flex items-center justify-center font-display font-semibold text-xs shrink-0">
                  {mitraName.charAt(0).toUpperCase()}
                </div>
                <p className="text-xs text-cream/80 truncate">{mitraName}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-red-300 hover:bg-cream/10 w-full"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 shrink-0"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17 21 12 16 7" />
                <path d="M21 12H9" />
              </svg>
              Keluar
            </button>
          </div>
        </div>
      )}

      {/* 3. DESKTOP SIDEBAR (Tampil di Layar Desktop >= md) */}
      <aside className="hidden md:flex w-64 shrink-0 bg-forest text-cream flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-cream/10">
          <span className="font-display font-semibold text-lg tracking-tight">
            LENTERA
          </span>
          <p className="text-xs text-cream/45 mt-1">Portal Mitra</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-cream/65 hover:text-cream hover:bg-cream/8 transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 shrink-0"
              >
                {item.icon}
              </svg>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="p-4 border-t border-cream/10">
          {mitraName && (
            <div className="flex items-center gap-3 px-2 mb-2 pb-3 border-b border-cream/10">
              <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center font-display font-semibold text-xs shrink-0">
                {mitraName.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm text-cream/80 truncate">{mitraName}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-cream/65 hover:text-cream hover:bg-cream/8 transition-colors w-full"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 shrink-0"
            >
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