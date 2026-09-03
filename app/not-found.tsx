"use client";

import Link from "next/link";
import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import { Home, Users, BookOpen } from "lucide-react";

export default function NotFound() {
  // Mouse position tracker untuk efek spotlight interaktif
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <main
      onMouseMove={handleMouseMove}
      className="min-h-screen bg-cream flex flex-col items-center justify-center py-20 px-4 sm:px-6 relative overflow-hidden z-0 group"
    >
      {/* --- INTERACTIVE SPOTLIGHT EFFECT --- */}
      <motion.div
        className="absolute inset-0 pointer-events-none -z-10 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(46, 117, 89, 0.08),
              transparent 80%
            )
          `,
        }}
      />

      {/* --- ABSTRACT GLOW ORBS --- */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] bg-green/10 rounded-full blur-[120px] pointer-events-none -z-20" />

      {/* --- GIANT WATERMARK 404 --- */}
      <div className="absolute inset-0 flex items-center justify-center -z-10 select-none pointer-events-none">
        <span className="text-[14rem] sm:text-[22rem] md:text-[28rem] font-display font-black text-forest/[0.02] tracking-tighter leading-none">
          404
        </span>
      </div>

      {/* --- HEADER TEXT --- */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-xl mx-auto z-10 mb-10 space-y-3"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest/5 border border-forest/10 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green animate-ping" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-forest">
            Sinyal Jaringan Hilang
          </span>
        </div>
        
        <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-forest tracking-tight">
          Sirkuit Terputus! Halaman Lenyap.
        </h1>
        
        <p className="text-xs sm:text-sm text-ink/70 leading-relaxed max-w-md mx-auto">
          Energi yang Anda cari di jalur ini tidak dapat ditemukan. Tautan mungkin telah usang, 
          atau halaman ini sudah didaur ulang oleh sistem LENTERA.
        </p>
      </motion.div>

      {/* --- BENTO GRID NAVIGATION (Ultra Modern Cards) --- */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl z-10 px-4"
      >
        {/* Card 1: Beranda */}
        <Link href="/" className="group/card block h-full">
          <div className="relative bg-white/70 backdrop-blur-xl border border-forest/10 p-6 rounded-[2rem] h-full flex flex-col justify-between overflow-hidden transition-all duration-300 hover:border-forest/40 hover:shadow-[0_10px_30px_rgba(46,117,89,0.1)] hover:-translate-y-1.5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-forest/5 rounded-full blur-2xl group-hover/card:bg-forest/10 transition-colors pointer-events-none" />
            
            <div className="w-12 h-12 bg-forest/5 text-forest group-hover/card:bg-forest group-hover/card:text-cream rounded-2xl flex items-center justify-center mb-8 transition-all duration-300 shadow-xs">
              <Home size={20} />
            </div>
            
            <div>
              <h3 className="font-display font-semibold text-forest text-base mb-1 group-hover/card:text-green transition-colors">
                Beranda Utama
              </h3>
              <p className="text-xs text-ink/60 leading-relaxed">
                Kembali ke pusat informasi dan beranda utama LENTERA.
              </p>
            </div>
          </div>
        </Link>

        {/* Card 2: Mitra & Industri */}
        <Link href="/daftar-mitra-industri" className="group/card block h-full">
          <div className="relative bg-white/70 backdrop-blur-xl border border-forest/10 p-6 rounded-[2rem] h-full flex flex-col justify-between overflow-hidden transition-all duration-300 hover:border-forest/40 hover:shadow-[0_10px_30px_rgba(46,117,89,0.1)] hover:-translate-y-1.5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-forest/5 rounded-full blur-2xl group-hover/card:bg-forest/10 transition-colors pointer-events-none" />
            
            <div className="w-12 h-12 bg-forest/5 text-forest group-hover/card:bg-forest group-hover/card:text-cream rounded-2xl flex items-center justify-center mb-8 transition-all duration-300 shadow-xs">
              <Users size={20} />
            </div>
            
            <div>
              <h3 className="font-display font-semibold text-forest text-base mb-1 group-hover/card:text-green transition-colors">
                Mitra & Industri
              </h3>
              <p className="text-xs text-ink/60 leading-relaxed">
                Eksplorasi direktori jaringan sirkular resmi kami.
              </p>
            </div>
          </div>
        </Link>

        {/* Card 3: Pusat Edukasi */}
        <Link href="/edukasi" className="group/card block h-full">
          <div className="relative bg-white/70 backdrop-blur-xl border border-forest/10 p-6 rounded-[2rem] h-full flex flex-col justify-between overflow-hidden transition-all duration-300 hover:border-green/40 hover:shadow-[0_10px_30px_rgba(46,117,89,0.1)] hover:-translate-y-1.5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green/5 rounded-full blur-2xl group-hover/card:bg-green/10 transition-colors pointer-events-none" />
            
            <div className="w-12 h-12 bg-forest/5 text-forest group-hover/card:bg-green group-hover/card:text-cream rounded-2xl flex items-center justify-center mb-8 transition-all duration-300 shadow-xs">
              <BookOpen size={20} />
            </div>
            
            <div>
              <h3 className="font-display font-semibold text-forest text-base mb-1 group-hover/card:text-green transition-colors">
                Pusat Edukasi
              </h3>
              <p className="text-xs text-ink/60 leading-relaxed">
                Pelajari metode konversi dan pengolahan limbah energi.
              </p>
            </div>
          </div>
        </Link>
      </motion.div>

    </main>
  );
}