"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Navbar } from "@/components/navbar";
import Link from "next/link";
import emailjs from "@emailjs/browser";

export default function KontakPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    subjek: "",
    pesan: "",
  });


  const EMAILJS_SERVICE_ID = "service_6j63tdv";
  const EMAILJS_TEMPLATE_ID = "template_4ic5usv";
  const EMAILJS_PUBLIC_KEY = "PTy_MgwBbnS8HonnN";

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_name: formData.nama,
          from_email: formData.email,
          subject: formData.subjek,
          message: formData.pesan,
        },
        EMAILJS_PUBLIC_KEY
      );

      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({ nama: "", email: "", subjek: "", pesan: "" });
    } catch (error) {
      console.error("Gagal mengirim email:", error);
      alert("Gagal mengirim pesan. Silakan coba lagi nanti.");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-cream pt-28 md:pt-36 pb-20">
        <section className="px-6 md:px-12 lg:px-24 max-w-7xl mx-auto">

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-center max-w-3xl mx-auto mb-12 md:mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-green/10 text-green font-mono text-xs px-4 py-2 rounded-full uppercase tracking-wider mb-5">
              <span>💬</span> Hubungi Kami
            </div>
            <h1 className="font-display font-semibold text-3xl sm:text-4xl md:text-5xl text-forest mb-5 leading-tight">
              Ada Pertanyaan? <br />
              <span className="text-green">Kami Siap Membantu.</span>
            </h1>
            <p className="text-ink/70 text-sm sm:text-base md:text-lg leading-relaxed">
              Ingin berkolaborasi sebagai industri, mendaftar sebagai mitra agen, atau sekadar bertanya mengenai layanan LENTERA? Kirimkan pesan Anda di bawah ini.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-10 md:gap-12 items-start">

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2 space-y-6"
            >
              <div className="bg-forest rounded-3xl p-8 text-cream relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 w-40 h-40 bg-green opacity-20 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3"></div>

                <h3 className="font-display font-semibold text-xl mb-6 text-cream">Informasi Kontak</h3>

                <div className="space-y-6 text-sm relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-cream/10 border border-cream/20 flex items-center justify-center shrink-0 text-lg">
                      ✉️
                    </div>
                    <div>
                      <p className="text-cream/60 text-xs mb-1">Email Resmi</p>
                      <a href="mailto:lentera1.idn@gmail.com" className="font-medium text-cream hover:text-green transition-colors break-all">
                        lentera1.idn@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-cream/10 border border-cream/20 flex items-center justify-center shrink-0 text-lg">
                      📍
                    </div>
                    <div>
                      <p className="text-cream/60 text-xs mb-1">Lokasi Kantor</p>
                      <p className="font-medium text-cream leading-relaxed">
                        Indonesia
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-cream/10 border border-cream/20 flex items-center justify-center shrink-0 text-lg">
                      ⏰
                    </div>
                    <div>
                      <p className="text-cream/60 text-xs mb-1">Jam Operasional</p>
                      <p className="font-medium text-cream">
                        Senin - Jumat (08:00 - 17:00 WIB)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-6 border-t border-cream/10 flex gap-3">
                  <Link href="/daftar/industri" className="text-xs bg-cream/10 hover:bg-cream/20 border border-cream/20 px-4 py-2.5 rounded-full transition-colors text-cream font-medium">
                    Mitra Industri
                  </Link>
                  <Link href="/daftar/mitra" className="text-xs bg-cream/10 hover:bg-cream/20 border border-cream/20 px-4 py-2.5 rounded-full transition-colors text-cream font-medium">
                    Agen Penyalur
                  </Link>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-3 bg-paper rounded-3xl p-6 sm:p-8 md:p-10 border border-forest/10 shadow-sm"
            >
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green/10 text-green rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                    ✓
                  </div>
                  <h3 className="font-display font-semibold text-2xl text-forest mb-2">Pesan Terkirim!</h3>
                  <p className="text-ink/70 text-sm max-w-md mx-auto mb-6">
                    Terima kasih telah menghubungi LENTERA. Pesan kamu sudah masuk ke inbox email kami.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="bg-forest text-cream font-medium px-6 py-2.5 rounded-full text-sm hover:bg-forest/90 transition-colors cursor-pointer"
                  >
                    Kirim Pesan Lain
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h3 className="font-display font-semibold text-xl text-forest mb-2">Kirim Pesan</h3>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-medium text-ink/70 mb-2">Nama Lengkap</label>
                      <input
                        type="text"
                        required
                        placeholder="Masukkan nama kamu"
                        value={formData.nama}
                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                        className="w-full bg-cream/50 border border-forest/15 rounded-xl px-4 py-3 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-green focus:border-green transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ink/70 mb-2">Alamat Email</label>
                      <input
                        type="email"
                        required
                        placeholder="nama@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-cream/50 border border-forest/15 rounded-xl px-4 py-3 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-green focus:border-green transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-ink/70 mb-2">Subjek / Topik</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Pertanyaan Kemitraan Limbah Sawit"
                      value={formData.subjek}
                      onChange={(e) => setFormData({ ...formData, subjek: e.target.value })}
                      className="w-full bg-cream/50 border border-forest/15 rounded-xl px-4 py-3 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-green focus:border-green transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-ink/70 mb-2">Pesan Anda</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Tuliskan detail pertanyaan atau penawaran kerja sama..."
                      value={formData.pesan}
                      onChange={(e) => setFormData({ ...formData, pesan: e.target.value })}
                      className="w-full bg-cream/50 border border-forest/15 rounded-xl px-4 py-3 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-green focus:border-green transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-forest text-cream font-medium py-3.5 rounded-xl hover:bg-forest/90 transition-colors shadow-sm text-sm disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? "Mengirim Pesan..." : "Kirim Pesan"}
                  </button>
                </form>
              )}
            </motion.div>

          </div>
        </section>
      </main>
    </>
  );
}