"use client";

import Link from "next/link";
import { motion } from "motion/react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-cream relative overflow-hidden flex items-center justify-center selection:bg-forest selection:text-cream">
      
      {/* --- PREMIUM BACKGROUND AMBIENCE --- */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-green/10 blur-[150px] rounded-full mix-blend-multiply pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-forest/10 blur-[120px] rounded-full mix-blend-multiply pointer-events-none" />

      {/* --- GIANT BACKGROUND "404" GRAPHIC --- */}
      <motion.div 
        animate={{ y: [-15, 15, -15] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none -z-10"
      >
        <h1 className="text-[30vw] font-display font-black text-forest/[0.04] tracking-tighter leading-none">
          404
        </h1>
      </motion.div>

      {/* --- MAIN SPLIT CONTENT --- */}
      <div className="z-10 w-full max-w-7xl mx-auto px-6 py-20 flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-24">
        
        {/* LEFT COLUMN: Typography & Messaging */}
        <div className="flex-1 text-center lg:text-left space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-forest/5 border border-forest/10 mb-6">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-forest/80">
                Sistem Terputus
              </span>
            </div>
            
            <h2 className="font-display font-bold text-5xl sm:text-6xl md:text-7xl lg:text-[5rem] text-forest leading-[1.05] tracking-tight mb-6">
              Jalur Energi <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-forest to-green">
                Tidak Valid.
              </span>
            </h2>
            
            <p className="text-base sm:text-lg text-ink/70 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Halaman yang Anda cari sudah tidak tersedia di jaringan LENTERA. 
              Tautan mungkin telah usang, atau data ini telah didaur ulang oleh sistem kami.
            </p>
          </motion.div>
        </div>

        {/* RIGHT COLUMN: Stacked Navigation Cards */}
        <div className="w-full max-w-md lg:max-w-lg flex flex-col gap-4">
          
          {/* Card 1: Beranda */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link href="/" className="group flex items-center gap-5 p-5 sm:p-6 bg-white/50 backdrop-blur-xl border border-forest/10 rounded-[2rem] hover:bg-white hover:border-forest/30 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(46,117,89,0.15)] hover:-translate-y-1">
              <div className="w-14 h-14 shrink-0 bg-forest/5 text-forest rounded-2xl flex items-center justify-center group-hover:bg-forest group-hover:text-cream transition-colors duration-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold text-forest text-lg mb-0.5">Beranda Utama</h3>
                <p className="text-xs sm:text-sm text-ink/60">Kembali ke pusat informasi LENTERA.</p>
              </div>
              <div className="w-8 h-8 shrink-0 flex items-center justify-center text-forest/20 group-hover:text-forest group-hover:translate-x-1.5 transition-all duration-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </div>
            </Link>
          </motion.div>

          {/* Card 2: Mitra & Industri */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link href="/daftar-mitra-industri" className="group flex items-center gap-5 p-5 sm:p-6 bg-white/50 backdrop-blur-xl border border-forest/10 rounded-[2rem] hover:bg-white hover:border-forest/30 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(46,117,89,0.15)] hover:-translate-y-1">
              <div className="w-14 h-14 shrink-0 bg-forest/5 text-forest rounded-2xl flex items-center justify-center group-hover:bg-forest group-hover:text-cream transition-colors duration-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold text-forest text-lg mb-0.5">Mitra & Industri</h3>
                <p className="text-xs sm:text-sm text-ink/60">Eksplorasi direktori jaringan sirkular kami.</p>
              </div>
              <div className="w-8 h-8 shrink-0 flex items-center justify-center text-forest/20 group-hover:text-forest group-hover:translate-x-1.5 transition-all duration-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </div>
            </Link>
          </motion.div>

          {/* Card 3: Edukasi */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link href="/edukasi" className="group flex items-center gap-5 p-5 sm:p-6 bg-white/50 backdrop-blur-xl border border-forest/10 rounded-[2rem] hover:bg-white hover:border-green/40 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(46,117,89,0.15)] hover:-translate-y-1">
              <div className="w-14 h-14 shrink-0 bg-forest/5 text-forest rounded-2xl flex items-center justify-center group-hover:bg-green group-hover:text-cream transition-colors duration-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold text-forest text-lg mb-0.5">Pusat Edukasi</h3>
                <p className="text-xs sm:text-sm text-ink/60">Pelajari metode pengolahan limbah energi.</p>
              </div>
              <div className="w-8 h-8 shrink-0 flex items-center justify-center text-forest/20 group-hover:text-green group-hover:translate-x-1.5 transition-all duration-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </div>
            </Link>
          </motion.div>

        </div>
      </div>
    </main>
  );
}