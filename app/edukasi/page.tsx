"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Navbar } from "@/components/navbar";
import Link from "next/link";

interface BeritaItem {
  id: number;
  kategori: string;
  tanggal: string;
  baca: string;
  judul: string;
  ringkasan: string;
  kontenLengkap: string;
  icon: string;
  tagColor: string;
}

export default function EdukasiPage() {
  const [selectedBerita, setSelectedBerita] = useState<BeritaItem | null>(null);

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

  const artikelBerita: BeritaItem[] = [
    {
      id: 1,
      kategori: "Inovasi Bioenergi",
      tanggal: "28 Agustus 2026",
      baca: "3 min baca",
      judul: "Pemanfaatan Biomassa Kelapa Sawit untuk Co-Firing PLTU Nasional",
      ringkasan: "Cangkang dan janjang kosong kelapa sawit terbukti memiliki nilai kalor hingga 4.000 kcal/kg, menjadi substitusi efektif batu bara.",
      kontenLengkap: "Berdasarkan data Kementerian ESDM, substitusi batu bara dengan biomassa (co-firing) pada PLTU mampu menurunkan emisi karbon secara signifikan tanpa mengubah struktur dasar boiler. Cangkang sawit dan pelet kayu memiliki kadar abu (ash content) yang jauh lebih rendah dibanding batu bara mentah, sehingga mereduksi akumulasi kerak pada mesin pembakaran industri.",
      icon: "⚡",
      tagColor: "bg-green/10 text-green",
    },
    {
      id: 2,
      kategori: "Regulasi Lingkungan",
      tanggal: "20 Agustus 2026",
      baca: "4 min baca",
      judul: "Digitalisasi Manifes Limbah B3 Sesuai Standar Permen LHK No. 6/2021",
      ringkasan: "Pengawasan pengolahan limbah industri kini berbasis digital melalui pelaporan integratif guna memastikan transparansi audit lingkungan.",
      kontenLengkap: "Penerapan Permen LHK No. 6 Tahun 2021 mewajibkan setiap penghasil dan pengolah limbah Bahan Berbahaya dan Beracun (B3) mencatat alur limbah secara akurat dari titik asal hingga pemusnahan akhir. Platform LENTERA menyelaraskan pencatatan internal industri dengan standar manifes elektronik untuk mempermudah kesiapan sertifikasi dan audit ESG.",
      icon: "📜",
      tagColor: "bg-amber-100 text-amber-800",
    },
    {
      id: 3,
      kategori: "Ekonomi Sirkular",
      tanggal: "12 Agustus 2026",
      baca: "5 min baca",
      judul: "Peluang Nilai Ekonomi Karbon (NEK) Bagi Industri Pengolah Residu",
      ringkasan: "Implementasi Perpres No. 98/2021 membuka peluang bagi manufaktur untuk mengubah pengurangan emisi menjadi aset kredit karbon.",
      kontenLengkap: "Melalui skema Ekonomi Sirkular, limbah kayu dan residu organik tidak lagi dianggap sebagai beban biaya operasional (cost center). Pengolahan limbah menjadi bahan bakar alternatif memungkinkan perusahaan mengklaim reduksi emisi gas rumah kaca (GRK) yang terekam dalam Sistem Registri Nasional (SRN-PPI), meningkatkan pemeringkatan sertifikasi hijau industri.",
      icon: "🌱",
      tagColor: "bg-gold/15 text-gold-dark",
    },
  ];

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-cream pt-28 md:pt-36 pb-20 overflow-hidden">
        {/* HERO SECTION */}
        <section className="px-6 md:px-12 lg:px-24 max-w-7xl mx-auto mb-16 md:mb-24">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">

            {/* Teks Hero */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="flex-1 text-center md:text-left z-10"
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-green/10 text-green font-mono text-xs px-4 py-2 rounded-full uppercase tracking-wider mb-5">
                <span>📚</span> Pusat Edukasi & Literasi
              </motion.div>
              <motion.h1 variants={fadeUp} className="font-display font-semibold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-forest mb-5 leading-tight">
                Pahami Limbah, <br className="hidden md:block" />
                <span className="text-green">Ciptakan Energi.</span>
              </motion.h1>
              <motion.p variants={fadeUp} className="text-ink/70 text-sm sm:text-base md:text-lg max-w-xl mx-auto md:mx-0 leading-relaxed mb-8">
                Tidak semua limbah industri harus berakhir di pembuangan. Pelajari bagaimana LENTERA memproses sisa produksi menjadi sumber energi terbarukan yang aman, efisien, dan bermanfaat bagi masyarakat.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                <a href="#materi" className="bg-forest text-cream font-medium px-8 py-3.5 rounded-full hover:bg-forest/90 transition-colors w-full sm:w-auto text-center shadow-sm">
                  Mulai Belajar
                </a>
                <a href="#wawasan" className="bg-transparent border border-forest/20 text-forest font-medium px-8 py-3.5 rounded-full hover:bg-forest/5 transition-colors w-full sm:w-auto text-center">
                  Baca Berita
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
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px] md:w-[400px] md:h-[400px] bg-gold/20 blur-[70px] rounded-full z-0"></div>

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

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="mt-4 md:mt-0 md:absolute md:bottom-2 md:right-4 bg-paper/95 backdrop-blur-md p-3.5 rounded-2xl border border-forest/10 shadow-lg z-20 w-full max-w-[240px] md:max-w-[150px] text-center md:text-left"
              >
                <p className="font-display font-bold text-forest text-xs">Fakta Kalori 💡</p>
                <p className="text-[11px] text-ink/60 mt-0.5 leading-tight">Biomassa sawit memiliki nilai kalor ~4.000 kcal/kg.</p>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* SECTION PARAGRAF EDUKASI TAMBAHAN */}
        <section className="px-6 md:px-12 lg:px-24 max-w-7xl mx-auto mb-16 md:mb-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-8 items-center bg-paper rounded-3xl p-8 md:p-12 border border-forest/10 shadow-xs"
          >
            <motion.div variants={fadeUp} className="space-y-4">
              <span className="font-mono text-xs uppercase tracking-widest text-green font-semibold">
                Mengapa Harus Bio-Energi?
              </span>
              <h2 className="font-display font-semibold text-2xl sm:text-3xl text-forest leading-snug">
                Solusi Berkelanjutan untuk Mengatasi Krisis Energi & Residu Industri
              </h2>
              <p className="text-ink/70 text-sm md:text-base leading-relaxed">
                Setiap tahunnya, jutaan ton limbah industri organik dan limbah kayu dibuang begitu saja tanpa pengolahan optimal. Padahal, residu ini menyimpan potensi energi panas dan listrik yang sangat tinggi jika diproses dengan teknologi konversi yang tepat.
              </p>
              <p className="text-ink/70 text-sm md:text-base leading-relaxed">
                Melalui rantai **Ekonomi Sirkular**, LENTERA membantu manufaktur mengubah biaya pembuangan limbah menjadi nilai tambah ekonomi. Kami tidak hanya mengurangi ketergantungan pada batu bara, tetapi juga menciptakan ekosistem energi alternatif yang terjangkau bagi para mitra agen di daerah.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4">
              <div className="bg-cream p-5 rounded-2xl border border-forest/10">
                <p className="font-display font-bold text-3xl text-forest mb-1">~4.000</p>
                <p className="text-xs text-ink/60 leading-relaxed">kcal/kg estimasi nilai kalor pelet biomassa sawit terstandardisasi.</p>
              </div>
              <div className="bg-cream p-5 rounded-2xl border border-forest/10">
                <p className="font-display font-bold text-3xl text-green mb-1">Low-Ash</p>
                <p className="text-xs text-ink/60 leading-relaxed">Residu abu pembakaran lebih rendah dibanding batu bara mentah.</p>
              </div>
              <div className="bg-cream p-5 rounded-2xl border border-forest/10">
                <p className="font-display font-bold text-3xl text-gold-dark mb-1">SRN-PPI</p>
                <p className="text-xs text-ink/60 leading-relaxed">Kesesuaian skema pencatatan reduksi emisi karbon nasional.</p>
              </div>
              <div className="bg-cream p-5 rounded-2xl border border-forest/10">
                <p className="font-display font-bold text-3xl text-clay-dark mb-1">100%</p>
                <p className="text-xs text-ink/60 leading-relaxed">Alur pengolahan terverifikasi pada sistem digital LENTERA.</p>
              </div>
            </motion.div>
          </motion.div>
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

        {/* SECTION BERITA & ARTIKEL EDUKASI */}
        <section id="wawasan" className="px-6 md:px-12 lg:px-24 max-w-7xl mx-auto mb-16 md:mb-28 scroll-mt-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeUp}
            className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-12 gap-4"
          >
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-green mb-1">Artikel & Berita</p>
              <h2 className="font-display font-semibold text-2xl sm:text-3xl md:text-4xl text-forest">
                Kabar Terkini seputar Energi & Lingkungan
              </h2>
            </div>
            <p className="text-xs text-ink/50 max-w-xs">
              Rangkuman informasi dan wawasan terkini industri bio-energi yang dikemas secara terpercaya.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-6"
          >
            {artikelBerita.map((art) => (
              <motion.article
                key={art.id}
                variants={fadeUp}
                onClick={() => setSelectedBerita(art)}
                className="bg-paper rounded-3xl p-6 border border-forest/10 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${art.tagColor}`}>
                      {art.kategori}
                    </span>
                    <span className="text-[11px] text-ink/40 font-mono">{art.baca}</span>
                  </div>

                  <h3 className="font-display font-semibold text-base md:text-lg text-forest mb-2.5 leading-snug group-hover:text-green transition-colors">
                    {art.judul}
                  </h3>

                  <p className="text-xs text-ink/70 leading-relaxed line-clamp-3 mb-6">
                    {art.ringkasan}
                  </p>
                </div>

                <div className="pt-4 border-t border-forest/10 flex justify-between items-center text-xs text-ink/50">
                  <span>{art.tanggal}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBerita(art);
                    }}
                    className="text-forest font-semibold hover:text-green transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    Baca Selengkapnya <span>→</span>
                  </button>
                </div>
              </motion.article>
            ))}
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

        {/* POP-UP MODAL DETAIL BERITA */}
        {selectedBerita && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-paper border border-forest/10 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto"
            >
              <button
                onClick={() => setSelectedBerita(null)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-forest/5 text-ink/40 hover:text-ink transition-colors cursor-pointer"
                aria-label="Tutup Modal"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>

              <div className="flex items-center gap-3 mb-4">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${selectedBerita.tagColor}`}>
                  {selectedBerita.kategori}
                </span>
                <span className="text-xs text-ink/40 font-mono">• {selectedBerita.tanggal}</span>
                <span className="text-xs text-ink/40 font-mono">• {selectedBerita.baca}</span>
              </div>

              <h2 className="font-display font-semibold text-xl sm:text-2xl text-forest mb-4 leading-snug">
                {selectedBerita.judul}
              </h2>

              <div className="space-y-4 text-ink/80 text-sm leading-relaxed border-t border-forest/10 pt-4">
                <p className="font-medium text-forest italic">
                  "{selectedBerita.ringkasan}"
                </p>
                <p>{selectedBerita.kontenLengkap}</p>
              </div>

              <div className="mt-8 pt-4 border-t border-forest/10 flex justify-between items-center">
                <span className="text-xs text-ink/40">Sumber: Data Kementerian LHK & ESDM</span>
                <button
                  onClick={() => setSelectedBerita(null)}
                  className="bg-forest text-cream px-6 py-2.5 rounded-full text-xs font-medium hover:bg-forest/90 transition-colors cursor-pointer"
                >
                  Tutup Artikel
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </main>
    </>
  );
}