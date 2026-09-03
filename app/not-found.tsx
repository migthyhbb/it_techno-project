"use client";

import Link from "next/link";
import { motion } from "motion/react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-cream flex flex-col items-center justify-center py-20 px-4 sm:px-6 relative overflow-hidden z-0">
      
      {/* --- BACKGROUND ANIMATIONS (Abstract Floating Geometry) --- */}
      <motion.div
        animate={{ rotate: 360, scale: [1, 1.2, 1] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute -top-32 -left-32 w-[30rem] h-[30rem] bg-gradient-to-br from-forest/5 to-transparent rounded-full blur-3xl -z-10 pointer-events-none"
      />
      <motion.div
        animate={{ rotate: -360, scale: [1, 1.5, 1] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-40 -right-20 w-[40rem] h-[40rem] bg-gradient-to-tl from-green/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none"
      />

      {/* --- GIANT PARALLAX TYPOGRAPHY --- */}
      <div className="relative z-10 flex gap-2 sm:gap-6 font-display font-black text-[8rem] sm:text-[14rem] md:text-[18rem] leading-none select-none drop-shadow-sm mb-4">
        <motion.span
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="text-forest"
        >
          4
        </motion.span>
        <motion.span
          animate={{ y: [0, 25, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="text-transparent bg-clip-text bg-gradient-to-b from-green to-forest"
        >
          0
        </motion.span>
        <motion.span
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          className="text-forest"
        >
          4
        </motion.span>
      </div>

      {/* --- TEXT CONTENT --- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl mx-auto z-10 mb-12"
      >
        <h1 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-forest mb-4 tracking-tight">
          Sirkuit Terputus! Halaman Lenyap.
        </h1>
        <p className="text-sm sm:text-base text-ink/70 leading-relaxed px-4">
          Energi yang Anda cari di jalur ini tidak dapat ditemukan. Tautan mungkin telah usang, 
          atau halaman ini sudah didaur ulang oleh sistem LENTERA.
        </p>
      </motion.div>

      {/* --- BENTO GRID NAVIGATION (Premium Action Cards) --- */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl z-10 px-4"
      >
        {/* Bento Card 1: Beranda */}
        <Link href="/" className="group block h-full">
          <div className="bg-white/60 backdrop-blur-md border border-forest/10 p-6 rounded-3xl h-full flex flex-col justify-between hover:bg-forest hover:border-forest transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1">
            <div className="w-12 h-12 bg-forest/5 text-forest group-hover:bg-white/20 group-hover:text-cream rounded-2xl flex items-center justify-center mb-6 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <div>
              <h3 className="font-semibold text-forest group-hover:text-cream text-lg mb-1 transition-colors">Beranda Utama</h3>
              <p className="text-xs text-ink/60 group-hover:text-cream/70 transition-colors">Kembali ke pusat informasi LENTERA.</p>
            </div>
          </div>
        </Link>

        {/* Bento Card 2: Mitra & Industri */}
        <Link href="/daftar-mitra-industri" className="group block h-full">
          <div className="bg-white/60 backdrop-blur-md border border-forest/10 p-6 rounded-3xl h-full flex flex-col justify-between hover:bg-forest hover:border-forest transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1">
            <div className="w-12 h-12 bg-forest/5 text-forest group-hover:bg-white/20 group-hover:text-cream rounded-2xl flex items-center justify-center mb-6 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            </div>
            <div>
              <h3 className="font-semibold text-forest group-hover:text-cream text-lg mb-1 transition-colors">Mitra & Industri</h3>
              <p className="text-xs text-ink/60 group-hover:text-cream/70 transition-colors">Eksplorasi jaringan sirkular kami.</p>
            </div>
          </div>
        </Link>

        {/* Bento Card 3: Edukasi */}
        <Link href="/edukasi" className="group block h-full">
          <div className="bg-white/60 backdrop-blur-md border border-forest/10 p-6 rounded-3xl h-full flex flex-col justify-between hover:bg-green hover:border-green transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1">
            <div className="w-12 h-12 bg-forest/5 text-forest group-hover:bg-forest/20 group-hover:text-forest rounded-2xl flex items-center justify-center mb-6 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            </div>
            <div>
              <h3 className="font-semibold text-forest group-hover:text-forest text-lg mb-1 transition-colors">Pusat Edukasi</h3>
              <p className="text-xs text-ink/60 group-hover:text-forest/70 transition-colors">Pelajari lebih lanjut tentang limbah energi.</p>
            </div>
          </div>
        </Link>
      </motion.div>

    </main>
  );
}