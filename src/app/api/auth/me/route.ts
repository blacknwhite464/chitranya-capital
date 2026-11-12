import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    return NextResponse.json({ user });
  } catch (error) {
    if ((error as Error)?.message === "DATABASE_NOT_CONFIGURED") return NextResponse.json({ user: null, configured: false });
    return NextResponse.json({ error: "Unable to check the account session." }, { status: 500 });
  }
}
