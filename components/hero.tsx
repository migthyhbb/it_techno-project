"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Reveal } from "./ui/reveal";
import { TiltCard } from "./ui/tilt-card";
import { MagneticButton } from "./ui/magnetic-button";

const metrics = [
  {
    label: "Kapasitas olah harian",
    value: "120",
    unit: "ton/hari",
    accent: "border-green",
    position: "left-0 top-4 md:top-8 w-44 md:w-48",
    rotate: -6,
    delay: 0.2,
  },
  {
    label: "Mitra aktif",
    value: "84",
    unit: "titik",
    accent: "border-gold",
    position: "right-0 top-20 md:top-24 w-40 md:w-44",
    rotate: 5,
    delay: 0.7,
  },
  {
    label: "Energi tersalurkan",
    value: "3.240",
    unit: "MWh/bln",
    accent: "border-clay",
    position: "left-2 md:left-4 bottom-2 md:bottom-4 w-48 md:w-52",
    rotate: -4,
    delay: 1.2,
  },
];

export function Hero() {
  return (
    <header className="relative min-h-screen flex items-center pt-28 pb-16 px-6 md:px-10 overflow-hidden">
      <motion.div
        aria-hidden
        className="absolute w-[520px] h-[520px] rounded-full bg-green/30 blur-[80px] -top-40 -left-40"
      />
      <motion.div
        aria-hidden
        className="absolute w-[420px] h-[420px] rounded-full bg-gold/25 blur-[80px] top-1/3 -right-32"
      />

      <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center relative z-10">
        <div>

          <Reveal delay={0.08}>
            <h1 className="font-display font-semibold text-[2.6rem] leading-[1.08] md:text-[3.4rem] text-forest mb-6">
              Dari limbah pabrik,
              <br />
              jadi energi yang
              <br />
              <span className="text-green">terjangkau untuk semua.</span>
            </h1>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="text-ink/70 text-lg leading-relaxed max-w-md mb-9">
              LENTERA mengumpulkan dan mengolah limbah industri menjadi energi
              siap pakai, lalu menyalurkannya lewat jaringan mitra dan agen di
              seluruh Indonesia.
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="flex flex-wrap items-center gap-4">
              <MagneticButton href="#kontak" variant="primary">
                Jadi Mitra Sekarang
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </MagneticButton>
              <MagneticButton href="#cara-kerja" variant="secondary">
                Lihat Cara Kerja
              </MagneticButton>
            </div>
          </Reveal>
        </div>

        <div className="relative h-[420px] md:h-[520px] flex items-center justify-center">
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10"
          >
            <Image
              src="/images/hero-character.png"
              alt="Tim LENTERA mengelola energi dari limbah industri"
              width={442}
              height={870}
              className="h-[380px] md:h-[460px] w-auto drop-shadow-2xl"
              priority
            />
          </motion.div>

          {metrics.map((m) => (
            <TiltCard
              key={m.label}
              rotate={m.rotate}
              delay={m.delay}
              className={`absolute ${m.position} z-20`}
            >
              <div
                className={`bg-paper rounded-2xl p-4 border-l-[3px] ${m.accent} shadow-[0_20px_40px_-12px_rgba(23,48,31,0.18)]`}
              >
                <p className="text-xs text-ink/50 mb-1">{m.label}</p>
                <p className="font-display font-semibold text-2xl text-forest">
                  {m.value}{" "}
                  <span className="text-sm font-body font-medium text-ink/50">
                    {m.unit}
                  </span>
                </p>
              </div>
            </TiltCard>
          ))}
        </div>
      </div>
    </header>
  );
}
