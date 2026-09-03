"use client";

import Link from "next/link";
import { motion } from "motion/react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-cream flex flex-col justify-center relative overflow-hidden selection:bg-forest selection:text-cream">
      
      {/* Latar Belakang Bersih dengan Gradien Radial Halus */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(46,117,89,0.06),transparent_60%)] pointer-events-none" />

      <div className="w-full max-w-[1400px] mx-auto px-6 sm:px-12 lg:px-24 relative z-10 flex flex-col lg:flex-row justify-between gap-20 lg:gap-32">
        
        {/* Kolom Kiri: Tipografi Editorial Raksasa */}
        <div className="flex-1 lg:max-w-2xl flex flex-col justify-center pt-10 lg:pt-0">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Angka 404 menjadi elemen arsitektur, bukan sekadar teks */}
            <h1 className="font-display font-black text-[120px] sm:text-[160px] lg:text-[220px] leading-[0.8] text-forest tracking-tighter mb-8 sm:mb-12">
              404<span className="text-green">.</span>
            </h1>

            <h2 className="font-display font-medium text-4xl sm:text-5xl lg:text-6xl text-forest leading-[1.1] tracking-tight mb-6">
              Jalur energi <br />
              <span className="text-forest/30">tidak valid.</span>
            </h2>

            <p className="text-base sm:text-lg text-ink/70 leading-relaxed max-w-md">
              Halaman yang Anda cari tidak tersedia. Tautan mungkin telah usang atau data telah didaur ulang oleh sistem LENTERA.
            </p>
          </motion.div>
        </div>

        {/* Kolom Kanan: Navigasi List Interaktif (Bukan Kartu) */}
        <div className="flex-1 flex flex-col justify-center w-full max-w-2xl lg:ml-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.3 }}
            className="flex flex-col border-t border-forest/10"
          >
            {[
              {
                title: "Beranda Utama",
                desc: "Kembali ke pusat informasi LENTERA.",
                href: "/",
              },
              {
                title: "Mitra & Industri",
                desc: "Eksplorasi direktori jaringan sirkular kami.",
                href: "/daftar-mitra-industri",
              },
              {
                title: "Pusat Edukasi",
                desc: "Pelajari metode pengolahan limbah energi.",
                href: "/edukasi",
              },
            ].map((item, i) => (
              <Link
                key={i}
                href={item.href}
                className="group relative flex flex-col py-8 sm:py-10 border-b border-forest/10 hover:border-forest/40 transition-colors duration-700 overflow-hidden"
              >
                {/* Efek hover background yang muncul elegan dari bawah */}
                <div className="absolute inset-0 bg-forest/[0.03] translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-[0.16,1,0.3,1] -z-10" />

                <div className="flex items-center justify-between">
                  <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl text-forest/50 group-hover:text-forest transition-colors duration-500">
                    {item.title}
                  </h3>
                  
                  {/* Lingkaran panah yang membesar dan terisi saat hover */}
                  <div className="w-12 h-12 rounded-full border border-forest/15 flex items-center justify-center text-forest group-hover:bg-forest group-hover:border-forest group-hover:text-cream transition-all duration-500 ease-out">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transform -translate-x-1 group-hover:translate-x-0.5 transition-transform duration-500">
                      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                    </svg>
                  </div>
                </div>
                
                {/* Deskripsi tersembunyi yang muncul halus ke atas */}
                <p className="text-sm text-ink/60 mt-3 max-w-sm absolute bottom-8 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-700 ease-[0.16,1,0.3,1]">
                  {item.desc}
                </p>
              </Link>
            ))}
          </motion.div>
        </div>

      </div>
    </main>
  );
}