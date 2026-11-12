import { NextResponse } from "next/server";
import { destroySession } from "@/lib/server/session";
import { isSameOriginRequest } from "@/lib/server/request-security";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  try {
    await destroySession();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to sign out right now." }, { status: 500 });
  }
}
