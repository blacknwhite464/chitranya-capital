"use client";

import { useMemo, useRef, useState } from "react";
import { Activity, Download, FileUp, Search, ShieldCheck, Trash2 } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Candle = { date: string; open: number; high: number; low: number; close: number; changePercent: number | null; volume: number | null; turnoverNpr: number | null };
type SavedHistory = { symbol: string; source: string; asOf: string; history: Candle[]; fileName: string };
type Props = { watchlistSymbols: string[] };
const STORE = "cc-stock-history-v1";
const npr = (value: number | null | undefined) => value === null || value === undefined ? "—" : "NPR " + value.toLocaleString("en-IN", { maximumFractionDigits: 2 });

function parseCsv(text: string): Candle[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 3) throw new Error("CSV must contain a header and at least two price rows.");
  const split = (line: string) => {
    const out: string[] = []; let field = "", quoted = false;
    for (let i=0;i<line.length;i++) { const ch=line[i]; if(ch==='"'&&quoted&&line[i+1]==='"'){field+='"';i++;} else if(ch==='"') quoted=!quoted; else if(ch===","&&!quoted){out.push(field.trim());field="";} else field+=ch; }
    if(quoted) throw new Error("CSV has an unclosed quoted field."); out.push(field.trim()); return out;
  };
  const headers=split(lines[0]).map(v=>v.toLowerCase().replace(/[\s_-]/g,""));
  const idx=(...names:string[])=>headers.findIndex(v=>names.includes(v));
  const date=idx("date","publisheddate","time","tradedate");
  const open=idx("open"),high=idx("high"),low=idx("low"),close=idx("close","ltp","closingprice");
  const change=idx("perchange","changepercent","change"),volume=idx("tradedquantity","volume","quantity"),turnover=idx("tradedamount","turnover","turnovernpr");
  if([date,open,high,low,close].some(i=>i<0)) throw new Error("Required CSV columns: published_date (or date), open, high, low, close. Optional: per_change, traded_quantity, traded_amount.");
  const rows=lines.slice(1).map((line,i)=>{const f=split(line);const num=(i:number)=>{if(i<0||!f[i]?.trim())return null;const n=Number(f[i].replace(/,/g,""));return Number.isFinite(n)?n:null;};const d=f[date];const o=num(open),h=num(high),l=num(low),c=num(close);if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||[o,h,l,c].some(v=>v===null))throw new Error("Invalid date or OHLC value on CSV row "+(i+2)+".");if(h!<Math.max(o!,c!,l!)||l!>Math.min(o!,c!,h!))throw new Error("Invalid high/low range on CSV row "+(i+2)+".");return {date:d,open:o!,high:h!,low:l!,close:c!,changePercent:num(change),volume:num(volume),turnoverNpr:num(turnover)};});
  rows.sort((a,b)=>a.date.localeCompare(b.date));
  if(new Set(rows.map(r=>r.date)).size!==rows.length) throw new Error("CSV contains duplicate session dates.");
  if(rows.length>10000) throw new Error("Maximum 10,000 sessions per file.");
  return rows;
}

