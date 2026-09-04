"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const options = [
  {
    href: "/daftar/mitra",
    title: "Daftar sebagai Mitra",
    description:
      "Untuk agen dan distributor yang ingin menyalurkan energi hasil olahan LENTERA.",
    accent: "border-green",
    iconColor: "#2F6B3F",
    icon: (
      <>
        <path d="M4 21v-7a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v7M12 3v7" />
      </>
    ),
  },
  {
    href: "/daftar/industri",
    title: "Daftar sebagai Industri",
    description:
      "Untuk pabrik dan industri yang ingin menyalurkan limbah produksi ke LENTERA.",
    accent: "border-clay",
    iconColor: "#7A5738",
    icon: (
      <>
        <path d="M3 21h18M5 21V9l6-4 6 4v12M9 21v-6h6v6" />
      </>
    ),
  },
];

export default function DaftarPage() {
  useEffect(() => {
    const clearPreviousSession = async () => {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    };
    clearPreviousSession();
  }, []);

  return (
    <AuthShell
      eyebrow="Bergabung dengan LENTERA"
      title="Daftar sebagai apa?"
      subtitle="Pilih jenis akun yang sesuai — form pendaftarannya berbeda untuk masing-masing."
      wide
      footer={
        <p className="text-sm text-ink/60">
          Sudah punya akun?{" "}
          <Link href="/masuk" className="text-green font-medium hover:underline">
            Masuk
          </Link>
        </p>
      }
    >
      <div className="grid sm:grid-cols-2 gap-4">
        {options.map((o) => (
          <Link
            key={o.href}
            href={o.href}
            className={`group block rounded-2xl border-2 ${o.accent} bg-cream/50 p-6 transition-colors hover:bg-cream`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke={o.iconColor}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8 mb-4"
            >
              {o.icon}
            </svg>
            <p className="font-display font-semibold text-forest text-lg mb-1.5">
              {o.title}
            </p>
            <p className="text-ink/60 text-sm leading-relaxed">{o.description}</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-forest mt-4 group-hover:gap-2.5 transition-all">
              Lanjutkan
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </AuthShell>
  );
}