import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getDb } from "@/lib/server/db";
import { createSession } from "@/lib/server/session";
import { allowAuthAttempt } from "@/lib/server/auth-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const schema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(128) });

export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
    const email = parsed.data.email.toLowerCase();
    if (!(await allowAuthAttempt("login", email, 10))) return NextResponse.json({ error: "Too many sign-in attempts. Try again in 15 minutes." }, { status: 429 });
    const result = await getDb().query(
      "SELECT id,email,display_name,role,password_hash FROM users WHERE email=$1 AND disabled_at IS NULL LIMIT 1",
      [email]
    );
    const user = result.rows[0];
    const valid = user?.password_hash ? await bcrypt.compare(parsed.data.password, user.password_hash) : false;
    if (!valid) return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    await createSession(user.id);
    return NextResponse.json({ user: { id: user.id, email: user.email, display_name: user.display_name, role: user.role } });
  } catch (error) {
    if ((error as Error)?.message === "DATABASE_NOT_CONFIGURED") return NextResponse.json({ error: "Accounts are not available until the production database is configured." }, { status: 503 });
    return NextResponse.json({ error: "Unable to sign in right now." }, { status: 500 });
  }
}
