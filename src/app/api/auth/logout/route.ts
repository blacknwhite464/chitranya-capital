import { NextResponse } from "next/server";
import { destroySession } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to sign out right now." }, { status: 500 });
  }
}
