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
    href: "#profil-industri",
    label: "Profil Industri",
    icon: (
      <>
        <path d="M3 21h18M5 21V9l6-4 6 4v12M9 21v-6h6v6" />
      </>
    ),
  },
];

export function IndustriSidebar() {
  const router = useRouter();
  const [nama, setNama] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase
        .from("industri_profiles")
        .select("nama_perusahaan")
        .eq("user_id", data.user.id)
        .maybeSingle();
      setNama(profile?.nama_perusahaan ?? data.user.email ?? null);
    });
  }, []);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/masuk");
  }

  return (
    <aside className="w-64 shrink-0 bg-forest text-cream flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-cream/10">
        <span className="font-display font-semibold text-lg tracking-tight">
          LENTERA
        </span>
        <p className="text-xs text-cream/45 mt-1">Portal Industri</p>
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
        {nama && (
          <div className="flex items-center gap-3 px-2 mb-2 pb-3 border-b border-cream/10">
            <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center font-display font-semibold text-xs shrink-0">
              {nama.charAt(0).toUpperCase()}
            </div>
            <p className="text-sm text-cream/80 truncate">{nama}</p>
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
  );
}
