import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 sm:px-6 md:px-12 text-center relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-forest/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-green/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md mx-auto space-y-6 relative z-10">
        {/* Badge Error Code */}
        <div className="inline-block bg-forest/10 border border-forest/15 px-4 py-1.5 rounded-full">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-forest">
            Error 404 — Halaman Tidak Ditemukan
          </span>
        </div>

        {/* Big Heading */}
        <h1 className="font-display font-semibold text-4xl sm:text-5xl text-forest leading-tight">
          Waduh, Jalurnya Nyasar!
        </h1>

        {/* Subtitle Description */}
        <p className="text-sm sm:text-base text-ink/70 leading-relaxed">
          Halaman yang kamu cari mungkin sudah dipindahkan, dihapus, atau memang
          enggak pernah ada di dalam sistem LENTERA.
        </p>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto bg-forest text-paper px-6 py-3 rounded-2xl text-xs font-semibold hover:bg-forest/90 transition-colors shadow-xs cursor-pointer"
          >
            Kembali ke Beranda
          </Link>
          <Link
            href="/daftar-mitra-industri"
            className="w-full sm:w-auto bg-paper border border-forest/15 text-forest px-6 py-3 rounded-2xl text-xs font-semibold hover:bg-forest/5 transition-colors cursor-pointer"
          >
            Lihat Mitra & Industri
          </Link>
        </div>
      </div>
    </main>
  );
}