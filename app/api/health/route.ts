import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export async function GET() {
  const timestamp = new Date().toISOString();
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return NextResponse.json(
      { status: "unhealthy", redis: "disconnected", timestamp },
      { status: 503 },
    );
  }

  try {
    const redis = new Redis({ url, token });
    await redis.ping();
    return NextResponse.json({ status: "healthy", redis: "connected", timestamp }, { status: 200 });
  } catch (error: unknown) {
    console.error("Health check Redis gagal:", error);
    return NextResponse.json(
      { status: "unhealthy", redis: "disconnected", timestamp },
      { status: 503 },
    );
  }
}