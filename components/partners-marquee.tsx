"use client";

import { Reveal } from "./ui/reveal";
import { CompanyMark } from "./ui/company-mark";
import { partnerCompanies, type PartnerCompany } from "@/lib/partner-companies";

const rowA = partnerCompanies.slice(0, 5);
const rowB = partnerCompanies.slice(5);

const edgeMask = {
  maskImage:
    "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
  WebkitMaskImage:
    "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
};

function MarqueeRow({
  companies,
  reverse = false,
}: {
  companies: PartnerCompany[];
  reverse?: boolean;
}) {
  const items = [...companies, ...companies];
  return (
    <div className="relative w-full overflow-hidden" style={edgeMask}>
      <div
        className={`flex gap-5 w-max ${
          reverse ? "animate-marquee-reverse" : "animate-marquee"
        } hover:[animation-play-state:paused]`}
      >
        {items.map((c, i) => (
          <div
            key={`${c.name}-${i}`}
            className="flex items-start gap-4 bg-cream rounded-2xl border border-forest/8 p-6 w-[380px] shrink-0"
          >
            <CompanyMark type={c.logoType} accent={c.accent} className="w-14 h-14" />
            <div className="min-w-0">
              <p className="font-display font-semibold text-forest text-base leading-snug">
                {c.name}
              </p>
              <p className="flex items-center gap-1.5 text-ink/45 text-xs mt-1">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="w-3.5 h-3.5 shrink-0"
                >
                  <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z" />
                  <circle cx="12" cy="9.5" r="2.3" />
                </svg>
                {c.location}
              </p>
              <p className="text-ink/60 text-[13px] leading-relaxed mt-3">
                {c.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PartnersMarquee() {
  return (
    <section
      id="mitra-kami"
      className="min-h-screen flex flex-col justify-center py-24 px-6 md:px-10 bg-paper overflow-hidden"
    >
      <div className="max-w-7xl mx-auto w-full mb-14">
        <Reveal className="max-w-xl">
          <p className="font-mono text-xs tracking-widest uppercase text-green mb-3">
            Dipercaya oleh berbagai industri
          </p>
          <h2 className="font-display font-semibold text-3xl md:text-4xl text-forest">
            Perusahaan yang sudah bekerja sama dengan LENTERA.
          </h2>
        </Reveal>
      </div>

      <div className="space-y-6 md:space-y-8">
        <MarqueeRow companies={rowA} />
        <MarqueeRow companies={rowB} reverse />
      </div>
    </section>
  );
}
