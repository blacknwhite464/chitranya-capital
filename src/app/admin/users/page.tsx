"use client";

import { useEffect,useState } from "react";
import Link from "next/link";
import { ArrowLeft, Ban, CheckCircle2, LoaderCircle, RefreshCw, ShieldCheck, Users } from "lucide-react";

type Customer={id:string;email:string;display_name:string|null;role:string;disabled_at:string|null;created_at:string;email_verified_at:string|null};
export default function AdminUsersPage(){
 const [users,setUsers]=useState<Customer[]>([]);
 const [busy,setBusy]=useState(true);
 const [changing,setChanging]=useState("");
 const [error,setError]=useState("");
 const [query,setQuery]=useState("");
 async function load(){
  setBusy(true);setError("");
  try{const r=await fetch("/api/admin/users",{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error??"Unable to load accounts.");setUsers(d.users??[]);}
  catch(e){setError(e instanceof Error?e.message:"Unable to load accounts.");}
  finally{setBusy(false);}
 }
 useEffect(()=>{void load();},[]);
 async function change(user:Customer,action:"disable"|"enable"){
  const verb=action==="disable"?"disable":"re-enable";
  if(!window.confirm(`Are you sure you want to ${verb} ${user.email}?`))return;
  setChanging(user.id);setError("");
  try{const r=await fetch("/api/admin/users",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:user.id,action})});const d=await r.json();if(!r.ok)throw new Error(d.error??"Account update failed.");await load();}
  catch(e){setError(e instanceof Error?e.message:"Account update failed.");}
  finally{setChanging("");}
 }
 const filtered=users.filter(u=>[u.email,u.display_name??"",u.role].join(" ").toLowerCase().includes(query.toLowerCase()));
 return <main className="admin-shell"><header className="admin-header"><Link href="/" className="admin-brand">CHITRANYA <b>CAPITAL</b></Link><div><span>ADMINISTRATOR</span><Link href="/admin">Dashboard</Link><Link href="/account">Account</Link></div></header><section className="admin-content"><Link href="/admin" className="admin-back"><ArrowLeft size={14}/> Administration</Link><p className="admin-eyebrow">CUSTOMER MANAGEMENT</p><h1>Website accounts</h1><p className="admin-subtitle">Review customer accounts and suspend or restore customer access. Administrator roles cannot be changed here.</p>
 {error&&<div className="admin-alert" role="alert">{error}</div>}
 <section className="admin-panel"><div className="admin-users-toolbar"><div><h2><Users size={16}/> Customer accounts</h2><p>{users.length} latest accounts (maximum 200)</p></div><button className="secondary-button" onClick={()=>void load()} disabled={busy}><RefreshCw size={14}/> Refresh</button></div><input className="admin-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name or email address…"/>
 {busy?<div className="admin-loading"><LoaderCircle className="spin"/> Loading accounts…</div>:filtered.length===0?<p>No matching accounts found.</p>:<div className="admin-user-list">{filtered.map(user=><article className="admin-user-row" key={user.id}><div className="admin-user-main"><strong>{user.display_name||"Customer"}</strong><span>{user.email}</span><small>Joined {new Date(user.created_at).toLocaleDateString("en-GB")} · {user.email_verified_at?"Email verified":"Email not verified"}</small></div><div className="admin-user-state">{user.role==="admin"?<span className="admin-role"><ShieldCheck size={13}/> Administrator</span>:user.disabled_at?<span className="admin-disabled">Suspended</span>:<span className="admin-active"><CheckCircle2 size={13}/> Active</span>}{user.role!=="admin"&&<button className={user.disabled_at?"admin-enable":"admin-disable"} disabled={changing===user.id} onClick={()=>void change(user,user.disabled_at?"enable":"disable")}>{changing===user.id?<LoaderCircle size={13} className="spin"/>:user.disabled_at?<CheckCircle2 size={13}/>:<Ban size={13}/>} {user.disabled_at?"Re-enable":"Suspend"}</button>}</div></article>)}</div>}
 </section></section></main>;
}
