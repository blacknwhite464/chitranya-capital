import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "@/lib/server/db";

const COOKIE = "cc_session";
const SESSION_DAYS = 14;

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await getDb().query(
    "INSERT INTO user_sessions (user_id, token_hash, expires_at) VALUES ($1,$2,$3)",
    [userId, tokenHash(token), expires]
  );
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires
  });
}

export async function getSessionUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const result = await getDb().query(
    `SELECT u.id, u.email, u.display_name, u.role
     FROM user_sessions s JOIN users u ON u.id=s.user_id
     WHERE s.token_hash=$1 AND s.expires_at>NOW() AND u.disabled_at IS NULL
     LIMIT 1`,
    [tokenHash(token)]
  );
  return result.rows[0] ?? null;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await getDb().query("DELETE FROM user_sessions WHERE token_hash=$1", [tokenHash(token)]);
  }
  jar.delete(COOKIE);
}
