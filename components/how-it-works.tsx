"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Reveal } from "./ui/reveal";

const accentStyles = {
  green: {
    text: "text-green",
    bg: "bg-green",
    softBg: "bg-green/8",
    border: "border-green",
    ring: "#2F6B3F",
  },
  gold: {
    text: "text-gold",
    bg: "bg-gold",
    softBg: "bg-gold/10",
    border: "border-gold",
    ring: "#C99A3D",
  },
  clay: {
    text: "text-clay",
    bg: "bg-clay",
    softBg: "bg-clay/8",
    border: "border-clay",
    ring: "#7A5738",
  },
} as const;

type Accent = keyof typeof accentStyles;

const tabs: {
  number: string;
  title: string;
  description: string;
  points: string[];
  accent: Accent;
  windowLabel: string;
}[] = [
  {
    number: "01",
    title: "Kumpulkan",
    description:
      "Limbah industri dikumpulkan langsung dari kawasan pabrik mitra sumber melalui jadwal yang disepakati bersama. Setiap pengumpulan dicatat berdasarkan titik asal, jenis limbah, dan volume yang diangkut, sehingga seluruh proses bisa ditelusuri sejak dari sumbernya.",
    points: [
      "Jadwal pengumpulan disepakati per kawasan industri",
      "Pencatatan jenis & volume limbah di titik asal",
      "Armada terintegrasi dengan sistem pelacakan",
    ],
    accent: "green",
    windowLabel: "titik-pengumpulan.lentera.id",
  },
  {
    number: "02",
    title: "Olah",
    description:
      "Limbah yang terkumpul diproses di fasilitas pengolahan LENTERA melalui tahap pemilahan, penghancuran, dan konversi menjadi energi. Setiap tahap diawasi secara berkala untuk menjaga efisiensi dan keamanan proses produksi.",
    points: [
      "Pemilahan otomatis berdasarkan jenis limbah",
      "Konversi memakai teknologi ramah lingkungan",
      "Pemantauan kualitas di tiap tahap produksi",
    ],
    accent: "gold",
    windowLabel: "status-pengolahan.lentera.id",
  },
  {
    number: "03",
    title: "Salurkan",
    description:
      "Energi hasil olahan disalurkan melalui jaringan mitra dan agen ke berbagai wilayah. Distribusi dilakukan secara terjadwal agar pasokan tetap stabil dan bisa diandalkan oleh seluruh mitra LENTERA.",
    points: [
      "Distribusi terjadwal ke seluruh titik mitra",
      "Skema harga kompetitif untuk semua mitra",
      "Dukungan logistik dari tim LENTERA",
    ],
    accent: "clay",
    windowLabel: "distribusi-energi.lentera.id",
  },
];

function WindowChrome({ accent, label }: { accent: Accent; label: string }) {
  return (
    <div className="flex items-center gap-2 px-5 py-4 border-b border-forest/8">
      <span className={`w-2.5 h-2.5 rounded-full ${accentStyles[accent].bg}`} />
      <span className="w-2.5 h-2.5 rounded-full bg-forest/15" />
      <span className="w-2.5 h-2.5 rounded-full bg-forest/15" />
      <span className="ml-2 font-mono text-xs text-ink/40">{label}</span>
    </div>
  );
}

