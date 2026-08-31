import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Tambahin ini di paling bawah file route.ts
export async function GET() {
  return NextResponse.json({ message: "HALO BANG! API UPDATE STOK SUDAH NYAMBUNG!" });
}