"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface LegalShellProps {
  title: string;
  updatedAt?: string;
  children: React.ReactNode;
}

export function LegalShell({
  title,
  updatedAt = "2 September 2026",
  children,
}: LegalShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleBack = () => {
    // 1. Cek parameter query ?from=... di URL (misal: ?from=/daftar/mitra)
    const fromParam = searchParams.get("from");

    if (fromParam) {
      router.push(fromParam);
      return;
    }

    // 2. Jika dibuka di tab baru (opener ada atau history cuma 1), coba tutup tab
    if (window.opener || window.history.length <= 1) {
      window.close();
      // Fallback jika browser memblokir window.close()
      setTimeout(() => {
        router.push("/");
      }, 200);
      return;
    }

    // 3. Jika navigasi biasa di tab yang sama
    router.back();
  };

  return (
    <div className="min-h-screen bg-cream text-ink py-12 md:py-20 px-4 sm:px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        
        {/* Tombol Kembali Dinamis */}
        <button
          onClick={handleBack}
          type="button"
          className="inline-flex items-center gap-2 text-xs font-mono text-forest/70 hover:text-forest mb-8 transition-colors cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Tutup / Kembali</span>
        </button>

        {/* Header Halaman Legal */}
        <div className="mb-10 pb-6 border-b border-forest/10">
          <p className="font-mono text-xs tracking-widest uppercase text-green mb-2">
            TERAKHIR DIPERBARUI: {updatedAt}
          </p>
          <h1 className="font-display font-semibold text-3xl md:text-5xl text-forest">
            {title}
          </h1>
        </div>

        {/* Konten Utama */}
        <div className="space-y-8">{children}</div>

      </div>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-paper p-6 sm:p-8 rounded-2xl border border-forest/10 shadow-xs">
      <h2 className="font-display font-semibold text-lg sm:text-xl text-forest mb-4">
        {title}
      </h2>
      <div className="text-sm text-ink/80 leading-relaxed">{children}</div>
    </div>
  );
}