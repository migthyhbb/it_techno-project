"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { Navbar } from "@/components/navbar";

export default function TentangKamiPage() {
  // Variasi animasi untuk mempermudah pemanggilan
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-cream pt-32 pb-20 overflow-hidden">
        {/* Hero Section dengan Gambar */}
        <section className="px-6 md:px-12 lg:px-24 max-w-7xl mx-auto mb-20 md:mb-32 pt-4 md:pt-10">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
            
            {/* Sisi Kiri: Teks */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeUp}
              className="flex-1 text-center md:text-left"
            >
              <p className="font-mono text-xs tracking-widest uppercase text-green mb-4">
                Kenali Kami
              </p>
              <h1 className="font-display font-semibold text-4xl md:text-5xl lg:text-6xl text-forest mb-6 leading-tight">
                Menghidupkan Kembali <br className="hidden xl:block" />
                Sisa Industri Menjadi Energi
              </h1>
              <p className="text-ink/70 text-base md:text-lg max-w-xl mx-auto md:mx-0 leading-relaxed">
                LENTERA hadir sebagai jembatan penghubung antara industri penghasil limbah dengan mitra penyalur energi. Kami percaya bahwa tidak ada yang terbuang sia-sia jika dikelola dengan inovasi dan kepedulian.
              </p>
            </motion.div>

            {/* Sisi Kanan: Gambar Karakter 3D */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, x: 30 }}
              whileInView={{ opacity: 1, scale: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              className="flex-1 flex justify-center md:justify-end w-full"
            >
              <div className="relative w-full max-w-[480px] aspect-square">
                {/* Efek Glow di belakang gambar */}
                <div className="absolute inset-0 bg-green/10 blur-[60px] rounded-full transform -translate-y-10 scale-90 z-0"></div>
                <Image 
                  src="/images/character-tentang-kami.png" 
                  alt="Tim Lentera" 
                  fill
                  className="object-contain relative z-10 drop-shadow-xl"
                  priority
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Visi & Misi */}
        <section className="px-6 md:px-12 lg:px-24 max-w-7xl mx-auto mb-20 md:mb-32">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-8 md:gap-12"
          >
            {/* Visi */}
            <motion.div variants={fadeUp} className="bg-paper rounded-3xl border border-forest/10 p-8 md:p-12 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green/10 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h2 className="font-display font-semibold text-2xl text-forest mb-4">Visi Kami</h2>
              <p className="text-ink/70 leading-relaxed">
                Menjadi pelopor utama dalam transisi energi terbarukan di Indonesia melalui ekosistem pengelolaan limbah industri yang transparan, efisien, dan berkelanjutan.
              </p>
            </motion.div>

            {/* Misi */}
            <motion.div variants={fadeUp} className="bg-paper rounded-3xl border border-forest/10 p-8 md:p-12 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-clay/10 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-clay" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="font-display font-semibold text-2xl text-forest mb-4">Misi Kami</h2>
              <ul className="text-ink/70 space-y-3 leading-relaxed">
                <li className="flex items-start gap-3">
                  <span className="text-green mt-1">✦</span>
                  Memfasilitasi penyerapan limbah industri secara optimal.
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green mt-1">✦</span>
                  Memberdayakan mitra lokal dalam pendistribusian energi alternatif.
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green mt-1">✦</span>
                  Mengurangi jejak karbon nasional demi lingkungan yang lebih sehat.
                </li>
              </ul>
            </motion.div>
          </motion.div>
        </section>

        {/* Nilai Inti */}
        <section className="px-6 md:px-12 lg:px-24 max-w-6xl mx-auto mb-20 md:mb-32">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display font-semibold text-3xl text-forest text-center mb-12"
          >
            Nilai yang Kami Pegang
          </motion.h2>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid sm:grid-cols-3 gap-6"
          >
            {[
              {
                title: "Keberlanjutan",
                desc: "Setiap langkah operasional dirancang untuk memprioritaskan kelestarian alam dan lingkungan sekitar.",
              },
              {
                title: "Transparansi",
                desc: "Sistem yang terbuka membebaskan semua pihak memantau alur limbah hingga menjadi produk energi.",
              },
              {
                title: "Kolaborasi",
                desc: "Membangun sinergi kuat antara pabrik, agen mitra, dan masyarakat untuk kemajuan bersama.",
              },
            ].map((item, idx) => (
              <motion.div 
                key={idx} 
                variants={fadeUp}
                className="bg-cream border border-forest/10 rounded-2xl p-6 md:p-8 hover:bg-white transition-colors shadow-sm hover:shadow-md"
              >
                <h3 className="font-display font-semibold text-lg text-forest mb-2">{item.title}</h3>
                <p className="text-sm text-ink/70 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* CTA Pendek */}
        <section className="px-6 max-w-4xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-forest rounded-3xl p-10 md:p-16 relative overflow-hidden"
          >
            {/* Ornamen dekoratif */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-green opacity-20 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-clay opacity-20 blur-[60px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
            
            <h2 className="font-display font-semibold text-3xl md:text-4xl text-paper mb-6 relative z-10">
              Mari Menjadi Bagian dari Perubahan
            </h2>
            <p className="text-paper/80 mb-8 max-w-lg mx-auto relative z-10">
              Gabung bersama ratusan industri dan mitra lainnya untuk mewujudkan kemandirian energi nasional.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <Link 
                href="/daftar" 
                className="px-8 py-3.5 bg-green text-paper rounded-full font-medium hover:bg-green/90 transition-colors w-full sm:w-auto"
              >
                Bergabung Sekarang
              </Link>
              <Link 
                href="/#kontak" 
                className="px-8 py-3.5 bg-transparent border-2 border-paper/20 text-paper rounded-full font-medium hover:bg-paper/10 transition-colors w-full sm:w-auto"
              >
                Hubungi Kami
              </Link>
            </div>
          </motion.div>
        </section>
      </main>
    </>
  );
}