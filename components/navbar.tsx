"use client";

import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "motion/react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { scrollY } = useScroll();
  const pathname = usePathname();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 40);
  });

  // Logika kondisional item menu berdasarkan pathname aktif
  const links = [
    { 
      href: pathname === "/tentang-kami" ? "/" : "/tentang-kami", 
      label: pathname === "/tentang-kami" ? "Beranda" : "Tentang Kami" 
    },
    { 
      href: pathname === "/edukasi" ? "/" : "/edukasi", 
      label: pathname === "/edukasi" ? "Beranda" : "Edukasi" 
    },
    { 
      href: pathname === "/daftar-mitra-industri" ? "/" : "/daftar-mitra-industri", 
      label: pathname === "/daftar-mitra-industri" ? "Beranda" : "Daftar Mitra & Industri" 
    },
    { 
      href: pathname === "/kontak" ? "/" : "/kontak", 
      label: pathname === "/kontak" ? "Beranda" : "Kontak" 
    },
  ];

  return (
    <motion.nav
      animate={{
        backgroundColor: scrolled || isOpen ? "rgba(246,242,230,0.95)" : "rgba(246,242,230,0)",
        borderColor: scrolled || isOpen ? "rgba(34,29,22,0.08)" : "rgba(34,29,22,0)",
        backdropFilter: scrolled || isOpen ? "blur(10px)" : "blur(0px)",
      }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`fixed top-0 left-0 w-full z-50 border-b transition-[height] duration-300 ${
        isOpen ? "h-screen bg-cream/95 backdrop-blur-md" : "h-20"
      }`}
    >
      <div className="w-full max-w-7xl mx-auto px-6 md:px-10 h-20 flex items-center justify-between relative z-50">
        
        {/* Logo LENTERA */}
        <Link href="/" className="flex items-center gap-2 shrink-0" onClick={() => setIsOpen(false)}>
          <Image 
            src="/images/logo.png" 
            alt="LENTERA" 
            width={28} 
            height={28} 
            className="h-7 w-auto object-contain" 
            priority 
          />
          <span className="font-display font-semibold text-base tracking-tight text-forest">
            LENTERA
          </span>
        </Link>

        {/* --- MENU DESKTOP --- */}
        <div className="hidden md:flex items-center gap-9 text-sm font-medium text-ink/80">
          {links.map((link) => (
            <Link key={link.label} href={link.href} className="hover:text-forest transition-colors">
              {link.label}
            </Link>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-5">
          <Link href="/masuk" className="text-sm font-medium text-ink/70 hover:text-forest transition-colors">
            Masuk
          </Link>
          <Link href="/daftar" className="bg-forest text-cream text-sm font-medium px-5 py-2.5 rounded-full hover:bg-forest/90 transition-colors">
            Daftar
          </Link>
        </div>

        {/* --- TOMBOL BURGER MENU --- */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex md:hidden flex-col justify-center items-center w-10 h-10 gap-1.5 focus:outline-none cursor-pointer shrink-0 z-50"
          aria-label="Toggle menu"
        >
          <motion.span
            animate={isOpen ? { rotate: 45, y: 7.5 } : { rotate: 0, y: 0 }}
            className="block w-6 h-[2px] bg-forest rounded-full"
          />
          <motion.span
            animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
            className="block w-6 h-[2px] bg-forest rounded-full"
          />
          <motion.span
            animate={isOpen ? { rotate: -45, y: -7.5 } : { rotate: 0, y: 0 }}
            className="block w-6 h-[2px] bg-forest rounded-full"
          />
        </button>
      </div>

      {/* --- MENU MOBILE DROPDOWN --- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden absolute top-20 left-0 w-full h-[calc(100vh-80px)] px-6 pb-10 overflow-y-auto flex flex-col justify-between z-40"
          >
            <div className="flex flex-col gap-3 text-center mt-6">
              {links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsOpen(false)} 
                  className="text-lg font-medium text-forest hover:text-green transition-colors py-3 border-b border-forest/10"
                >
                  {link.label}
                </Link>
              ))}
              
              {/* Tombol Auth di Mobile */}
              <div className="flex flex-col gap-3 mt-6">
                <Link
                  href="/masuk"
                  onClick={() => setIsOpen(false)}
                  className="py-3 text-forest font-medium border border-forest/20 rounded-xl hover:bg-forest/5 transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/daftar"
                  onClick={() => setIsOpen(false)}
                  className="py-3 bg-forest text-cream font-medium rounded-xl hover:bg-forest/90 transition-colors"
                >
                  Daftar
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}