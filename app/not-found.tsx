"use client";

import Link from "next/link";
import { motion } from "motion/react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 sm:px-6 md:px-12 text-center relative overflow-hidden z-0">
      
      {/* Animated Background Accents */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-24 -left-24 w-96 h-96 bg-forest/5 rounded-full blur-3xl pointer-events-none -z-10"
      />
      <motion.div
        animate={{
          y: [0, 20, 0],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -bottom-24 -right-24 w-96 h-96 bg-green/10 rounded-full blur-3xl pointer-events-none -z-10"
      />

      {/* Giant 404 Watermark Background */}
      <div className="absolute inset-0 flex items-center justify-center -z-10 select-none pointer-events-none">
        <span className="text-[10rem] sm:text-[18rem] md:text-[22rem] font-display font-bold text-forest/[0.03] leading-none">
          404
        </span>
      </div>

      <div className="max-w-xl mx-auto space-y-5 relative z-10">
        
        {/* Minimalist Overline Text */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="font-mono text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-forest/60">
            Error 404
          </span>
        </motion.div>

        {/* Animated Heading */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h1 className="font-display font-semibold text-3xl sm:text-4xl md:text-5xl text-forest leading-tight">
            Halaman Tidak Ditemukan
          </h1>
        </motion.div>

        {/* Animated Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <p className="text-sm sm:text-base text-ink/70 leading-relaxed max-w-md mx-auto">
            Maaf, halaman yang Anda tuju tidak tersedia di dalam sistem LENTERA.
            Halaman tersebut mungkin telah dipindahkan, dihapus, atau tautan yang Anda masukkan kurang tepat.
          </p>
        </motion.div>

        {/* Animated Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
        >
          <Link
            href="/"
            className="w-full sm:w-auto bg-forest text-paper px-8 py-3.5 rounded-2xl text-xs font-semibold hover:bg-forest/90 transition-all shadow-xs hover:shadow-md cursor-pointer text-center"
          >
            Kembali ke Beranda
          </Link>
          <Link
            href="/daftar-mitra-industri"
            className="w-full sm:w-auto bg-white/80 backdrop-blur-sm border border-forest/15 text-forest px-8 py-3.5 rounded-2xl text-xs font-semibold hover:bg-forest/5 transition-all cursor-pointer text-center"
          >
            Lihat Mitra & Industri
          </Link>
        </motion.div>

      </div>
    </main>
  );
}