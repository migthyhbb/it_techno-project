import type { CompanyIconType } from "@/components/ui/company-mark";

export interface LeaderboardEntry {
  rank: number;
  name: string;
  initials: string;
  industry: string;
  volume: string;
  logoType: CompanyIconType;
  logoUrl?: string;
  accent: "gold" | "forest" | "clay" | "green";
}

// Data dummy (fallback) — dipakai kalau Supabase / API custom belum
// dikonfigurasi, atau saat fetch ke sana gagal. Lihat lib/get-leaderboard.ts.
// logoUrl mengarah ke public/images/logos/ — kalau field ini kosong,
// CompanyLogo otomatis jatuh ke ikon abstrak (logoType) sebagai fallback.
export const leaderboardEntries: LeaderboardEntry[] = [
  {
    rank: 1,
    name: "PT Cipta Industri Nusantara",
    initials: "CIN",
    industry: "Manufaktur baja & logam",
    volume: "1.480 ton/bln",
    logoType: "steel",
    logoUrl: "/images/logos/company-1.png",
    accent: "gold",
  },
  {
    rank: 2,
    name: "PT Warna Tekstil Indonesia",
    initials: "WTI",
    industry: "Tekstil & garmen",
    volume: "1.260 ton/bln",
    logoType: "textile",
    logoUrl: "/images/logos/company-2.png",
    accent: "forest",
  },
  {
    rank: 3,
    name: "PT Kimia Andalan Prima",
    initials: "KAP",
    industry: "Kimia industri",
    volume: "1.050 ton/bln",
    logoType: "chemical",
    logoUrl: "/images/logos/company-3.png",
    accent: "clay",
  },
  {
    rank: 4,
    name: "PT Kertas Lestari Abadi",
    initials: "KLA",
    industry: "Pulp & kertas",
    volume: "890 ton/bln",
    logoType: "paper",
    logoUrl: "/images/logos/company-4.png",
    accent: "green",
  },
  {
    rank: 5,
    name: "PT Sawit Makmur Bersama",
    initials: "SMB",
    industry: "Kelapa sawit",
    volume: "760 ton/bln",
    logoType: "palm",
    logoUrl: "/images/logos/company-5.png",
    accent: "green",
  },
];
