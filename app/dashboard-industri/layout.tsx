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
    <div className="min-h-screen bg-cream flex flex-col md:flex-row relative">
      {/* 
        Komponen IndustriSidebar sudah menangani:
        1. Top Bar Mobile
        2. Drawer Slide-Down / Slide-In Mobile
        3. Sidebar Desktop
      */}
      <IndustriSidebar
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
      />

      {/* Area Konten Utama */}
      <main className="flex-1 w-full min-w-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}