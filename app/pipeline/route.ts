import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    return NextResponse.json({ 
      success: true, 
      message: "Pipeline mockup active",
      data: body 
    });
  } catch {
    return NextResponse.json({ success: true });
  }
}

export async function GET() {
  return NextResponse.json({ success: true, message: "Pipeline active" });
}