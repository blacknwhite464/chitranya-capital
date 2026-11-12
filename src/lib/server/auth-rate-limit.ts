import "server-only";
import { createHash } from "node:crypto";
import { getDb } from "@/lib/server/db";

export async function allowAuthAttempt(action: "login" | "register", identity: string, limit: number) {
  const key = createHash("sha256").update(action+"|"+identity.trim().toLowerCase()).digest("hex");
  const result = await getDb().query(
    `INSERT INTO auth_rate_limits (action_key, window_started, attempt_count)
     VALUES ($1,NOW(),1)
     ON CONFLICT (action_key) DO UPDATE SET
       attempt_count = CASE WHEN auth_rate_limits.window_started < NOW() - INTERVAL '15 minutes' THEN 1 ELSE auth_rate_limits.attempt_count + 1 END,
       window_started = CASE WHEN auth_rate_limits.window_started < NOW() - INTERVAL '15 minutes' THEN NOW() ELSE auth_rate_limits.window_started END
     RETURNING attempt_count`,
    [key]
  );
  return Number(result.rows[0]?.attempt_count ?? limit + 1) <= limit;
}
