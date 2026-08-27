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
  { height: number; main: string; light: string; dark: string; widthClass: string; delay: number }
> = {
  2: { height: 128, main: "#17301F", light: "#2A4F35", dark: "#0F2417", widthClass: "w-[30%] sm:w-32 md:w-36", delay: 0.2 },
  1: { height: 190, main: "#C99A3D", light: "#E4C078", dark: "#A67D30", widthClass: "w-[36%] sm:w-36 md:w-40", delay: 0.05 },
  3: { height: 86, main: "#7A5738", light: "#A9835C", dark: "#5E4229", widthClass: "w-[30%] sm:w-32 md:w-36", delay: 0.35 },
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
    <section id="peringkat" className="py-16 sm:py-24 md:py-28 px-4 sm:px-6 md:px-10 bg-cream overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <Reveal className="max-w-xl mb-10 md:mb-16">
          <p className="font-mono text-xs tracking-widest uppercase text-clay mb-3">
            Papan peringkat · pratinjau
          </p>
          <h2 className="font-display font-semibold text-3xl md:text-4xl text-forest mb-4">
            Kontributor limbah terbanyak bulan ini.
          </h2>
          <p className="text-ink/65 text-sm sm:text-[15px] leading-relaxed max-w-lg">
            Lima industri dengan volume limbah terbesar yang dikumpulkan dan
            diolah lewat jaringan LENTERA bulan ini.
          </p>
        </Reveal>

        <div className="grid lg:grid-cols-[0.95fr_1.2fr] gap-10 lg:gap-10 items-center">
          {/* Peringkat 4-5 + teks penjelasan */}
          <div className="order-2 lg:order-1">
            <RevealGroup className="space-y-3">
              {rest.map((entry) => (
                <RevealItem key={entry.rank}>
                  <div className="flex items-center gap-2.5 sm:gap-4 bg-paper rounded-xl sm:rounded-2xl border border-forest/8 px-3.5 sm:px-5 py-3 sm:py-4">
                    <span className="font-display font-semibold text-lg sm:text-2xl text-ink/25 w-5 sm:w-6 shrink-0">
                      {entry.rank}
                    </span>
                    <CompanyLogo
                      name={entry.name}
                      logoUrl={entry.logoUrl}
                      logoType={entry.logoType}
                      accent={entry.accent}
                      className="w-8 h-8 sm:w-11 sm:h-11 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-forest text-xs sm:text-[15px] truncate">
                        {entry.name}
                      </p>
                      <p className="text-ink/50 text-[10px] sm:text-xs truncate">{entry.industry}</p>
                    </div>
                    <span className="ml-auto font-mono text-[11px] sm:text-xs text-ink/50 shrink-0 pl-1">
                      {entry.volume}
                    </span>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>

            <Reveal delay={0.15}>
              <p className="mt-6 sm:mt-8 text-ink/55 text-xs sm:text-[14.5px] leading-relaxed">
                Peringkat disusun dari volume limbah yang berhasil dikumpulkan
                dan diproses setiap bulan, konsistensi pasokan, serta tingkat
                pemilahan limbah sejak dari sumber. Lima industri di atas
                secara rutin menjadi kontributor terbesar dalam jaringan
                LENTERA.
              </p>
            </Reveal>
          </div>

          {/* Podium peringkat 1-3 */}
          <div className="order-1 lg:order-2 flex items-end justify-center gap-1.5 sm:gap-4 md:gap-6 w-full">
            {podiumOrder.map((rank) => {
              const entry = top3.find((e) => e.rank === rank)!;
              const cfg = podiumConfig[rank];
              return (
                <div
                  key={rank}
                  className={`flex flex-col items-center ${cfg.widthClass}`}
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
                    className={`mb-2 sm:mb-4 w-full bg-paper rounded-xl sm:rounded-2xl p-2 sm:p-3.5 border-l-2 sm:border-l-[3px] ${accentBorder[entry.accent]} shadow-[0_16px_32px_-12px_rgba(23,48,31,0.18)] text-center`}
                  >
                    <CompanyLogo
                      name={entry.name}
                      logoUrl={entry.logoUrl}
                      logoType={entry.logoType}
                      accent={entry.accent}
                      className="w-7 h-7 sm:w-10 sm:h-10 mx-auto mb-1.5 sm:mb-2"
                    />
                    <p className="font-medium text-forest text-[10px] sm:text-[12.5px] leading-tight sm:leading-snug line-clamp-2 min-h-[2.2em] sm:min-h-[2.4em]">
                      {entry.name}
                    </p>
                    <p className="font-mono text-[9px] sm:text-[11px] text-ink/45 mt-1 truncate">
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