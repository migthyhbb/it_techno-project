"use client";

import { useState } from "react";
import { IndustriSidebar } from "@/components/dashboard/industri-sidebar";

export default function DashboardIndustriLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-cream relative">
      {/* Top Header Khusus Mobile (Satu-satunya header di atas) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-forest text-cream flex items-center justify-between px-5 z-40 border-b border-cream/10">
        <div className="flex flex-col">
          <span className="font-display font-bold tracking-tight text-base">LENTERA</span>
          <span className="text-[10px] text-cream/50">Portal Industri</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 text-cream hover:bg-cream/10 rounded-lg transition-colors focus:outline-none"
          aria-label="Buka Navigation"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Sidebar Component langsung mengontrol posisi slide-in dan backdrop-nya */}
      <IndustriSidebar 
        isOpen={isMobileOpen} 
        onClose={() => setIsMobileOpen(false)} 
      />

      {/* Area Konten Utama */}
      <main className="flex-1 min-w-0 pt-16 md:pt-0">{children}</main>
    </div>
  );
}