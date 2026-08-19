"use client";

import { motion } from "motion/react";
import { Reveal, RevealGroup, RevealItem } from "./ui/reveal";

const benefits = [
  {
    title: "Harga kompetitif",
    description:
      "Skema harga yang wajar bagi mitra, dengan margin yang jelas di setiap penyaluran.",
    color: "text-green",
    ring: "group-hover:ring-green/25",
    icon: (
      <>
        <path d="M12 2v20M2 12h20" />
        <circle cx="12" cy="12" r="9" />
      </>
    ),
  },
  {
    title: "Pasokan stabil",
    description:
      "Kapasitas produksi terjadwal, sehingga stok di titik mitra tetap terjaga.",
    color: "text-gold",
    ring: "group-hover:ring-gold/25",
    icon: <path d="M3 12h18M3 6h18M3 18h18" />,
  },
  {
    title: "Dukungan operasional",
    description:
      "Pendampingan logistik dan operasional dari tim LENTERA sejak awal bergabung.",
    color: "text-clay",
    ring: "group-hover:ring-clay/25",
    icon: <path d="M4 21v-7a4 4 0 014-4h8a4 4 0 014 4v7M12 3v7" />,
  },
];

export function Partners() {
  return (
    <section
      id="mitra"
      className="min-h-screen flex items-center py-24 px-6 md:px-10 bg-cream"
    >
      <div className="max-w-7xl mx-auto w-full">
        <Reveal className="max-w-xl mb-16 md:mb-20">
          <p className="font-mono text-xs tracking-widest uppercase text-clay mb-3">
            Untuk mitra & agen
          </p>
          <h2 className="font-display font-semibold text-3xl md:text-4xl text-forest">
            Bangun usaha energi bersama LENTERA.
          </h2>
        </Reveal>

        <RevealGroup className="grid md:grid-cols-3 gap-6">
          {benefits.map((b) => (
            <RevealItem key={b.title} className="group">
              <motion.div
                whileHover={{ y: -10, scale: 1.015 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className={`bg-paper rounded-2xl p-8 border border-forest/10 h-full ring-1 ring-transparent transition-shadow duration-300 ${b.ring} hover:shadow-[0_24px_48px_-16px_rgba(23,48,31,0.16)]`}
              >
                <motion.svg
                  className={`w-9 h-9 mb-6 ${b.color}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  initial={{ opacity: 0, rotate: -12, scale: 0.7 }}
                  whileInView={{ opacity: 1, rotate: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.7,
                    ease: [0.34, 1.56, 0.64, 1],
                    delay: 0.15,
                  }}
                >
                  {b.icon}
                </motion.svg>
                <h3 className="font-display font-semibold text-lg text-forest mb-2">
                  {b.title}
                </h3>
                <p className="text-ink/65 text-[15px] leading-relaxed">
                  {b.description}
                </p>
              </motion.div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
