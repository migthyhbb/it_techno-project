import Image from "next/image";
import { Reveal } from "./ui/reveal";
import { MagneticButton } from "./ui/magnetic-button";

const footerLinks = [
  { href: "app/tentang-kami", label: "Tentang kami" },
  { href: "app/edukasi", label: "Edukasi" },
  { href: "app/kontak", label: "Kontak" },
];

export function CtaFooter() {
  return (
    <>
      <section id="kontak" className="py-24 px-6 md:px-10 bg-forest relative overflow-hidden">
        <div
          aria-hidden
          className="absolute w-[420px] h-[420px] rounded-full bg-green/30 blur-[80px] -bottom-40 -left-20"
        />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Reveal>
            <h2 className="font-display font-semibold text-3xl md:text-4xl text-cream mb-5">
              Siap menjadi bagian dari jaringan LENTERA?
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="text-cream/70 text-lg mb-9 max-w-lg mx-auto">
              Daftarkan pabrik atau usaha Anda sebagai mitra sumber limbah
              maupun agen penyalur energi.
            </p>
          </Reveal>
          <Reveal delay={0.16}>
            <div className="flex flex-wrap justify-center gap-4">
              <MagneticButton href="mailto:lentera1.idn@gmail.com" variant="primary" className="!bg-gold !text-forest hover:!bg-gold-light">
                Hubungi Tim Kami
              </MagneticButton>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="px-6 md:px-10 py-12 bg-forest-2 text-cream/60 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
          <Image
            src="/images/logo.png"
            alt="LENTERA"
            width={120}
            height={28}
            className="h-7 w-auto object-contain shrink-0"
          />
            <span className="font-display font-medium text-cream">LENTERA</span>
          </div>
          <div className="flex items-center gap-7">
            {footerLinks.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-cream transition-colors">
                {link.label}
              </a>
            ))}
          </div>
          <p className="text-cream/40">© 2026 LENTERA. Limbah Energi Terjangkau Rakyat.</p>
        </div>
      </footer>
    </>
  );
}
