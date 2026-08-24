/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Kalau logoUrl nanti berupa URL eksternal (misal dari Supabase Storage
    // atau CDN lain), tambahkan hostname-nya di sini supaya next/image bisa
    // memuatnya. Contoh: { protocol: "https", hostname: "xxxx.supabase.co" }
    remotePatterns: [],
  },
};

export default nextConfig;
