import { leaderboardEntries as dummyLeaderboardEntries, type LeaderboardEntry } from "./leaderboard-data";

export async function getLeaderboardEntries(): Promise<LeaderboardEntry[]> {
  const apiUrl = process.env.LEADERBOARD_API_URL; // Pastikan di .env isinya: http://localhost:3000/api/namaroutekamu
  
  if (apiUrl) {
    try {
      const res = await fetch(apiUrl, { next: { revalidate: 3600 } });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      
      const response = await res.json();
      
      // Mengubah format dari API kamu agar cocok dengan format UI temanmu
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        return response.data.map((item: any) => ({
          rank: item.peringkat,
          name: item.nama_perusahaan,
          initials: item.nama_perusahaan.substring(0, 2).toUpperCase(), // Bikin inisial otomatis
          industry: "Manufaktur", // Nilai default sementara
          volume: item.poin_eco_credits,
          logoType: item.avatar ? "image" : "text",
          logoUrl: item.avatar || undefined,
          accent: "bg-blue-500", // Warna default sementara
        }));
      }
    } catch (err) {
      console.error("Gagal mengambil leaderboard dari API, pakai data dummy:", err);
    }
  }

  return dummyLeaderboardEntries;
}