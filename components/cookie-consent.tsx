"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("lentera-cookie-consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("lentera-cookie-consent", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-forest/60 backdrop-blur-sm p-4">
      <div className="bg-paper border border-forest/10 p-6 sm:p-8 rounded-2xl shadow-2xl max-w-lg w-full text-center animate-in fade-in zoom-in-95 duration-200">
        <h2 className="font-display font-bold text-xl text-forest mb-3">
          Pemberitahuan Penggunaan Cookie
        </h2>
        <p className="text-sm text-ink/70 mb-6 leading-relaxed">
          Kami menggunakan cookie untuk meningkatkan kualitas layanan dan memberikan pengalaman yang lebih baik. Cookie menganalisis bagian website yang kamu kunjungi. Pelajari lebih lanjut mengenai Cookie di{" "}
          <Link className="text-forest font-bold hover:underline" href="/kebijakan-privasi">
            Kebijakan Privasi
          </Link>.
        </p>
        <button
          onClick={handleAccept}
          className="bg-forest text-cream font-semibold px-8 py-3 rounded-xl hover:bg-forest/90 transition-colors w-full sm:w-auto cursor-pointer shadow-md"
        >
          Saya Mengerti
        </button>
      </div>
    </div>
  );
}