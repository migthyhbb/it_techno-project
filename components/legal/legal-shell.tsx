import Link from "next/link";
import { ReactNode } from "react";

export function LegalShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-cream px-6 py-20 md:py-28">
      <article className="max-w-[680px] mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-forest/60 hover:text-forest transition-colors mb-14"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Kembali ke beranda
        </Link>

        <p className="font-mono text-xs tracking-widest uppercase text-green mb-4">
          Terakhir diperbarui: Agustus 2026
        </p>
        <h1 className="font-display font-semibold text-4xl md:text-5xl text-forest leading-tight mb-8">
          {title}
        </h1>

        <p className="text-ink/55 text-[15px] leading-[1.85] border-l-2 border-gold/40 pl-4 mb-16">
          Ini teks placeholder untuk keperluan pratinjau desain — ganti dengan{" "}
          {title.toLowerCase()} resmi LENTERA sebelum situs ini dipublikasikan.
        </p>

        <div className="space-y-12">{children}</div>
      </article>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display font-semibold text-2xl text-forest mb-4">
        {title}
      </h2>
      <p className="text-ink/70 text-[17px] leading-[1.85]">{children}</p>
    </section>
  );
}