import type { CompanyIconType } from "@/components/ui/company-mark";

export interface PartnerCompany {
  name: string;
  location: string;
  industry: string;
  description: string;
  initials: string;
  logoType: CompanyIconType;
  accent: "gold" | "forest" | "clay" | "green";
}

// Data contoh (dummy) — ganti dengan daftar mitra/industri sesungguhnya.
export const partnerCompanies: PartnerCompany[] = [
  {
    name: "PT Cipta Industri Nusantara",
    location: "Cikarang, Jawa Barat",
    industry: "Manufaktur baja & logam",
    description:
      "Produsen baja dan komponen logam berat yang beroperasi di kawasan industri Cikarang. Sisa produksi logam dari lini pabrikasi mereka dikumpulkan dan diproses melalui fasilitas LENTERA setiap bulan secara terjadwal.",
    initials: "CIN",
    logoType: "steel",
    accent: "gold",
  },
  {
    name: "PT Warna Tekstil Indonesia",
    location: "Bandung, Jawa Barat",
    industry: "Tekstil & garmen",
    description:
      "Produsen tekstil dan garmen berorientasi ekspor dengan basis produksi di Bandung. Limbah kain dan serat dari proses produksi disalurkan ke LENTERA untuk diolah menjadi sumber energi alternatif.",
    initials: "WTI",
    logoType: "textile",
    accent: "forest",
  },
  {
    name: "PT Kimia Andalan Prima",
    location: "Cilegon, Banten",
    industry: "Kimia industri",
    description:
      "Produsen bahan kimia industri yang berlokasi di kawasan petrokimia Cilegon. Bekerja sama dengan LENTERA untuk pengelolaan limbah kimia produksi secara aman dan bertanggung jawab.",
    initials: "KAP",
    logoType: "chemical",
    accent: "clay",
  },
  {
    name: "PT Kertas Lestari Abadi",
    location: "Perawang, Riau",
    industry: "Pulp & kertas",
    description:
      "Produsen kertas dan bubur kertas skala nasional yang berbasis di Perawang. Limbah serat dan sisa produksi kertas mereka menjadi salah satu kontributor terbesar dalam jaringan pengolahan LENTERA.",
    initials: "KLA",
    logoType: "paper",
    accent: "green",
  },
  {
    name: "PT Sawit Makmur Bersama",
    location: "Dumai, Riau",
    industry: "Kelapa sawit",
    description:
      "Pengolahan kelapa sawit dan produk turunannya dengan fasilitas produksi di Dumai. Limbah organik dari proses pengolahan sawit dikumpulkan secara rutin untuk dikonversi menjadi energi terbarukan.",
    initials: "SMB",
    logoType: "palm",
    accent: "gold",
  },
  {
    name: "PT Elektrindo Karya Mandiri",
    location: "Batam, Kepulauan Riau",
    industry: "Elektronik",
    description:
      "Manufaktur komponen dan perangkat elektronik yang berbasis di Batam. Limbah produksi elektronik mereka dikelola bersama LENTERA dengan standar penanganan yang sesuai jenis limbahnya.",
    initials: "EKM",
    logoType: "electronics",
    accent: "clay",
  },
  {
    name: "PT Pangan Sejahtera Abadi",
    location: "Sidoarjo, Jawa Timur",
    industry: "Makanan & minuman",
    description:
      "Produsen makanan dan minuman olahan dengan fasilitas produksi di Sidoarjo. Limbah organik dari proses produksi disalurkan ke LENTERA sebagai bagian dari komitmen keberlanjutan perusahaan.",
    initials: "PSA",
    logoType: "food",
    accent: "forest",
  },
  {
    name: "PT Otomotif Cipta Perkasa",
    location: "Karawang, Jawa Barat",
    industry: "Otomotif",
    description:
      "Perakitan komponen dan suku cadang otomotif yang berlokasi di Karawang. Limbah logam dan material produksi dari lini perakitan mereka diproses melalui jaringan LENTERA setiap bulan.",
    initials: "OCP",
    logoType: "automotive",
    accent: "green",
  },
  {
    name: "PT Farmasi Nusantara Sehat",
    location: "Tangerang, Banten",
    industry: "Farmasi",
    description:
      "Produksi bahan baku dan kemasan farmasi yang berbasis di Tangerang. Bekerja sama dengan LENTERA untuk pengelolaan limbah produksi sesuai standar keselamatan industri farmasi.",
    initials: "FNS",
    logoType: "pharma",
    accent: "gold",
  },
  {
    name: "PT Distribusi Energi Merdeka",
    location: "Palembang, Sumatra Selatan",
    industry: "Distribusi energi",
    description:
      "Mitra distribusi dan agen energi regional yang beroperasi di Palembang. Menyalurkan energi hasil olahan LENTERA ke pelanggan industri dan rumah tangga di wilayah Sumatra Selatan.",
    initials: "DEM",
    logoType: "energy",
    accent: "forest",
  },
];
