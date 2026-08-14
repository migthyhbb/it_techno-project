"use client";

import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { useState } from "react";
import Image from "next/image";

const links = [
  { href: "#cara-kerja", label: "Cara Kerja" },
  { href: "#mitra", label: "Untuk Mitra" },
  { href: "#jaringan", label: "Jaringan" },
  { href: "#kontak", label: "Kontak" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 40);
  });

  return (
    <motion.nav
      animate={{
        backgroundColor: scrolled ? "rgba(246,242,230,0.85)" : "rgba(246,242,230,0)",
        borderColor: scrolled ? "rgba(34,29,22,0.08)" : "rgba(34,29,22,0)",
        backdropFilter: scrolled ? "blur(10px)" : "blur(0px)",
      }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 border-b"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-20 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5">
          <Image src="/images/logo.png" alt="LENTERA" width={40} height={40} className="h-10 w-auto" priority />
          <span className="font-display font-semibold text-lg tracking-tight text-forest">
            LENTERA
          </span>
        </a>

        <div className="hidden md:flex items-center gap-9 text-sm font-medium text-ink/80">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-forest transition-colors">
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-5">
          <a
            href="/masuk"
            className="hidden sm:inline text-sm font-medium text-ink/70 hover:text-forest transition-colors"
          >
            Masuk
          </a>
          <a
            href="/daftar"
            className="bg-forest text-cream text-sm font-medium px-5 py-2.5 rounded-full hover:bg-forest-2 transition-colors"
          >
            Daftar
          </a>
        </div>
      </div>
    </motion.nav>
  );
}
