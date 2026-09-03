"use client";

import Link from "next/link";
import { motion } from "motion/react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-cream flex flex-col items-center justify-center py-20 px-4 sm:px-6 relative overflow-hidden z-0 selection:bg-forest selection:text-cream">
      
      {/* --- ULTRA PREMIUM BACKGROUND --- */}
      {/* Subtle blueprint grid mask untuk kesan teknikal/energi */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(46,117,89,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(46,117,89,0.04)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_40%,transparent_100%)] pointer-events-none -z-20" />
      
      {/* Ambient Floating Geometry */}
      <motion.div
        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-forest/5 rounded-full blur-[100px] -z-10 pointer-events-none"
      />
      <motion.div
        animate={{ rotate: -360, scale: [1, 1.2, 1] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] bg-green/10 rounded-full blur-[100px] -z-10 pointer-events-none"
      />

      {/* --- GIANT GLASSMORPHIC TYPOGRAPHY --- */}
      <div className="relative z-10 flex items-center justify-center gap-2 sm:gap-6 font-display font-black text-[7rem] sm:text-[11rem] md:text-[15rem] leading-none select-none mb-8">
        <motion.span
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="text-forest drop-shadow-2xl"
        >
          4
        </motion.span>
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-green to-forest drop-shadow-2xl">
            0
          </span>
          {/* Inner core reflection */}
          <div className="absolute inset-0 m-auto w-[45%] h-[65%] rounded-full shadow-[inset_0_0_30px_rgba(46,117,89,0.25)]" />
        </motion.div>
        <motion.span
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          className="text-forest drop-shadow-2xl"
        >
          4
        </motion.span>
      </div>

      {/* --- REFINED TEXT CONTENT --- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center max-w-2xl mx-auto z-10 mb-16"
      >
        <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-forest mb-4 tracking-tight">
          Sirkuit Terputus.
        </h1>
        <p className="text-sm sm:text-base text-ink/70 leading-relaxed px-4 max-w-lg mx-auto font-medium">
          Energi yang Anda cari di jalur ini tidak dapat ditemukan. Tautan mungkin telah usang atau didaur ulang oleh sistem LENTERA.
        </p>
      </motion.div>

      {/* --- BENTO GRID NAVIGATION (Double-Layered Glass Cards) --- */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-5xl z-10 px-4"
      >
        {/* Bento Card 1: Beranda */}
        <Link href="/" className="group relative block h-full overflow-hidden rounded-[2.5rem] bg-white/40 backdrop-blur-xl border border-white/60 p-1.5 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(46,117,89,0.15)] transition-all duration-500 hover:-translate-y-2">
          <div className="absolute inset-0 bg-gradient-to-br from-forest/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative h-full bg-cream/50 rounded-[2rem] p-6 sm:p-8 flex flex-col justify-between border border-forest/5 group-hover:border-forest/20 transition-colors duration-500">
            <div className="w-14 h-14 bg-white shadow-sm text-forest group-hover:bg-forest group-hover:text-cream rounded-2xl flex items-center justify-center mb-8 transition-all duration-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <div>
              <h3 className="font-display font-semibold text-forest text-xl mb-2 group-hover:text-green transition-colors">Beranda Utama</h3>
              <p className="text-sm text-ink/60 leading-relaxed">Kembali ke pusat informasi LENTERA.</p>
            </div>
          </div>
        </Link>

        {/* Bento Card 2: Mitra & Industri */}
        <Link href="/daftar-mitra-industri" className="group relative block h-full overflow-hidden rounded-[2.5rem] bg-white/40 backdrop-blur-xl border border-white/60 p-1.5 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(46,117,89,0.15)] transition-all duration-500 hover:-translate-y-2">
          <div className="absolute inset-0 bg-gradient-to-br from-forest/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative h-full bg-cream/50 rounded-[2rem] p-6 sm:p-8 flex flex-col justify-between border border-forest/5 group-hover:border-forest/20 transition-colors duration-500">
            <div className="w-14 h-14 bg-white shadow-sm text-forest group-hover:bg-forest group-hover:text-cream rounded-2xl flex items-center justify-center mb-8 transition-all duration-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            </div>
            <div>
              <h3 className="font-display font-semibold text-forest text-xl mb-2 group-hover:text-green transition-colors">Mitra & Industri</h3>
              <p className="text-sm text-ink/60 leading-relaxed">Eksplorasi jaringan sirkular kami.</p>
            </div>
          </div>
        </Link>

        {/* Bento Card 3: Edukasi */}
        <Link href="/edukasi" className="group relative block h-full overflow-hidden rounded-[2.5rem] bg-white/40 backdrop-blur-xl border border-white/60 p-1.5 shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(46,117,89,0.15)] transition-all duration-500 hover:-translate-y-2">
          <div className="absolute inset-0 bg-gradient-to-br from-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative h-full bg-cream/50 rounded-[2rem] p-6 sm:p-8 flex flex-col justify-between border border-forest/5 group-hover:border-green/40 transition-colors duration-500">
            <div className="w-14 h-14 bg-white shadow-sm text-forest group-hover:bg-green group-hover:text-cream rounded-2xl flex items-center justify-center mb-8 transition-all duration-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
            </div>
            <div>
              <h3 className="font-display font-semibold text-forest text-xl mb-2 group-hover:text-green transition-colors">Pusat Edukasi</h3>
              <p className="text-sm text-ink/60 leading-relaxed">Pelajari metode pengolahan limbah.</p>
            </div>
          </div>
        </Link>
      </motion.div>

    </main>
  );
}