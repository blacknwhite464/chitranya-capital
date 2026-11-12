import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getDb } from "@/lib/server/db";
import { createSession } from "@/lib/server/session";
import { allowAuthAttempt } from "@/lib/server/auth-rate-limit";
import { isSameOriginRequest } from "@/lib/server/request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(128)
});

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Enter a valid name, email and a password of at least 12 characters." }, { status: 400 });
    const { name, password } = parsed.data;
    const email = parsed.data.email.toLowerCase();
    if (!(await allowAuthAttempt("register", email, 5))) return NextResponse.json({ error: "Too many account creation attempts. Try again in 15 minutes." }, { status: 429 });
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await getDb().query(
      "INSERT INTO users (email, display_name, password_hash) VALUES ($1,$2,$3) RETURNING id,email,display_name,role",
      [email, name, passwordHash]
    );
    await createSession(result.rows[0].id);
    return NextResponse.json({ user: result.rows[0] }, { status: 201 });
  } catch (error) {
    const code = (error as { code?: string; message?: string })?.code;
    if (code === "23505") return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    if ((error as Error)?.message === "DATABASE_NOT_CONFIGURED") return NextResponse.json({ error: "Accounts are not available until the production database is configured." }, { status: 503 });
    return NextResponse.json({ error: "Unable to create the account right now." }, { status: 500 });
  }
}
