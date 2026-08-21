import { leaderboardEntries as dummyLeaderboardEntries, type LeaderboardEntry } from "./leaderboard-data";

export async function getLeaderboardEntries(): Promise<LeaderboardEntry[]> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const apiUrl = `${baseUrl}/api/leaderboard`;

  try {
    const res = await fetch(apiUrl, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`Status API: ${res.status}`);
    
    const response = await res.json();
    
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      return response.data.map((item: any) => {
        let accentColor: "gold" | "forest" | "clay" | "green" = "green";
        if (item.peringkat === 1) accentColor = "gold";
        else if (item.peringkat === 2) accentColor = "forest";
        else if (item.peringkat === 3) accentColor = "clay";

        return {
          rank: item.peringkat,
          name: item.nama_perusahaan,
          initials: item.nama_perusahaan.substring(0, 2).toUpperCase(),
          industry: "Mitra LENTERA",
          volume: `${item.poin_eco_credits.toLocaleString('id-ID')} Poin`,
          logoType: "generic",
          logoUrl: item.avatar || undefined,
          accent: accentColor,
        };
      });
    }
  } catch (err) {
    console.error("Gagal konek ke API Leaderboard Redis. Memuat data dummy...", err);
  }

  return dummyLeaderboardEntries;
}