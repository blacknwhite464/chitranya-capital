import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock3, Database, XCircle } from "lucide-react";
import { getSessionUser } from "@/lib/server/session";
import { getDb } from "@/lib/server/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SyncRun = {
  id: string;
  provider: string;
  data_module: string;
  status: "success" | "partial" | "failed";
  records_received: number;
  started_at: string;
  completed_at: string | null;
  source_timestamp: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    timeZone: "Asia/Kathmandu",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminSyncPage() {
  let user: Awaited<ReturnType<typeof getSessionUser>> = null;
  try { user = await getSessionUser(); } catch { redirect("/account"); }
  if (!user) redirect("/account");
  if (user.role !== "admin") {
    return <main className="admin-shell"><section className="admin-panel"><h1>Administrator access required</h1><Link href="/">Return to website</Link></section></main>;
  }

  let runs: SyncRun[] = [];
  let configured = true;
  try {
    const result = await getDb().query(
      "SELECT id,provider,data_module,status,records_received,started_at,completed_at,source_timestamp FROM data_sync_log ORDER BY started_at DESC LIMIT 100"
    );
    runs = result.rows;
  } catch {
    configured = false;
  }

  const successful = runs.filter((run) => run.status === "success").length;
  const partial = runs.filter((run) => run.status === "partial").length;
  const failed = runs.filter((run) => run.status === "failed").length;

  return <main className="admin-shell">
    <header className="admin-header"><Link href="/" className="admin-brand">CHITRANYA <b>CAPITAL</b></Link><div><span>ADMINISTRATOR</span><Link href="/admin">Dashboard</Link><Link href="/admin/users">Customers</Link><Link href="/account">Account</Link></div></header>
    <section className="admin-content">
      <Link href="/admin" className="admin-back"><ArrowLeft size={14}/> Administration</Link>
      <p className="admin-eyebrow">DATA OPERATIONS</p>
      <h1>Synchronization history</h1>
      <p className="admin-subtitle">Latest 100 ingestion attempts recorded by the server. Times are shown in Nepal time.</p>
      {!configured && <div className="admin-alert">Database is not configured or the data_sync_log table is unavailable.</div>}
      <div className="admin-metrics">
        <article className="admin-metric"><span>Successful runs</span><strong>{successful}</strong></article>
        <article className="admin-metric"><span>Partial runs</span><strong>{partial}</strong></article>
        <article className="admin-metric"><span>Failed runs</span><strong>{failed}</strong></article>
        <article className="admin-metric"><span>History shown</span><strong>{runs.length}</strong></article>
      </div>
      <section className="admin-panel">
        <div className="admin-users-toolbar"><div><h2><Database size={16}/> Ingestion activity</h2><p>Provider and module status, record counts, and source freshness.</p></div><span className="muted-chip">Read-only</span></div>
        {!configured ? null : runs.length === 0 ? <div className="admin-empty"><Clock3 size={22}/><strong>No sync activity yet</strong><span>When a licensed provider is connected and ingestion begins, each run will appear here.</span></div> :
          <div className="admin-sync-table-wrap"><table className="admin-sync-table"><thead><tr><th>Status</th><th>Provider / module</th><th>Records</th><th>Started (NPT)</th><th>Completed (NPT)</th><th>Source timestamp</th></tr></thead><tbody>
            {runs.map((run) => <tr key={run.id}><td><span className={`admin-sync-status ${run.status}`}>{run.status === "success" ? <CheckCircle2 size={13}/> : run.status === "failed" ? <XCircle size={13}/> : <Clock3 size={13}/>} {run.status}</span></td><td><strong>{run.provider}</strong><small>{run.data_module}</small></td><td>{run.records_received.toLocaleString("en-US")}</td><td>{formatDate(run.started_at)}</td><td>{formatDate(run.completed_at)}</td><td>{formatDate(run.source_timestamp)}</td></tr>)}
          </tbody></table></div>}
      </section>
    </section>
  </main>;
}
