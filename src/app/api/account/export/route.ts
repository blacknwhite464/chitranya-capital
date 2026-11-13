import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Sign in to export your account data." }, { status: 401 });

    const db = getDb();
    const [profile, workspace] = await Promise.all([
      db.query(
        "SELECT email, display_name, role, created_at, email_verified_at FROM users WHERE id=$1 LIMIT 1",
        [user.id]
      ),
      db.query(
        'SELECT schema_version, watchlist, trades, corporate_actions AS "corporateActions", screener_presets AS "screenerPresets", updated_at FROM user_workspace_state WHERE user_id=$1 LIMIT 1',
        [user.id]
      )
    ]);

    if (!profile.rows[0]) return NextResponse.json({ error: "Account profile could not be found." }, { status: 404 });

    const payload = {
      format: "chitranya-capital-account-export",
      version: 1,
      exportedAt: new Date().toISOString(),
      account: profile.rows[0],
      cloudWorkspace: workspace.rows[0] ?? null,
      limitations: [
        "This export includes account profile details and the latest workspace backup saved to your account.",
        "Browser-local records not yet saved to your account, uploaded files, passwords and active session tokens are not included."
      ]
    };

    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="chitranya-capital-account-${date}.json"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (error) {
    if ((error as Error)?.message === "DATABASE_NOT_CONFIGURED") {
      return NextResponse.json({ error: "Account database is not configured." }, { status: 503 });
    }
    return NextResponse.json({ error: "Unable to export account data." }, { status: 500 });
  }
}
