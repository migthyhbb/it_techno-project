"use client";

import { useEffect, useState } from "react";
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
    href: "#status-pesanan",
    label: "Status Pesanan",
    icon: (
      <>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
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
    window.location.href = "/masuk";
  }

  return (
    <>
      {/* 1. MOBILE TOP BAR */}
      <div className="md:hidden sticky top-0 z-50 bg-forest text-cream flex items-center justify-between px-5 py-3.5 border-b border-cream/10 w-full shadow-sm">
        <div>
          <span className="font-display font-semibold text-base tracking-tight block leading-none">
            LENTERA
          </span>
          <span className="text-[10px] text-cream/45 font-mono uppercase tracking-wider">Portal Mitra</span>
        </div>

        {/* Dynamic Animated Hamburger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
          className="p-2 text-cream/80 hover:text-cream rounded-xl hover:bg-cream/10 transition-all duration-200 active:scale-95 focus:outline-none cursor-pointer"
        >
          <div className="w-5 h-5 flex flex-col justify-center items-center relative">
            <span
              className={`h-0.5 w-5 bg-current rounded-full transition-all duration-300 ease-in-out ${
                isOpen ? "rotate-45 translate-y-[2px]" : "-translate-y-1"
              }`}
            />
            <span
              className={`h-0.5 w-5 bg-current rounded-full transition-all duration-200 ease-in-out ${
                isOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`h-0.5 w-5 bg-current rounded-full transition-all duration-300 ease-in-out ${
                isOpen ? "-rotate-45 -translate-y-[2px]" : "translate-y-1"
              }`}
            />
          </div>
        </button>
      </div>

      {/* 2. MOBILE OVERLAY & SMOOTH SLIDE-DOWN DROPDOWN */}
      <div
        onClick={() => setIsOpen(false)}
        className={`md:hidden fixed inset-0 z-40 bg-ink/50 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      <div
        className={`md:hidden fixed top-[57px] left-0 right-0 z-40 bg-forest text-cream border-b border-cream/10 px-4 py-5 shadow-2xl transition-all duration-300 ease-in-out transform origin-top ${
          isOpen
            ? "translate-y-0 opacity-100 scale-y-100 pointer-events-auto"
            : "-translate-y-4 opacity-0 scale-y-95 pointer-events-none"
        }`}
      >
        <nav className="space-y-1">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium text-cream/70 hover:text-cream hover:bg-cream/10 transition-all duration-150 active:scale-[0.98]"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 shrink-0 text-gold/80"
              >
                {item.icon}
              </svg>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="mt-5 pt-4 border-t border-cream/10 space-y-3">
          {mitraName && (
            <div className="flex items-center gap-3 px-3 py-1">
              <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center font-display font-semibold text-xs shrink-0 border border-gold/30">
                {mitraName.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm font-medium text-cream/90 truncate">{mitraName}</p>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold text-red-200 bg-red-500/15 hover:bg-red-500/25 active:bg-red-500/35 transition-all duration-150 w-full border border-red-500/20 cursor-pointer"
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
            Keluar dari Sesi
          </button>
        </div>
      </div>

      {/* 3. DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 shrink-0 bg-forest text-cream flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-cream/10">
          <span className="font-display font-semibold text-lg tracking-tight">
            LENTERA
          </span>
          <p className="text-xs text-cream/45 mt-1 font-mono uppercase tracking-wider">Portal Mitra</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-cream/65 hover:text-cream hover:bg-cream/10 transition-colors"
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
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-cream/65 hover:text-red-300 hover:bg-cream/10 transition-colors w-full cursor-pointer text-left"
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