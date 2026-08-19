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
<<<<<<< HEAD
    <main className="min-h-screen bg-cream px-6 py-16 md:py-20">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-forest/70 hover:text-forest transition-colors mb-10"
=======
    <main className="min-h-screen bg-cream px-6 py-20 md:py-28">
      <article className="max-w-[680px] mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-forest/60 hover:text-forest transition-colors mb-14"
>>>>>>> 23577b581cc61de8da2b7c68da516d87b8dadee4
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Kembali ke beranda
        </Link>

<<<<<<< HEAD
        <p className="font-mono text-xs tracking-widest uppercase text-green mb-3">
          Terakhir diperbarui: Agustus 2026
        </p>
        <h1 className="font-display font-semibold text-3xl md:text-4xl text-forest mb-8">
          {title}
        </h1>

        <div className="bg-paper rounded-3xl border border-forest/10 p-8 md:p-10">
          <div className="bg-gold/10 border border-gold/20 rounded-xl px-4 py-3 mb-8 text-sm text-forest/80">
            Ini teks placeholder untuk keperluan pratinjau desain — ganti dengan{" "}
            {title.toLowerCase()} resmi LENTERA sebelum situs ini dipublikasikan.
          </div>
          <div className="space-y-8">{children}</div>
        </div>
      </div>
=======
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
>>>>>>> 23577b581cc61de8da2b7c68da516d87b8dadee4
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
<<<<<<< HEAD
      <h2 className="font-display font-semibold text-lg text-forest mb-2">{title}</h2>
      <p className="text-ink/65 leading-relaxed text-sm">{children}</p>
=======
      <h2 className="font-display font-semibold text-2xl text-forest mb-4">
        {title}
      </h2>
      <p className="text-ink/70 text-[17px] leading-[1.85]">{children}</p>
>>>>>>> 23577b581cc61de8da2b7c68da516d87b8dadee4
    </section>
  );
}
