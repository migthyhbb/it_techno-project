import { Redis as UpstashRedis } from "@upstash/redis";
import IORedis from "ioredis";

/**
 * Ada 2 cara umum menyambungkan Next.js ke Redis:
 *
 * 1) Upstash (REST) — kalau redis-nya di-hosting di Upstash, atau kamu
 *    deploy ke Vercel Edge Runtime / serverless yang tidak cocok pakai
 *    koneksi TCP yang tetap terbuka. Redis biasa TIDAK punya REST API
 *    sendiri; Upstash yang membungkusnya jadi HTTP di depannya.
 *    Env: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 *
 * 2) Koneksi TCP langsung (ioredis) — cara umum untuk Redis self-hosted,
 *    Redis Cloud, AWS ElastiCache, DigitalOcean Managed Redis, dll, ATAU
 *    kalau Next.js kamu jalan di server Node.js biasa (bukan edge).
 *    Env: REDIS_URL (format: redis://default:password@host:6379,
 *    atau rediss:// kalau pakai TLS)
 *
 * getLeaderboardEntries() di get-leaderboard.ts otomatis pakai salah satu
 * dari dua ini, tergantung env variable mana yang diisi.
 */

export function getUpstashClient(): UpstashRedis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new UpstashRedis({ url, token });
}

let ioredisClient: IORedis | null = null;

export function getIoRedisClient(): IORedis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (!ioredisClient) {
    ioredisClient = new IORedis(url, { maxRetriesPerRequest: 2 });
  }
  return ioredisClient;
}
