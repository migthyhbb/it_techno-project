import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID tidak ditemukan" },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (userId !== user.id) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY belum dipasang di .env.local" },
        { status: 500 }
      );
    }
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    await supabaseAdmin.from("waste_shipments").delete().eq("user_id", userId);
    await supabaseAdmin.from("orders").delete().eq("user_id", userId);
    await supabaseAdmin.from("pesanan_mitra").delete().eq("user_id", userId);
    await supabaseAdmin.from("pencairan_dana").delete().eq("id_agen", userId);
    await supabaseAdmin.from("mitra_profiles").delete().eq("user_id", userId);
    await supabaseAdmin.from("industri_profiles").delete().eq("user_id", userId);
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      userId
    );

    if (deleteError) {
      console.error("Gagal hapus di Auth:", deleteError.message);
      return NextResponse.json(
        { error: `Gagal menghapus auth: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    console.error("Delete Account API Error:", message);

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}