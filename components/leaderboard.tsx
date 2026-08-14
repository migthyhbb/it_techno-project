"use client";

import { motion } from "motion/react";
import { Reveal, RevealGroup, RevealItem } from "./ui/reveal";
import { CompanyLogo } from "./ui/company-logo";
import { PodiumStep } from "./ui/podium-step";
import { leaderboardEntries as dummyLeaderboardEntries, type LeaderboardEntry } from "@/lib/leaderboard-data";

// Urutan tampil podium: 2 - 1 - 3 (klasik), beserta tinggi & warna tiap anak tangga.
const podiumOrder = [2, 1, 3];

const podiumConfig: Record<
  number,
  { height: number; main: string; light: string; dark: string; width: string; delay: number }
> = {
  2: { height: 128, main: "#17301F", light: "#2A4F35", dark: "#0F2417", width: "8rem", delay: 0.2 },
  1: { height: 190, main: "#C99A3D", light: "#E4C078", dark: "#A67D30", width: "9.5rem", delay: 0.05 },
  3: { height: 86, main: "#7A5738", light: "#A9835C", dark: "#5E4229", width: "8rem", delay: 0.35 },
};

const accentBorder: Record<string, string> = {
  gold: "border-gold",
  forest: "border-forest",
  clay: "border-clay",
  green: "border-green",
};

export function Leaderboard({
  entries = dummyLeaderboardEntries,
}: {
  entries?: LeaderboardEntry[];
}) {
  const top3 = entries.filter((e) => e.rank <= 3);
  const rest = entries.filter((e) => e.rank > 3);

  return (
    <section id="peringkat" className="py-24 md:py-28 px-6 md:px-10 bg-cream">
      <div className="max-w-7xl mx-auto">
        <Reveal className="max-w-xl mb-16">
          <p className="font-mono text-xs tracking-widest uppercase text-clay mb-3">
            Papan peringkat · pratinjau
          </p>
          <h2 className="font-display font-semibold text-3xl md:text-4xl text-forest mb-4">
            Kontributor limbah terbanyak bulan ini.
          </h2>
          <p className="text-ink/65 text-[15px] leading-relaxed max-w-lg">
            Lima industri dengan volume limbah terbesar yang dikumpulkan dan
            diolah lewat jaringan LENTERA bulan ini.
          </p>
        </Reveal>

        <div className="grid lg:grid-cols-[0.95fr_1.2fr] gap-14 lg:gap-10 items-center">
          {/* Peringkat 4-5 + teks penjelasan */}
          <div className="order-2 lg:order-1">
            <RevealGroup className="space-y-3">
              {rest.map((entry) => (
                <RevealItem key={entry.rank}>
                  <div className="flex items-center gap-4 bg-paper rounded-2xl border border-forest/8 px-5 py-4">
                    <span className="font-display font-semibold text-2xl text-ink/25 w-6 shrink-0">
                      {entry.rank}
                    </span>
                    <CompanyLogo
                      name={entry.name}
                      logoUrl={entry.logoUrl}
                      logoType={entry.logoType}
                      accent={entry.accent}
                      className="w-11 h-11"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-forest text-[15px] truncate">
                        {entry.name}
                      </p>
                      <p className="text-ink/50 text-xs">{entry.industry}</p>
                    </div>
                    <span className="ml-auto font-mono text-xs text-ink/50 shrink-0">
                      {entry.volume}
                    </span>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>

            <Reveal delay={0.15}>
              <p className="mt-8 text-ink/55 text-[14.5px] leading-relaxed">
                Peringkat disusun dari volume limbah yang berhasil dikumpulkan
                dan diproses setiap bulan, konsistensi pasokan, serta tingkat
                pemilahan limbah sejak dari sumber. Lima industri di atas
                secara rutin menjadi kontributor terbesar dalam jaringan
                LENTERA.
              </p>
            </Reveal>
          </div>

          {/* Podium peringkat 1-3 — dibuat sendiri (SVG), bukan dari foto,
              supaya kartu logo dijamin pas di atas tiap anak tangga */}
          <div className="order-1 lg:order-2 flex items-end justify-center gap-4 md:gap-6">
            {podiumOrder.map((rank) => {
              const entry = top3.find((e) => e.rank === rank)!;
              const cfg = podiumConfig[rank];
              return (
                <div
                  key={rank}
                  className="flex flex-col items-center"
                  style={{ width: cfg.width }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.6,
                      delay: cfg.delay,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className={`mb-4 w-full bg-paper rounded-2xl p-3.5 border-l-[3px] ${accentBorder[entry.accent]} shadow-[0_16px_32px_-12px_rgba(23,48,31,0.18)] text-center`}
                  >
                    <CompanyLogo
                      name={entry.name}
                      logoUrl={entry.logoUrl}
                      logoType={entry.logoType}
                      accent={entry.accent}
                      className="w-10 h-10 mx-auto mb-2"
                    />
                    <p className="font-medium text-forest text-[12.5px] leading-snug line-clamp-2 min-h-[2.4em]">
                      {entry.name}
                    </p>
                    <p className="font-mono text-[11px] text-ink/45 mt-1">
                      {entry.volume}
                    </p>
                  </motion.div>

                  <PodiumStep
                    rank={rank}
                    height={cfg.height}
                    main={cfg.main}
                    light={cfg.light}
                    dark={cfg.dark}
                    delay={cfg.delay}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
