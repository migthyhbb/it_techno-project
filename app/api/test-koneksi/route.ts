import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; 
import { redis } from '@/lib/redis';       

export async function GET() {
  try {
    // Tes Redis
    await redis.set('status_sistem', 'Mesin Sang Cloud Menyala!');
    const redisCheck = await redis.get('status_sistem');

    // Tes Supabase (Pastikan ada tabel 'agen' di dasbor Supabase)
    const { data: supabaseCheck, error } = await supabase.from('agen').select('*').limit(1);
    if (error) throw error;

    return NextResponse.json({ 
      pesan: "Koneksi Sempurna!",
      redis: redisCheck,
      supabase: supabaseCheck
    });

  } catch (error) {
    return NextResponse.json({ pesan: "Ada yang bocor di pipa koneksi", error }, { status: 500 });
  }
}