"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
    router.push("/masuk");
    router.refresh();
  }

  return (
    <>
      {/* Backdrop Mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="md:hidden fixed inset-0 bg-ink/60 z-40 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Drawer Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 bottom-0 z-50 h-screen w-64 bg-forest text-cream flex flex-col justify-between p-6 transform transition-transform duration-300 ease-in-out md:translate-x-0 shrink-0 ${
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
              <p className="text-xs text-cream/45 mt-0.5">Portal Admin</p>
            </div>

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

          {/* Menu Navigasi Berbasis Tab Button */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (setActiveTab) setActiveTab(item.id);
                    if (onClose) onClose();
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
        </div>

        {/* User Info & Logout */}
        <div className="pt-6 border-t border-cream/10 space-y-2">
          {nama && (
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center font-display font-semibold text-xs shrink-0">
                {nama.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm font-medium text-cream/90 truncate">{nama}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-cream/65 hover:text-cream hover:bg-cream/10 transition-colors w-full text-left cursor-pointer"
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