"use client";

import dynamic from "next/dynamic";
import { Reveal } from "./ui/reveal";

const PartnersMap = dynamic(
  () => import("./partners-map").then((m) => m.PartnersMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[480px] rounded-2xl bg-paper border border-forest/10 animate-pulse" />
    ),
  }
);

const legend = [
  { label: "Industri sumber", color: "bg-clay" },
  { label: "Mitra & agen", color: "bg-green" },
  { label: "Fasilitas pengolahan", color: "bg-gold" },
];

export function Network() {
  return (
    <section
      id="jaringan"
      className="min-h-screen flex items-center py-24 px-6 md:px-10 bg-paper"
    >
      <div className="max-w-7xl mx-auto w-full">
        <Reveal className="max-w-xl mb-12">
          <p className="font-mono text-xs tracking-widest uppercase text-green mb-3">
            Jaringan
          </p>
          <h2 className="font-display font-semibold text-3xl md:text-4xl text-forest mb-4">
            Sudah hadir di berbagai kawasan industri.
          </h2>
          <p className="text-ink/65 text-[15px] leading-relaxed">
            Titik industri sumber limbah dan titik mitra penyaluran energi
            yang saat ini bekerja sama dengan LENTERA.
          </p>
        </Reveal>

        <Reveal className="flex items-center gap-6 mb-6 text-sm">
          {legend.map((item) => (
            <span key={item.label} className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full inline-block ${item.color}`} />
              {item.label}
            </span>
          ))}
        </Reveal>

        <Reveal>
          <PartnersMap />
        </Reveal>
      </div>
    </section>
  );
}
