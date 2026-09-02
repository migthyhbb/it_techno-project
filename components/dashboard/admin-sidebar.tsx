"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export const navItems = [
  {
    id: "ringkasan",
    label: "Ringkasan Admin",
    icon: (
      <>
        <path d="M3 12 12 3l9 9" />
        <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
      </>
    ),
  },
  {
    id: "manajemen-pengguna",
    label: "Manajemen Akun",
    icon: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    id: "katalog-produk",
    label: "Katalog Produk",
    icon: (
      <>
        <path d="m7.5 4.27 9 5.15" />
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </>
    ),
  },
  {
    id: "harga-wilayah",
    label: "Harga Wilayah",
    icon: (
      <>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </>
    ),
  },
  {
    id: "pengiriman",
    label: "Semua Pengiriman",
    icon: (
      <>
        <rect width="8" height="8" x="3" y="3" rx="2" />
        <path d="M7 11v4a2 2 0 0 0 2 2h4" />
        <rect width="8" height="8" x="13" y="13" rx="2" />
      </>
    ),
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export function AdminSidebar({
  isOpen = false,
  onClose,
  activeTab,
  setActiveTab,
}: SidebarProps) {
  const [nama, setNama] = useState<string | null>("Administrator");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setNama(data.user.email ?? "Administrator");
    });
  }, []);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/masuk";
  }

  return (
    <>
      {/* OVERLAY GELAP (KHUSUS MOBILE) */}
      {isOpen && (
        <div
          onClick={onClose}
          className="md:hidden fixed inset-0 z-40 bg-ink/60 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* LACI SIDEBAR */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-50 h-screen bg-forest text-cream flex flex-col shadow-2xl md:shadow-none
          transition-transform duration-300 ease-in-out
          w-3/4 max-w-[280px] md:w-64 shrink-0
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* HEADER SIDEBAR */}
        <div className="p-5 md:p-6 border-b border-cream/10 flex items-center justify-between">
          <div>
            <span className="font-display font-semibold text-lg tracking-tight">
              LENTERA
            </span>
            <p className="text-[10px] md:text-xs text-cream/45 mt-0.5 font-mono uppercase tracking-wider">
              Portal Admin
            </p>
          </div>
          
          {/* TOMBOL TUTUP (CUMA MUNCUL DI HP) */}
          <button
            onClick={onClose}
            className="md:hidden p-2 text-cream/60 hover:text-cream bg-cream/5 rounded-lg transition-colors cursor-pointer"
            aria-label="Tutup Menu"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* MENU NAVIGASI */}
        <nav className="flex-1 p-3 md:p-4 space-y-1 overflow-y-auto">
          <p className="md:hidden px-3 pt-2 pb-3 text-[10px] font-mono text-gold uppercase tracking-widest">
            Navigasi Panel
          </p>

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (setActiveTab) setActiveTab(item.id);
                  if (onClose) onClose(); // Otomatis nutup sidebar di HP pas menu diklik
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full text-left transition-colors cursor-pointer ${
                  isActive
                    ? "bg-cream text-forest font-semibold shadow-xs"
                    : "text-cream/65 hover:text-cream hover:bg-cream/10"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`w-5 h-5 shrink-0 ${isActive ? "text-forest" : "text-gold/80"}`}
                >
                  {item.icon}
                </svg>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* FOOTER SIDEBAR (PROFIL & LOGOUT) */}
        <div className="p-4 border-t border-cream/10 shrink-0">
          {nama && (
            <div className="flex items-center gap-3 px-2 mb-3 pb-3 border-b border-cream/10">
              <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center font-display font-semibold text-xs shrink-0">
                {nama.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm text-cream/80 truncate">{nama}</p>
            </div>
          )}
          
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center md:justify-start gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-200 bg-red-500/15 md:bg-transparent md:text-cream/65 hover:text-red-300 hover:bg-red-500/25 md:hover:bg-cream/10 transition-all w-full cursor-pointer text-left border border-red-500/20 md:border-transparent"
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