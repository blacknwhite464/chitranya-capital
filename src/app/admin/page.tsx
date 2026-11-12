import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/server/session";
import { getDb } from "@/lib/server/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Counts = { customers:string; securities:string; sessions:string; priceBars:string; floorsheet:string; financialReports:string; announcements:string; syncRuns:string };

export default async function AdminPage() {
  let user: Awaited<ReturnType<typeof getSessionUser>> = null;
  try { user=await getSessionUser(); } catch { redirect("/account"); }
  if(!user)redirect("/account");
  if(user.role!=="admin")return <main className="admin-shell"><section className="admin-panel"><p className="admin-eyebrow">CHITRANYA CAPITAL</p><h1>Administrator access required</h1><p>Your account does not have administrator permissions.</p><Link href="/">Return to website</Link></section></main>;
  let counts:Counts|null=null;let latestSync:{provider:string;data_module:string;status:string;completed_at:string|null;records_received:number}|null=null;let configured=true;
  try {
    const db=getDb();
    const result=await db.query(`SELECT
      (SELECT COUNT(*) FROM users)::text AS customers,
      (SELECT COUNT(*) FROM securities)::text AS securities,
      (SELECT COUNT(*) FROM market_sessions)::text AS sessions,
      (SELECT COUNT(*) FROM price_bars)::text AS "priceBars",
      (SELECT COUNT(*) FROM floorsheet_transactions)::text AS floorsheet,
      (SELECT COUNT(*) FROM financial_reports)::text AS "financialReports",
      (SELECT COUNT(*) FROM issuer_announcements)::text AS announcements,
      (SELECT COUNT(*) FROM data_sync_log)::text AS "syncRuns"`);
    counts=result.rows[0];
    const sync=await db.query("SELECT provider,data_module,status,completed_at,records_received FROM data_sync_log ORDER BY started_at DESC LIMIT 1");
    latestSync=sync.rows[0]??null;
  } catch { configured=false; }
  const metrics=[["Customer accounts",counts?.customers??"—"],["Listed securities",counts?.securities??"—"],["Market sessions",counts?.sessions??"—"],["Historical price bars",counts?.priceBars??"—"],["Floorsheet records",counts?.floorsheet??"—"],["Financial reports",counts?.financialReports??"—"],["Issuer announcements",counts?.announcements??"—"],["Data sync runs",counts?.syncRuns??"—"]];
  return <main className="admin-shell"><header className="admin-header"><Link href="/" className="admin-brand">CHITRANYA <b>CAPITAL</b></Link><div><span>ADMINISTRATOR</span><Link href="/admin/users">Customers</Link><Link href="/account">Account</Link></div></header><section className="admin-content"><p className="admin-eyebrow">WEBSITE CONTROL CENTER</p><h1>Platform administration</h1><p className="admin-subtitle">Operational overview for the CHITRANYA CAPITAL website. Counts come directly from PostgreSQL.</p>
    {!configured&&<div className="admin-alert">Database is not configured or the schema has not been applied. Add DATABASE_URL and apply docs/database-schema.sql.</div>}
    <div className="admin-metrics">{metrics.map(([label,value])=><article className="admin-metric" key={label}><span>{label}</span><strong>{value}</strong></article>)}</div>
    <section className="admin-panel"><h2>Market-data synchronization</h2>{latestSync?<div className="admin-sync"><span>Provider</span><strong>{latestSync.provider}</strong><span>Module</span><strong>{latestSync.data_module}</strong><span>Last status</span><strong>{latestSync.status}</strong><span>Records received</span><strong>{latestSync.records_received}</strong><span>Completed</span><strong>{latestSync.completed_at?new Date(latestSync.completed_at).toLocaleString("en-GB",{timeZone:"Asia/Kathmandu"}):"Not completed"}</strong></div>:<p>No synchronization records yet. This is expected until an authorized market-data provider is connected.</p>}</section>
    <section className="admin-panel"><h2>Production readiness</h2><ul><li>Market data provider: {process.env.MDP_API_KEY&&process.env.MDP_API_BASE_URL?"Credentials detected; endpoint adapter still requires vendor specifications.":"Not connected"}</li><li>Customer account API: PostgreSQL-backed</li><li>Portfolio cloud backup: Available for signed-in customers (manual save/restore)</li><li>AI answer service: Not connected</li><li>Floorsheet and financial-report ingestion: Not connected</li></ul></section>
  </section></main>;
}
