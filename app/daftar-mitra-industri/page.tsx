"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Navbar } from "@/components/navbar";

type PartnerUser = {
  id: string;
  nama: string;
  alamat: string;
  tanggalBergabung: string;
  tipe: "mitra" | "industri";
};

export default function DaftarMitraIndustriPage() {
  const [partners, setPartners] = useState<PartnerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"semua" | "mitra" | "industri">("semua");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchPartners() {
      try {
        const res = await fetch("/api/partners");
        const data = await res.json();

        if (Array.isArray(data)) {
          setPartners(data);
        }
      } catch (err) {
        console.error("Gagal mengambil data dari API:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPartners();
  }, []);

  const filteredData = partners.filter((item) => {
    const matchFilter = filter === "semua" || item.tipe === filter;
    const matchSearch =
      (item.nama && item.nama.toLowerCase().includes(search.toLowerCase())) ||
      (item.alamat && item.alamat.toLowerCase().includes(search.toLowerCase()));
    return matchFilter && matchSearch;
  });

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-cream pt-28 md:pt-36 pb-20">
        <section className="px-4 sm:px-6 md:px-12 lg:px-24 max-w-7xl mx-auto">

          {/* HEADER */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto mb-8 md:mb-14"
          >
            <h1 className="font-display font-semibold text-3xl sm:text-4xl md:text-5xl text-forest mb-4">
              Daftar Mitra & Industri
            </h1>
            <p className="text-ink/70 text-sm md:text-base">
              Berikut adalah daftar pelaku industri dan agen penyalur yang telah terdaftar dalam jaringan konversi energi LENTERA.
            </p>
          </motion.div>

          {/* FILTER & PENCARIAN */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div className="flex bg-paper border border-forest/10 p-1.5 rounded-2xl w-full sm:w-auto">
              {(["semua", "industri", "mitra"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-medium capitalize transition-all flex-1 sm:flex-none ${
                    filter === tab
                      ? "bg-forest text-cream shadow-xs"
                      : "text-ink/60 hover:text-forest"
                  }`}
                >
                  {tab === "semua" ? "Semua" : tab === "industri" ? "Industri" : "Mitra Agen"}
                </button>
              ))}
            </div>

            <div className="w-full sm:w-72">
              <input
                type="text"
                placeholder="Cari nama atau lokasi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-paper border border-forest/15 rounded-2xl px-4 py-2.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-green focus:border-green transition-all"
              />
            </div>
          </div>

          {/* CONTAINER DATA RESPONSIVE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {loading ? (
              <div className="bg-paper border border-forest/10 rounded-3xl p-12 text-center text-ink/60 text-sm animate-pulse">
                Memuat data mitra & industri dari Supabase...
              </div>
            ) : filteredData.length > 0 ? (
              <>
                {/* 1. LAYOUT MOBILE CARD (Layar HP) */}
                <div className="grid grid-cols-1 gap-3 md:hidden">
                  {filteredData.map((item, index) => (
                    <div
                      key={`${item.id}-${item.tipe}-${index}`}
                      className="bg-paper border border-forest/10 rounded-2xl p-4 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-forest text-base leading-snug">
                          {item.nama}
                        </h3>
                        <span
                          className={`shrink-0 text-[10px] font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            item.tipe === "industri"
                              ? "bg-clay/15 text-clay-dark"
                              : "bg-green/15 text-green"
                          }`}
                        >
                          {item.tipe === "industri" ? "Industri" : "Mitra Agen"}
                        </span>
                      </div>

                      <div className="text-xs text-ink/70 flex items-start gap-1.5">
                        <span className="shrink-0">📍</span>
                        <span className="break-words">{item.alamat}</span>
                      </div>

                      <div className="pt-2 border-t border-forest/5 flex items-center justify-between text-[11px] text-ink/50">
                        <span>Bergabung:</span>
                        <span>📅 {item.tanggalBergabung}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 2. LAYOUT TABEL DESKTOP (Layar Tablet & Laptop) */}
                <div className="hidden md:block bg-paper border border-forest/10 rounded-3xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[650px]">
                      <thead>
                        <tr className="border-b border-forest/10 bg-cream/40 text-forest font-display text-xs uppercase tracking-wider">
                          <th className="py-4 px-6 font-semibold">Nama Instansi / Mitra</th>
                          <th className="py-4 px-6 font-semibold">Tipe</th>
                          <th className="py-4 px-6 font-semibold">Alamat</th>
                          <th className="py-4 px-6 font-semibold">Tanggal Bergabung</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-forest/5 text-sm text-ink/80">
                        {filteredData.map((item, index) => (
                          <tr key={`${item.id}-${item.tipe}-${index}`} className="hover:bg-cream/20 transition-colors">
                            <td className="py-4 px-6 font-medium text-forest">
                              {item.nama}
                            </td>
                            <td className="py-4 px-6">
                              <span
                                className={`inline-block text-[11px] font-mono px-3 py-1 rounded-full uppercase tracking-wider ${
                                  item.tipe === "industri"
                                    ? "bg-clay/15 text-clay-dark"
                                    : "bg-green/15 text-green"
                                }`}
                              >
                                {item.tipe === "industri" ? "Industri" : "Mitra Agen"}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-ink/70">
                              📍 {item.alamat}
                            </td>
                            <td className="py-4 px-6 text-ink/60 text-xs">
                              📅 {item.tanggalBergabung}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-paper border border-forest/10 rounded-3xl text-center py-16 text-ink/50 text-sm">
                Tidak ada data mitra atau industri yang ditemukan.
              </div>
            )}
          </motion.div>

        </section>
      </main>
    </>
  );
}