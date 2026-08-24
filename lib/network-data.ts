export type NetworkPointType = "industri" | "mitra" | "fasilitas";

export interface NetworkPoint {
  name: string;
  type: NetworkPointType;
  lat: number;
  lng: number;
}

export const networkColors: Record<NetworkPointType, string> = {
  industri: "#7A5738",
  mitra: "#2F6B3F",
  fasilitas: "#C99A3D",
};

export const networkLabels: Record<NetworkPointType, string> = {
  industri: "Industri sumber",
  mitra: "Mitra & agen",
  fasilitas: "Fasilitas pengolahan",
};

export const networkPoints: NetworkPoint[] = [
  { name: "Kawasan Industri Cikarang", type: "industri", lat: -6.2383, lng: 107.1608 },
  { name: "Kawasan Industri Jababeka", type: "industri", lat: -6.3487, lng: 107.174 },
  { name: "Mitra Distribusi Jakarta", type: "mitra", lat: -6.2088, lng: 106.8456 },
  { name: "Fasilitas Pengolahan Jambi", type: "fasilitas", lat: -1.6101, lng: 103.6131 },
  { name: "Mitra Distribusi Palembang", type: "mitra", lat: -2.9761, lng: 104.7754 },
  { name: "Kawasan Industri Medan", type: "industri", lat: 3.5952, lng: 98.6722 },
  { name: "Mitra Distribusi Medan", type: "mitra", lat: 3.61, lng: 98.69 },
  { name: "Kawasan Industri Surabaya", type: "industri", lat: -7.2575, lng: 112.7521 },
  { name: "Mitra Distribusi Semarang", type: "mitra", lat: -6.9932, lng: 110.4203 },
  { name: "Mitra Distribusi Batam", type: "mitra", lat: 1.0456, lng: 104.0305 },
];
