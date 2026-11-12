"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Plus, Pencil, Trash2 } from "lucide-react";

type ActionKind = "cash_dividend" | "bonus_share" | "rights_share";
type ActionRecord = { id:string; symbol:string; kind:ActionKind; actionDate:string; cashReceived:number; sharesCredited:number; note:string; sourceUrl:string };
const STORAGE_KEY="cc-corporate-actions-v1";
const money=(value:number)=>"NPR "+new Intl.NumberFormat("en-IN",{maximumFractionDigits:2}).format(value);
const quantity=(value:number)=>new Intl.NumberFormat("en-IN",{maximumFractionDigits:4}).format(value);

export default function PortfolioCorporateActions(){
  const [records,setRecords]=useState<ActionRecord[]>([]);
  const [symbol,setSymbol]=useState("");
  const [kind,setKind]=useState<ActionKind>("cash_dividend");
  const [actionDate,setActionDate]=useState(new Date().toISOString().slice(0,10));
  const [cashReceived,setCashReceived]=useState("0");
  const [sharesCredited,setSharesCredited]=useState("0");
  const [note,setNote]=useState("");
  const [sourceUrl,setSourceUrl]=useState("");
  const [editingId,setEditingId]=useState<string|null>(null);
  const [message,setMessage]=useState("");
  useEffect(()=>{const load=()=>{try{const saved=localStorage.getItem(STORAGE_KEY);if(saved){const parsed=JSON.parse(saved);if(Array.isArray(parsed))setRecords(parsed);else setMessage("Saved corporate-action records could not be read.");}else setRecords([]);}catch{setMessage("Saved corporate-action records could not be read.");}};load();window.addEventListener("cc-corporate-actions-updated",load);return()=>window.removeEventListener("cc-corporate-actions-updated",load);},[]);
  const totals=useMemo(()=>records.reduce((acc,item)=>({cash:acc.cash+item.cashReceived,shares:acc.shares+item.sharesCredited,count:acc.count+1}),{cash:0,shares:0,count:0}),[records]);
  const persist=(next:ActionRecord[])=>{setRecords(next);localStorage.setItem(STORAGE_KEY,JSON.stringify(next));};
  const reset=()=>{setSymbol("");setKind("cash_dividend");setActionDate(new Date().toISOString().slice(0,10));setCashReceived("0");setSharesCredited("0");setNote("");setSourceUrl("");setEditingId(null);};
  const save=()=>{const cleanSymbol=symbol.trim().toUpperCase(),cash=Number(cashReceived),shares=Number(sharesCredited);const parts=actionDate.split("-").map(Number);const validDate=/^\d{4}-\d{2}-\d{2}$/.test(actionDate)&&new Date(Date.UTC(parts[0],parts[1]-1,parts[2])).toISOString().slice(0,10)===actionDate;if(!cleanSymbol||!validDate||!Number.isFinite(cash)||cash<0||!Number.isFinite(shares)||shares<0||(!cash&&!shares)|| (sourceUrl.trim()&&!/^https:\/\//i.test(sourceUrl.trim()))){setMessage("Enter a symbol, valid date and non-negative cash or share amount. Source links must use HTTPS.");return;}const entry:ActionRecord={id:editingId??crypto.randomUUID(),symbol:cleanSymbol,kind,actionDate,cashReceived:cash,sharesCredited:shares,note:note.trim(),sourceUrl:sourceUrl.trim()};const next=editingId?records.map(item=>item.id===editingId?entry:item):[...records,entry];persist(next);setMessage(editingId?"Corporate-action record updated.":"Corporate-action record saved.");reset();};
  const edit=(item:ActionRecord)=>{setSymbol(item.symbol);setKind(item.kind);setActionDate(item.actionDate);setCashReceived(String(item.cashReceived));setSharesCredited(String(item.sharesCredited));setNote(item.note);setSourceUrl(item.sourceUrl);setEditingId(item.id);setMessage("");};
  const exportCsv=()=>{const quote=(v:string|number)=>{const raw=String(v);return /[",\r\n]/.test(raw)?`"${raw.replace(/"/g,'""')}"`:raw;};const rows=[["Date","Symbol","Action","Cash received (NPR)","Shares credited","Notes","Source URL"],...records.slice().sort((a,b)=>a.actionDate.localeCompare(b.actionDate)).map(x=>[x.actionDate,x.symbol,x.kind,x.cashReceived,x.sharesCredited,x.note,x.sourceUrl])];const blob=new Blob(["\uFEFF",rows.map(row=>row.map(quote).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="chitranya-capital-corporate-actions.csv";a.click();URL.revokeObjectURL(url);};
  return <section className="panel wide-panel corporate-actions-ledger">
    <div className="panel-heading"><div><h3>Corporate-action & dividend ledger</h3><p>Record confirmed cash received and shares credited from your own statements or issuer notices.</p></div><button className="secondary-button" onClick={exportCsv} disabled={!records.length}><Download size={14}/> Export CSV</button></div>
    <div className="stats-grid corporate-action-stats"><div className="stat-card"><div className="stat-top">Cash received</div><div className="stat-value">{money(totals.cash)}</div><div className="stat-foot">Amounts you entered</div></div><div className="stat-card"><div className="stat-top">Shares credited</div><div className="stat-value">{quantity(totals.shares)}</div><div className="stat-foot">Bonus and rights shares</div></div><div className="stat-card"><div className="stat-top">Records</div><div className="stat-value">{totals.count}</div><div className="stat-foot">Manually recorded events</div></div></div>
    <div className="trade-form corporate-action-form">
      <label className="filter-field"><span>Stock symbol</span><input value={symbol} onChange={e=>setSymbol(e.target.value)} placeholder="e.g. NABIL"/></label>
      <label className="filter-field"><span>Action type</span><select value={kind} onChange={e=>setKind(e.target.value as ActionKind)}><option value="cash_dividend">Cash dividend</option><option value="bonus_share">Bonus shares</option><option value="rights_share">Rights shares</option></select></label>
      <label className="filter-field"><span>Credit / payment date</span><input type="date" value={actionDate} onChange={e=>setActionDate(e.target.value)}/></label>
      <label className="filter-field"><span>Cash actually received (NPR)</span><input type="number" min="0" step="any" value={cashReceived} onChange={e=>setCashReceived(e.target.value)}/></label>
      <label className="filter-field"><span>Shares actually credited</span><input type="number" min="0" step="any" value={sharesCredited} onChange={e=>setSharesCredited(e.target.value)}/></label>
      <label className="filter-field"><span>Note / fiscal year</span><input value={note} onChange={e=>setNote(e.target.value)} placeholder="Optional"/></label>
      <label className="filter-field corporate-source"><span>Official notice / statement URL (optional)</span><input type="url" value={sourceUrl} onChange={e=>setSourceUrl(e.target.value)} placeholder="https://…"/></label>
      <div className="trade-form-actions"><button className="primary-button trade-submit" onClick={save}>{editingId?<><Pencil size={14}/> Save changes</>:<><Plus size={14}/> Add corporate action</>}</button>{editingId&&<button className="secondary-button" onClick={reset}>Cancel edit</button>}</div>
    </div>
    {message&&<p className="privacy-note" role="status">{message}</p>}
    {records.length?<div className="data-table corporate-action-table"><div className="table-row corporate-action-head"><span>Date</span><span>Symbol</span><span>Action</span><span>Cash received</span><span>Shares</span><span>Notes / source</span><span/></div>{records.slice().sort((a,b)=>b.actionDate.localeCompare(a.actionDate)).map(item=><div className="table-row corporate-action-row" key={item.id}><span>{item.actionDate}</span><strong>{item.symbol}</strong><span>{item.kind.replace("_"," ")}</span><span>{money(item.cashReceived)}</span><span>{quantity(item.sharesCredited)}</span><span className="corporate-action-note">{item.note}{item.sourceUrl&&<a href={item.sourceUrl} target="_blank" rel="noreferrer">Source ↗</a>}</span><div className="trade-row-actions"><button className="icon-edit" onClick={()=>edit(item)} aria-label={"Edit "+item.symbol+" corporate action"}><Pencil size={13}/></button><button className="icon-danger" onClick={()=>{persist(records.filter(x=>x.id!==item.id));if(editingId===item.id)reset();setMessage("Corporate-action record deleted.");}} aria-label={"Delete "+item.symbol+" corporate action"}><Trash2 size={14}/></button></div></div>)}</div>:<div className="ohlc-empty"><strong>No corporate actions recorded</strong><span>Add amounts and shares from your actual bank, demat or broker statement. No dividend or bonus values are estimated.</span></div>}
    <p className="privacy-note">Stored in this browser only. Cash received is the actual amount you enter, not a gross dividend estimate. Share credits do not automatically change the buy/sell ledger or cost basis; keep supporting statements and reconcile before tax or performance reporting.</p>
  </section>;
}