function CollectMockup({ accent }: { accent: Accent }) {
  const points = [
    { name: "Kawasan Industri Cikarang", status: "Terjadwal", active: true },
    { name: "Kawasan Industri Medan", status: "Terjadwal", active: true },
    { name: "Kawasan Industri Surabaya", status: "Menunggu", active: false },
  ];
  return (
    <div className="p-6 md:p-8">
      <p className="font-mono text-[11px] tracking-widest uppercase text-ink/40 mb-4">
        Jadwal pengumpulan hari ini
      </p>
      <div className="space-y-2.5 mb-8">
        {points.map((p) => (
          <div
            key={p.name}
            className="flex items-center justify-between bg-cream rounded-xl px-4 py-3"
          >
            <span className="text-sm text-forest font-medium">{p.name}</span>
            <span
              className={`text-xs font-mono px-2.5 py-1 rounded-full ${
                p.active
                  ? `${accentStyles[accent].softBg} ${accentStyles[accent].text}`
                  : "bg-forest/5 text-ink/40"
              }`}
            >
              {p.status}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-end justify-between border-t border-forest/8 pt-6">
        <div>
          <p className="text-xs text-ink/45 mb-1">Total dikumpulkan</p>
          <p className="font-display font-semibold text-3xl text-forest">
            120 <span className="text-sm font-body font-medium text-ink/45">ton/hari</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function ProcessMockup({ accent }: { accent: Accent }) {
  const percent = 78;
  const r = 54;
  const c = 2 * Math.PI * r;
  return (
    <div className="p-6 md:p-8">
      <p className="font-mono text-[11px] tracking-widest uppercase text-ink/40 mb-6">
        Status pengolahan real-time
      </p>
      <div className="flex items-center gap-8">
        <svg width="140" height="140" viewBox="0 0 140 140" className="shrink-0">
          <circle cx="70" cy="70" r={r} fill="none" stroke="#EAF3E7" strokeWidth="12" />
          <motion.circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke={accentStyles[accent].ring}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c - (percent / 100) * c }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            transform="rotate(-90 70 70)"
          />
          <text
            x="70"
            y="76"
            textAnchor="middle"
            className="font-display"
            fontSize="26"
            fontWeight="700"
            fill="#17301F"
          >
            {percent}%
          </text>
        </svg>
        <div className="space-y-4 flex-1">
          <div>
            <div className="flex justify-between text-xs text-ink/45 mb-1.5">
              <span>Kapasitas terpakai</span>
              <span>78%</span>
            </div>
            <div className="h-1.5 bg-forest/8 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${accentStyles[accent].bg}`}
                initial={{ width: 0 }}
                animate={{ width: "78%" }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-ink/45 mb-1.5">
              <span>Rata-rata konversi</span>
              <span>92%</span>
            </div>
            <div className="h-1.5 bg-forest/8 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${accentStyles[accent].bg}`}
                initial={{ width: 0 }}
                animate={{ width: "92%" }}
                transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DistributeMockup({ accent }: { accent: Accent }) {
  const bars = [40, 65, 50, 80, 62, 95];
  const labels = ["Mar", "Apr", "Mei", "Jun", "Jul", "Ags"];
  return (
    <div className="p-6 md:p-8">
      <p className="font-mono text-[11px] tracking-widest uppercase text-ink/40 mb-6">
        Energi tersalurkan per bulan
      </p>
      <div className="flex items-end justify-between gap-3 h-32 mb-3">
        {bars.map((h, i) => (
          <motion.div
            key={labels[i]}
            className={`flex-1 rounded-t-lg ${accentStyles[accent].bg} ${
              i === bars.length - 1 ? "" : "opacity-70"
            }`}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ duration: 0.7, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </div>
      <div className="flex justify-between mb-8">
        {labels.map((l) => (
          <span key={l} className="text-xs text-ink/40 flex-1 text-center">
            {l}
          </span>
        ))}
      </div>
      <div className="border-t border-forest/8 pt-6">
        <p className="text-xs text-ink/45 mb-1">Bulan ini</p>
        <p className="font-display font-semibold text-3xl text-forest">
          3.240 <span className="text-sm font-body font-medium text-ink/45">MWh</span>
        </p>
      </div>
    </div>
  );
}

const mockups = [CollectMockup, ProcessMockup, DistributeMockup];

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const tab = tabs[active];
  const Mockup = mockups[active];

  return (
    <section id="cara-kerja" className="py-24 md:py-28 px-6 md:px-10 bg-paper">
      <div className="max-w-7xl mx-auto">
        <Reveal className="max-w-xl mb-14 md:mb-16">
          <p className="font-mono text-xs tracking-widest uppercase text-green mb-3">
            Cara kerja
          </p>
          <h2 className="font-display font-semibold text-3xl md:text-4xl text-forest">
            Satu alur, dari pabrik sampai ke masyarakat.
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-[minmax(0,360px)_1fr] gap-4 md:gap-14 items-start">
          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="font-mono text-xs text-ink/40">
                Langkah {active + 1} / {tabs.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActive((a) => Math.max(a - 1, 0))}
                  disabled={active === 0}
                  aria-label="Langkah sebelumnya"
                  className="w-9 h-9 rounded-full border border-forest/15 flex items-center justify-center text-forest transition-colors hover:bg-forest/5 disabled:opacity-25 disabled:pointer-events-none"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setActive((a) => Math.min(a + 1, tabs.length - 1))}
                  disabled={active === tabs.length - 1}
                  aria-label="Langkah berikutnya"
                  className="w-9 h-9 rounded-full border border-forest/15 flex items-center justify-center text-forest transition-colors hover:bg-forest/5 disabled:opacity-25 disabled:pointer-events-none"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 -mx-6 px-6 md:mx-0 md:px-0">
            {tabs.map((t, i) => {
              const isActive = i === active;
              return (
                <button
                  key={t.number}
                  onClick={() => setActive(i)}
                  className={`relative text-left shrink-0 md:shrink w-64 md:w-auto rounded-2xl px-5 py-4 transition-colors duration-300 ${
                    isActive ? accentStyles[t.accent].softBg : "hover:bg-forest/5"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="tab-indicator"
                      className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full ${accentStyles[t.accent].bg}`}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    />
                  )}
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-mono text-xs ${
                        isActive ? accentStyles[t.accent].text : "text-ink/35"
                      }`}
                    >
                      {t.number}
                    </span>
                    <span
                      className={`font-display font-semibold ${
                        isActive ? "text-forest text-lg" : "text-ink/55 text-base"
                      }`}
                    >
                      {t.title}
                    </span>
                  </div>
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 10 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="text-sm text-ink/60 leading-relaxed mb-3">
                          {t.description}
                        </p>
                        <ul className="space-y-1.5">
                          {t.points.map((point) => (
                            <li
                              key={point}
                              className="flex items-start gap-2 text-xs text-ink/55"
                            >
                              <span
                                className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${accentStyles[t.accent].bg}`}
                              />
                              {point}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
            </div>
          </div>

          <div className="rounded-3xl bg-paper border border-forest/10 shadow-[0_30px_60px_-20px_rgba(23,48,31,0.18)] overflow-hidden">
            <WindowChrome accent={tab.accent} label={tab.windowLabel} />
            <AnimatePresence mode="wait">
              <motion.div
                key={tab.number}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <Mockup accent={tab.accent} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
