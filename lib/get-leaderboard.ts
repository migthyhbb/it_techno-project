import { leaderboardEntries as dummyLeaderboardEntries, type LeaderboardEntry } from "./leaderboard-data";

export async function getLeaderboardEntries(): Promise<LeaderboardEntry[]> {
  // Di Next.js Server Components, fungsi fetch butuh URL absolut lengkap (http://...)
  // Pastikan di file .env.local abang ada baris ini: NEXT_PUBLIC_SITE_URL=http://localhost:3000
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const apiUrl = `${baseUrl}/api/leaderboard`;

  try {
    // 1. Pelayan (Fetch) mengetuk pintu Dapur (API Redis abang)
    // next: { revalidate: 60 } artinya Next.js akan memperbarui data setiap 60 detik (cache otomatis!)
    const res = await fetch(apiUrl, { 
      next: { revalidate: 60 } 
    });
    
    if (!res.ok) throw new Error(`Status API: ${res.status}`);
    
    const response = await res.json();
    
    // 2. Koki (API) memberikan data, kita cek apakah isinya ada
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      
      // 3. Kita "Terjemahkan" bahasa Database menjadi bahasa UI Front-End
      return response.data.map((item: any) => {
        
        // Atur warna anak tangga podium berdasarkan peringkat aslinya
        let accentColor: "gold" | "forest" | "clay" | "green" = "green";
        if (item.peringkat === 1) accentColor = "gold"; // Juara 1 Emas
        else if (item.peringkat === 2) accentColor = "forest"; // Juara 2 Hijau Gelap
        else if (item.peringkat === 3) accentColor = "clay"; // Juara 3 Cokelat Tanah

        return {
          rank: item.peringkat,
          name: item.nama_perusahaan,
          initials: item.nama_perusahaan.substring(0, 2).toUpperCase(),
          industry: "Mitra LENTERA", // Sementara kita pukul rata, karena di API Redis belum bawa data industri
          volume: `${item.poin_eco_credits.toLocaleString('id-ID')} Poin`, // Menampilkan skor aslinya!
          logoType: "generic", // Ikon fallback bawaan UI
          logoUrl: item.avatar || undefined, // Pakai foto dokumen dari database jika ada
          accent: accentColor,
        };
      });
    }
  } catch (err) {
    // Fail-safe: Kalau Redis mati atau Vercel error, web TIDAK AKAN CRASH.
    // Dia akan diam-diam menampilkan data dummy buatan teman abang.
    console.error("Gagal konek ke API Leaderboard Redis. Memuat data dummy...", err);
  }

  // Jika di Redis belum ada data sama sekali, tampilkan dummy dulu
  return dummyLeaderboardEntries;
}