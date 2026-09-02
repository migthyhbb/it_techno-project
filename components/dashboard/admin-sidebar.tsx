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
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);

  const isMobileVisible = isOpen || internalMobileOpen;

  const handleClose = () => {
    setInternalMobileOpen(false);
    if (onClose) onClose();
  };

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

  const toggleMobileMenu = () => {
    if (isMobileVisible) {
      handleClose();
    } else {
      setInternalMobileOpen(true);
    }
  };

  return (
    <>
      {/* 1. MOBILE TOP BAR */}
      <div className="md:hidden sticky top-0 z-40 bg-forest text-cream flex items-center justify-between px-5 py-3.5 border-b border-cream/10 w-full shadow-sm shrink-0">
        <div>
          <span className="font-display font-semibold text-base tracking-tight block leading-none">
            LENTERA
          </span>
          <span className="text-[10px] text-cream/45 font-mono uppercase tracking-wider">
            Portal Admin
          </span>
        </div>

        <button
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          className="p-2 text-cream/80 hover:text-cream rounded-xl hover:bg-cream/10 transition-all duration-200 active:scale-95 focus:outline-none cursor-pointer"
        >
          <div className="w-5 h-5 flex flex-col justify-center items-center relative">
            <span
              className={`h-0.5 w-5 bg-current rounded-full transition-all duration-300 ease-in-out ${
                isMobileVisible ? "rotate-45 translate-y-[2px]" : "-translate-y-1"
              }`}
            />
            <span
              className={`h-0.5 w-5 bg-current rounded-full transition-all duration-200 ease-in-out ${
                isMobileVisible ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`h-0.5 w-5 bg-current rounded-full transition-all duration-300 ease-in-out ${
                isMobileVisible ? "-rotate-45 -translate-y-[2px]" : "translate-y-1"
              }`}
            />
          </div>
        </button>
      </div>

      {/* 2. MOBILE OVERLAY & DROPDOWN */}
      {isMobileVisible && (
        <div
          onClick={handleClose}
          className="md:hidden fixed inset-0 z-40 bg-ink/50 backdrop-blur-xs transition-opacity"
        />
      )}

      <div
        className={`md:hidden fixed top-[57px] left-0 right-0 z-50 bg-forest text-cream border-b border-cream/10 px-4 py-5 shadow-2xl transition-all duration-300 ease-in-out transform origin-top max-h-[85vh] overflow-y-auto ${
          isMobileVisible
            ? "translate-y-0 opacity-100 scale-y-100 pointer-events-auto"
            : "-translate-y-4 opacity-0 scale-y-95 pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-cream/10">
          <p className="text-xs font-mono text-gold uppercase tracking-wider">
            Navigasi Panel Admin
          </p>
          <button
            onClick={handleClose}
            className="text-cream/60 hover:text-cream text-xs font-medium px-2 py-1 rounded-lg bg-cream/5 hover:bg-cream/10 transition-colors cursor-pointer"
          >
            ✕ Tutup
          </button>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (setActiveTab) setActiveTab(item.id);
                  handleClose();
                }}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium w-full text-left transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                  isActive
                    ? "bg-cream text-forest font-semibold shadow-xs"
                    : "text-cream/70 hover:text-cream hover:bg-cream/10"
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

        <div className="mt-5 pt-4 border-t border-cream/10 space-y-3">
          {nama && (
            <div className="flex items-center gap-3 px-3 py-1">
              <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center font-display font-semibold text-xs shrink-0 border border-gold/30">
                {nama.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm font-medium text-cream/90 truncate">{nama}</p>
            </div>
          )}

          <button
            type="button"
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

      {/* 3. DESKTOP SIDEBAR (Strictly Hidden on Mobile) */}
      <aside className="hidden md:flex md:w-64 shrink-0 bg-forest text-cream flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-cream/10">
          <span className="font-display font-semibold text-lg tracking-tight">
            LENTERA
          </span>
          <p className="text-xs text-cream/45 mt-1 font-mono uppercase tracking-wider">
            Portal Admin
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (setActiveTab) setActiveTab(item.id);
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
                  className="w-4 h-4 shrink-0"
                >
                  {item.icon}
                </svg>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-cream/10">
          {nama && (
            <div className="flex items-center gap-3 px-2 mb-2 pb-3 border-b border-cream/10">
              <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center font-display font-semibold text-xs shrink-0">
                {nama.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm text-cream/80 truncate">{nama}</p>
            </div>
          )}
          <button
            type="button"
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