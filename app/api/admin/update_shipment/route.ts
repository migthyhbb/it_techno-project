import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { shipmentId, newStatus, userId, perkiraanBerat, isB3, currentStatus } = await req.json();
    const supabaseAuth = await createServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user) return NextResponse.json({ error: "Sesi habis, silakan login ulang." }, { status: 401 });

    const { data: adminProfile } = await supabaseAuth
      .from("admin_profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .single();

    if (!adminProfile) {
      return NextResponse.json({ error: "Akses ilegal! Anda bukan Admin." }, { status: 403 });
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { error: errShipment } = await supabaseAdmin
      .from("waste_shipments")
      .update({ status: newStatus })
      .eq("id", shipmentId);

    if (errShipment) throw new Error("Gagal update status limbah: " + errShipment.message);
    if (
      newStatus.toLowerCase() === "selesai" && 
      currentStatus.toLowerCase() !== "selesai" && 
      !isB3
    ) {
      const tokenDidapat = perkiraanBerat * 100;
      const { data: profile, error: errCek } = await supabaseAdmin
        .from("industri_profiles")
        .select("saldo_kredit")
        .eq("user_id", userId)
        .single();

      if (errCek) throw new Error("Gagal mengecek saldo saat ini: " + errCek.message);

      const saldoBaru = (profile?.saldo_kredit || 0) + tokenDidapat;
      const { error: errUpdateSaldo } = await supabaseAdmin
        .from("industri_profiles")
        .update({ saldo_kredit: saldoBaru })
        .eq("user_id", userId);

      if (errUpdateSaldo) throw new Error("Gagal menyuntik token: " + errUpdateSaldo.message);
    }

    return NextResponse.json({ success: true, message: "Status dan Token berhasil disinkronisasi ke Database!" }, { status: 200 });

  } catch (error: any) {
    console.error("API Admin Update Error:", error);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan sistem." }, { status: 500 });
  }
}