export default function StockHistoryPanel({watchlistSymbols}:Props){
  const input=useRef<HTMLInputElement>(null);
  const [symbol,setSymbol]=useState(watchlistSymbols[0]??"");
  const [source,setSource]=useState("");
  const [history,setHistory]=useState<Candle[]>([]);
  const [fileName,setFileName]=useState("");
  const [saved,setSaved]=useState<SavedHistory[]>([]);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [loaded,setLoaded]=useState(false);
  const chartData=useMemo(()=>history.map(row=>({...row,shortDate:row.date.slice(2).replace("-","/")})),[history]);
  const loadSaved=(items:SavedHistory[],key:string)=>{const found=items.find(x=>x.symbol===key);if(found){setSymbol(found.symbol);setSource(found.source);setHistory(found.history);setFileName(found.fileName);setMessage("Loaded saved local history for "+key+".");setError("");return true;}return false;};
  const restore=()=>{try{const raw=localStorage.getItem(STORE);if(raw){const parsed=JSON.parse(raw);if(Array.isArray(parsed))setSaved(parsed);}}catch{setError("Saved history could not be restored. Import your CSV again.");}setLoaded(true);};
  useMemo(()=>{if(typeof window!=="undefined"&&!loaded)restore();return null;},[loaded]);
  const importFile=async(file?:File)=>{if(!file)return;setError("");setMessage("");try{if(file.size>5*1024*1024)throw new Error("CSV file must be 5 MB or smaller.");const rows=parseCsv(await file.text());const key=symbol.trim().toUpperCase();if(!/^[A-Z0-9._-]{1,24}$/.test(key))throw new Error("Enter the stock symbol before importing.");const record:SavedHistory={symbol:key,source:source.trim()||"User-imported CSV (source not specified)",asOf:rows[rows.length-1].date,history:rows,fileName:file.name};const next=[...saved.filter(x=>x.symbol!==key),record];try{localStorage.setItem(STORE,JSON.stringify(next));}catch{throw new Error("Browser storage is full. Export or remove saved history before importing.");}setSaved(next);setHistory(rows);setSymbol(key);setFileName(file.name);setMessage(rows.length.toLocaleString()+" sessions imported and saved in this browser.");}catch(e){setError(e instanceof Error?e.message:"Could not import CSV.");}finally{if(input.current)input.current.value="";}};
  const downloadCsv=()=>{const rows=[["date","open","high","low","close","change_percent","volume","turnover_npr"],...history.map(r=>[r.date,r.open,r.high,r.low,r.close,r.changePercent??"",r.volume??"",r.turnoverNpr??""])];const csv=rows.map(r=>r.join(",")).join("\r\n");const url=URL.createObjectURL(new Blob(["\uFEFF",csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download=(symbol||"stock")+"-history.csv";a.click();URL.revokeObjectURL(url);};
  const latest=history.at(-1);
  return <section className="panel stock-history-panel">
    <div className="stock-history-heading"><div><span className="banner-kicker">LOCAL PRICE RESEARCH</span><h3>Stock price history</h3><p>Import historical OHLC CSV files. Analysis runs in this browser; no market-data API is used.</p></div><span className="muted-chip"><Activity size={13}/> Offline / local</span></div>
    <div className="stock-history-search"><label className="glossary-search"><Search size={15}/><input value={symbol} maxLength={24} onChange={e=>setSymbol(e.target.value.toUpperCase())} placeholder="Enter symbol e.g. NABIL"/></label><select aria-label="Saved stock history" value={saved.some(x=>x.symbol===symbol)?symbol:""} onChange={e=>{const item=saved.find(x=>x.symbol===e.target.value);if(item)loadSaved(saved,item.symbol);}}><option value="">Saved histories</option>{saved.map(x=><option key={x.symbol} value={x.symbol}>{x.symbol} · {x.asOf}</option>)}</select><button type="button" className="primary-button" onClick={()=>input.current?.click()}><FileUp size={14}/>Import OHLC CSV</button><input ref={input} type="file" accept=".csv,text/csv" hidden onChange={e=>void importFile(e.target.files?.[0])}/></div>
    <div className="stock-history-search"><label className="filter-field"><span>Data source / publisher</span><input value={source} maxLength={140} onChange={e=>setSource(e.target.value)} placeholder="e.g. NEPSE download, broker statement"/></label></div>
    {error&&<p className="research-notebook-message" role="alert">{error}</p>}{message&&<p className="research-notebook-message" role="status">{message}</p>}
    {latest?<><div className="stock-history-meta"><div><strong>{symbol}</strong><span>Latest session: {latest.date}</span></div><span>{history.length.toLocaleString()} sessions · {fileName}</span></div>
      <div className="stock-history-metrics"><div><span>Last close</span><strong>{npr(latest.close)}</strong></div><div><span>Session change</span><strong>{latest.changePercent===null?"—":latest.changePercent.toFixed(2)+"%"}</strong></div><div><span>Session volume</span><strong>{latest.volume===null?"—":latest.volume.toLocaleString()}</strong></div><div><span>Turnover</span><strong>{npr(latest.turnoverNpr)}</strong></div></div>
      <div className="stock-history-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{top:12,right:16,left:4,bottom:4}}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="shortDate" minTickGap={42} tick={{fontSize:10}}/><YAxis domain={["auto","auto"]} width={64} tick={{fontSize:10}} tickFormatter={(v:number)=>v.toLocaleString("en-IN")}/><Tooltip labelFormatter={label=>"Session "+label} formatter={(v)=>[npr(Number(v)),"Close"]}/><Line type="monotone" dataKey="close" name="Close" dot={false} strokeWidth={2} isAnimationActive={false}/></LineChart></ResponsiveContainer></div>
      <div className="stock-history-table"><div className="stock-history-table-head"><span>Session</span><span>Open</span><span>High</span><span>Low</span><span>Close</span><span>Volume</span></div>{history.slice(-8).reverse().map(r=><div className="stock-history-table-row" key={r.date}><span>{r.date}</span><span>{r.open.toLocaleString()}</span><span>{r.high.toLocaleString()}</span><span>{r.low.toLocaleString()}</span><strong>{r.close.toLocaleString()}</strong><span>{r.volume?.toLocaleString()??"—"}</span></div>)}</div>
      <div className="backup-actions"><button type="button" className="secondary-button" onClick={downloadCsv}><Download size={14}/>Export history CSV</button><button type="button" className="secondary-button" onClick={()=>{const next=saved.filter(x=>x.symbol!==symbol);localStorage.setItem(STORE,JSON.stringify(next));setSaved(next);setHistory([]);setFileName("");setMessage("Removed saved history for "+symbol+".");}}><Trash2 size={14}/>Remove saved history</button></div>
      <div className="stock-history-trust"><ShieldCheck size={14}/><span>{source||"User-provided data"} · Imported locally and not independently verified. Prices may be unadjusted for bonus shares, rights issues or splits; verify source and corporate actions before interpreting returns.</span></div>
    </>:<div className="stock-discovery-empty"><Activity size={21}/><strong>No local history loaded</strong><p>Prepare a CSV with Date, Open, High, Low and Close columns. Optional columns: per_change, traded_quantity and traded_amount. Nothing is downloaded or fetched automatically.</p></div>}
  </section>;
}
