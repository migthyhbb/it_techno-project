"use client";

import Link from "next/link";
import { motion } from "motion/react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 sm:px-6 md:px-12 text-center relative overflow-hidden z-0">
      
      {/* Drifting Energy Orbs (Background Animation) */}
      <motion.div
        animate={{
          x: [0, 80, -40, 0],
          y: [0, -80, 60, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/4 left-1/4 w-[25rem] sm:w-[35rem] h-[25rem] sm:h-[35rem] bg-forest/10 rounded-full blur-[100px] pointer-events-none -z-10"
      />
      <motion.div
        animate={{
          x: [0, -80, 40, 0],
          y: [0, 80, -60, 0],
          scale: [1, 1.5, 0.8, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-1/4 right-1/4 w-[20rem] sm:w-[30rem] h-[20rem] sm:h-[30rem] bg-green/10 rounded-full blur-[80px] pointer-events-none -z-10"
      />

      {/* Giant Animated 404 Gradient Text */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute inset-0 flex items-center justify-center -z-10 select-none pointer-events-none"
      >
        <span className="text-[12rem] sm:text-[18rem] md:text-[24rem] lg:text-[28rem] font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-forest/5 to-cream leading-none">
          404
        </span>
      </motion.div>

      {/* Main Glassmorphism Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="relative z-10 max-w-xl w-full"
      >
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="bg-white/40 backdrop-blur-xl border border-white/60 p-8 sm:p-12 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.04)] relative overflow-hidden"
        >
          {/* Inner Card Shine Effect */}
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />

          <div className="relative z-10 space-y-6">
            {/* Minimalist Overline */}
            <span className="inline-block font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-forest/60 border-b border-forest/20 pb-1">
              Navigasi Terputus
            </span>

            {/* Heading */}
            <h1 className="font-display font-semibold text-3xl sm:text-4xl md:text-5xl text-forest leading-tight">
              Halaman Tidak Ditemukan
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-ink/70 leading-relaxed max-w-sm mx-auto">
              Maaf, jalur yang Anda tuju tidak tersedia di jaringan LENTERA. 
              Mungkin tautannya sudah usang atau salah ketik.
            </p>

            {/* Interactive Action Buttons */}
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                <Link
                  href="/"
                  className="block w-full bg-forest text-paper px-8 py-3.5 rounded-2xl text-sm font-semibold hover:bg-forest/90 transition-colors shadow-md text-center"
                >
                  Kembali ke Beranda
                </Link>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                <Link
                  href="/daftar-mitra-industri"
                  className="block w-full bg-white/50 backdrop-blur-sm border border-forest/20 text-forest px-8 py-3.5 rounded-2xl text-sm font-semibold hover:bg-forest/5 transition-colors text-center"
                >
                  Jelajahi Mitra
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>

    </main>
  );
}