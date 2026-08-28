"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Navbar } from "@/components/navbar";
import Link from "next/link";

export default function EdukasiPage() {
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-cream pt-28 md:pt-36 pb-20 overflow-hidden">
        {/* HERO SECTION */}
        <section className="px-6 md:px-12 lg:px-24 max-w-7xl mx-auto mb-16 md:mb-28">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">

            {/* Teks Hero */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="flex-1 text-center md:text-left z-10"
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-green/10 text-green font-mono text-xs px-4 py-2 rounded-full uppercase tracking-wider mb-5">
                <span>📚</span> Pusat Edukasi
              </motion.div>
              <motion.h1 variants={fadeUp} className="font-display font-semibold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-forest mb-5 leading-tight">
                Pahami Limbah, <br className="hidden md:block" />
                <span className="text-green">Ciptakan Energi.</span>
              </motion.h1>
              <motion.p variants={fadeUp} className="text-ink/70 text-sm sm:text-base md:text-lg max-w-xl mx-auto md:mx-0 leading-relaxed mb-8">
                Tidak semua limbah industri harus berakhir di pembuangan. Pelajari bagaimana LENTERA memproses sisa produksi menjadi sumber energi terbarukan yang aman dan bermanfaat.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                <a href="#materi" className="bg-forest text-cream font-medium px-8 py-3.5 rounded-full hover:bg-forest/90 transition-colors w-full sm:w-auto text-center shadow-sm">
                  Mulai Belajar
                </a>
              </motion.div>
            </motion.div>

            {/* Karakter 3D Animasi & Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex-1 relative flex flex-col items-center justify-center w-full max-w-[320px] sm:max-w-[380px] md:max-w-full mx-auto"
            >
              {/* Efek Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px] md:w-[400px] md:h-[400px] bg-gold/20 blur-[70px] rounded-full z-0"></div>

              {/* Container Gambar Karakter */}
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10 w-full aspect-square flex items-center justify-center"
              >
                <Image
                  src="/images/edukasi-character.png"
                  alt="Karakter Edukasi LENTERA"
                  width={380}
                  height={380}
                  className="object-contain w-full h-auto drop-shadow-2xl"
                  priority
                />
              </motion.div>

              {/* Float Card Hiasan (Diposisikan aman di bawah karakter pada mobile, absolute di desktop) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="mt-4 md:mt-0 md:absolute md:bottom-2 md:right-4 bg-paper/95 backdrop-blur-md p-3.5 rounded-2xl border border-forest/10 shadow-lg z-20 w-full max-w-[240px] md:max-w-[150px] text-center md:text-left"
              >
                <p className="font-display font-bold text-forest text-xs">Fakta Menarik 💡</p>
                <p className="text-[11px] text-ink/60 mt-0.5 leading-tight">1 ton limbah sawit bisa terangi 50 rumah.</p>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* SECTION MATERI: JENIS LIMBAH */}
        <section id="materi" className="px-6 md:px-12 lg:px-24 max-w-7xl mx-auto mb-16 md:mb-28 scroll-mt-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeUp}
            className="text-center mb-10 md:mb-14"
          >
            <h2 className="font-display font-semibold text-2xl sm:text-3xl md:text-4xl text-forest mb-3">Jenis Limbah yang Kami Olah</h2>
            <p className="text-ink/70 text-sm md:text-base max-w-2xl mx-auto px-4">Kenali berbagai macam limbah industri yang memiliki potensi besar untuk dikonversi menjadi energi alternatif pengganti batu bara.</p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              {
                title: "Biomassa Pertanian",
                desc: "Sisa panen, cangkang sawit, dan ampas tebu yang diubah menjadi bio-pelet berkalori tinggi.",
                color: "bg-green/10 text-green",
                icon: "🌿"
              },
              {
                title: "Limbah Kayu & Kertas",
                desc: "Serbuk gergaji, potongan kayu, dan sisa bubur kertas yang dipadatkan untuk bahan bakar boiler pabrik.",
                color: "bg-gold/10 text-gold-dark",
                icon: "🪵"
              },
              {
                title: "Limbah Organik Pabrik",
                desc: "Sisa pengolahan makanan atau lumpur organik (sludge) yang diproses melalui reaktor biogas.",
                color: "bg-clay/10 text-clay-dark",
                icon: "🏭"
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="bg-paper rounded-3xl p-6 sm:p-8 border border-forest/10 shadow-xs hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center text-xl mb-5`}>
                  {item.icon}
                </div>
                <h3 className="font-display font-semibold text-lg md:text-xl text-forest mb-2.5">{item.title}</h3>
                <p className="text-sm text-ink/70 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* SECTION: ALUR KONVERSI */}
        <section className="px-6 md:px-12 lg:px-24 max-w-5xl mx-auto mb-16 md:mb-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeUp}
            className="bg-forest rounded-[2.5rem] md:rounded-[3rem] p-8 sm:p-12 md:p-16 text-cream relative overflow-hidden shadow-lg"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-green opacity-20 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2"></div>

            <div className="text-center mb-10 md:mb-14 relative z-10">
              <h2 className="font-display font-semibold text-2xl sm:text-3xl md:text-4xl mb-3">Bagaimana Prosesnya?</h2>
              <p className="text-cream/70 text-sm md:text-base">Tiga tahap utama mengubah sisa industri menjadi energi terjangkau.</p>
            </div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid md:grid-cols-3 gap-8 relative z-10"
            >
              {[
                { step: "01", title: "Pengumpulan", desc: "Penjemputan limbah dari pabrik mitra langsung ke fasilitas LENTERA." },
                { step: "02", title: "Konversi Energi", desc: "Pemisahan, pengeringan, dan pemadatan limbah menjadi produk bahan bakar." },
                { step: "03", title: "Distribusi", desc: "Penyaluran energi ke agen lokal dengan harga yang jauh lebih kompetitif." }
              ].map((item, idx) => (
                <motion.div key={idx} variants={fadeUp} className="relative">
                  <div className="w-10 h-10 rounded-full bg-cream/10 border border-cream/20 flex items-center justify-center font-mono font-bold text-green mb-4 relative z-10 backdrop-blur-xs text-sm">
                    {item.step}
                  </div>
                  <h3 className="font-display font-semibold text-lg md:text-xl mb-2">{item.title}</h3>
                  <p className="text-sm text-cream/60 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* CTA SECTION */}
        <section className="px-6 max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display font-semibold text-2xl md:text-3xl text-forest mb-3">
              Siap untuk berkontribusi?
            </h2>
            <p className="text-ink/70 text-sm md:text-base mb-6">
              Praktekkan langsung ilmu ini. Daftarkan industri Anda atau jadilah agen penyalur energi di daerahmu.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/daftar/industri" className="w-full sm:w-auto px-8 py-3.5 bg-forest text-cream rounded-full font-medium hover:bg-forest/90 transition-colors text-center text-sm shadow-sm">
                Gabung sebagai Industri
              </Link>
              <Link href="/daftar/mitra" className="w-full sm:w-auto px-8 py-3.5 bg-transparent border-2 border-forest/20 text-forest rounded-full font-medium hover:bg-forest/5 transition-colors text-center text-sm">
                Jadi Mitra Agen
              </Link>
            </div>
          </motion.div>
        </section>

      </main>
    </>
  );
}