"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileUp, ShieldCheck, Trash2 } from "lucide-react";

type FinancialRow = {
  symbol:string; company:string; fiscalYear:string; revenue:number|null; operatingProfit:number|null;
  netProfit:number|null; totalAssets:number|null; totalEquity:number|null; currentAssets:number|null;
  currentLiabilities:number|null; totalDebt:number|null; sharesOutstanding:number|null; eps:number|null;
  bvps:number|null; dividendPerShare:number|null; marketPrice:number|null;
};
const STORE="cc-financial-statements-v1";
const fmt=(n:number|null|undefined)=>n==null||!Number.isFinite(n)?"—":n.toLocaleString("en-IN",{maximumFractionDigits:2});
function parse(text:string):string[][]{
 const lines=text.replace(/^\uFEFF/,"").split(/\r?\n/).filter(x=>x.trim());
 return lines.map(line=>{const out:string[]=[];let cell="",quoted=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'&&quoted&&line[i+1]==='"'){cell+='"';i++;}else if(ch==='"')quoted=!quoted;else if(ch===","&&!quoted){out.push(cell.trim());cell="";}else cell+=ch;}if(quoted)throw new Error("CSV contains an unclosed quoted field.");out.push(cell.trim());return out;});
}
function numeric(value:string|undefined):number|null{if(!value?.trim())return null;const n=Number(value.replace(/,/g,""));return Number.isFinite(n)?n:null;}
function calculate(r:FinancialRow){
 const eps=r.eps??(r.netProfit!==null&&r.sharesOutstanding&&r.sharesOutstanding>0?r.netProfit/r.sharesOutstanding:null);
 const bvps=r.bvps??(r.totalEquity!==null&&r.sharesOutstanding&&r.sharesOutstanding>0?r.totalEquity/r.sharesOutstanding:null);
 return {
  ...r,eps,bvps,
  netMargin:r.netProfit!==null&&r.revenue!==null&&r.revenue!==0?r.netProfit/r.revenue*100:null,
  roe:r.netProfit!==null&&r.totalEquity!==null&&r.totalEquity!==0?r.netProfit/r.totalEquity*100:null,
  roa:r.netProfit!==null&&r.totalAssets!==null&&r.totalAssets!==0?r.netProfit/r.totalAssets*100:null,
  debtEquity:r.totalDebt!==null&&r.totalEquity!==null&&r.totalEquity!==0?r.totalDebt/r.totalEquity:null,
  currentRatio:r.currentAssets!==null&&r.currentLiabilities!==null&&r.currentLiabilities!==0?r.currentAssets/r.currentLiabilities:null,
  pe:r.marketPrice!==null&&eps!==null&&eps>0?r.marketPrice/eps:null,
  pb:r.marketPrice!==null&&bvps!==null&&bvps>0?r.marketPrice/bvps:null,
  dividendYield:r.marketPrice!==null&&r.dividendPerShare!==null&&r.marketPrice>0?r.dividendPerShare/r.marketPrice*100:null
 };
}
export default function FinancialStatementLab(){
 const input=useRef<HTMLInputElement>(null);
 const [rows,setRows]=useState<FinancialRow[]>([]);
 const [fileName,setFileName]=useState("");
 const [source,setSource]=useState("");
 const [asOf,setAsOf]=useState("");
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 const [query,setQuery]=useState("");
 const calculated=useMemo(()=>rows.map(calculate),[rows]);
 const filtered=calculated.filter(r=>(r.symbol+" "+r.company+" "+r.fiscalYear).toLowerCase().includes(query.trim().toLowerCase()));
 const upload=async(file?:File)=>{
  if(!file)return;setError("");setMessage("");
  try{
   if(file.size>5*1024*1024)throw new Error("CSV must be 5 MB or smaller.");
   const data=parse(await file.text());if(data.length<2)throw new Error("CSV needs a header and at least one company row.");
   const headers=data[0].map(v=>v.toLowerCase().replace(/[\s-]/g,"").replace(/_/g,""));
   const idx=(...keys:string[])=>headers.findIndex(v=>keys.includes(v));
   const symbol=idx("symbol","ticker"),company=idx("company","name"),year=idx("fiscalyear","year","period");
   if(symbol<0||year<0)throw new Error("Required columns: symbol and fiscal_year. Add company and financial fields as available.");
   const cols:{key:keyof FinancialRow;aliases:string[]}[]=[
    {key:"revenue",aliases:["revenue","sales"]},{key:"operatingProfit",aliases:["operatingprofit","operatingincome"]},
    {key:"netProfit",aliases:["netprofit","netincome","profitaftertax","pat"]},{key:"totalAssets",aliases:["totalassets","assets"]},
    {key:"totalEquity",aliases:["totalequity","shareholdersequity","equity"]},{key:"currentAssets",aliases:["currentassets"]},
    {key:"currentLiabilities",aliases:["currentliabilities"]},{key:"totalDebt",aliases:["totaldebt","debt","borrowings"]},
    {key:"sharesOutstanding",aliases:["sharesoutstanding","numberofshares","shares"]},{key:"eps",aliases:["eps","earningspershare"]},
    {key:"bvps",aliases:["bvps","bookvaluepershare"]},{key:"dividendPerShare",aliases:["dividendpershare","dps"]},
    {key:"marketPrice",aliases:["marketprice","shareprice","price"]}
   ];
   const next:FinancialRow[]=data.slice(1).map((line,i)=>{
    const get=(j:number)=>j<0?"":line[j]??"";
    const sym=get(symbol).toUpperCase();const fy=get(year);
    if(!/^[A-Z0-9._-]{1,24}$/.test(sym)||!fy)throw new Error("Invalid symbol or fiscal year on row "+(i+2)+".");
    const item:Record<string,string|number|null>={symbol:sym,company:get(company),fiscalYear:fy};
    for(const col of cols){const j=idx(...col.aliases);item[col.key]=numeric(get(j));}
    return item as unknown as FinancialRow;
   });
   if(next.length>5000)throw new Error("Maximum 5,000 company-period rows per import.");
   if(next.some(r=>Object.values(r).some(v=>typeof v==="number"&&!Number.isFinite(v))))throw new Error("Financial file contains invalid numeric values.");
   const keySet=next.map(r=>r.symbol+"|"+r.fiscalYear);if(new Set(keySet).size!==keySet.length)throw new Error("Duplicate symbol and fiscal-year records found.");
   const record={rows:next,fileName:file.name,source,asOf};localStorage.setItem(STORE,JSON.stringify(record));
   setRows(next);setFileName(file.name);setMessage(next.length+" financial statement records imported and saved in this browser.");
  }catch(e){setError(e instanceof Error?e.message:"Could not import financial CSV.");}
  finally{if(input.current)input.current.value="";}
 };
 const restore=()=>{try{const raw=localStorage.getItem(STORE);if(raw){const d=JSON.parse(raw);if(Array.isArray(d.rows)){setRows(d.rows);setFileName(d.fileName||"Saved local file");setSource(d.source||"");setAsOf(d.asOf||"");}}}catch{setError("Saved financial data could not be restored.");}};
 useEffect(()=>{restore();},[]);
 const exportCsv=()=>{
  const headers=["symbol","company","fiscal_year","revenue","net_profit","eps","bvps","net_margin_pct","roe_pct","roa_pct","debt_equity","current_ratio","pe","pb","dividend_yield_pct"];
  const output=[headers,...filtered.map(r=>[r.symbol,r.company,r.fiscalYear,r.revenue,r.netProfit,r.eps,r.bvps,r.netMargin,r.roe,r.roa,r.debtEquity,r.currentRatio,r.pe,r.pb,r.dividendYield])];
  const csv=output.map(line=>line.map(v=>{const s=v==null?"":String(v);return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}).join(",")).join("\r\n");
  const url=URL.createObjectURL(new Blob(["\uFEFF",csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="chitranya-financial-ratios.csv";a.click();URL.revokeObjectURL(url);
 };
 return <section className="panel wide-panel financial-lab">
  <div className="stock-history-heading"><div><span className="banner-kicker">LOCAL FUNDAMENTAL RESEARCH</span><h3>Financial statements & ratios</h3><p>Import annual or quarterly company figures and calculate ratios in this browser. No API connection.</p></div><button type="button" className="primary-button" onClick={()=>input.current?.click()}><FileUp size={14}/>Import financial CSV</button><input ref={input} type="file" accept=".csv,text/csv" hidden onChange={e=>void upload(e.target.files?.[0])}/></div>
  <div className="ohlc-format-note"><ShieldCheck size={15}/><span>Required: symbol, fiscal_year. Optional: revenue, operating_profit, net_profit, total_assets, total_equity, current_assets, current_liabilities, total_debt, shares_outstanding, eps, bvps, dividend_per_share, market_price. Values must use consistent currency and units.</span></div>
  <div className="stock-discovery-source"><label className="filter-field"><span>Source / publisher</span><input value={source} maxLength={140} onChange={e=>setSource(e.target.value)} placeholder="Company annual report / official disclosure"/></label><label className="filter-field"><span>Report effective date</span><input type="date" value={asOf} onChange={e=>setAsOf(e.target.value)}/></label></div>
  {error&&<p className="research-notebook-message" role="alert">{error}</p>}{message&&<p className="research-notebook-message" role="status">{message}</p>}
  {rows.length>0?<><div className="offline-screener-meta"><span>{fileName} · {rows.length} company-period records · {source||"Source not specified"}{asOf?" · "+asOf:""}</span><span>{filtered.length} shown</span></div><div className="screener-search-row"><label className="glossary-search"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Filter symbol, company or fiscal year"/></label><button type="button" className="secondary-button" onClick={exportCsv}><Download size={14}/>Export ratios</button><button type="button" className="secondary-button" onClick={()=>{localStorage.removeItem(STORE);setRows([]);setFileName("");setMessage("Local financial records cleared.");}}><Trash2 size={14}/>Clear data</button></div>
  <div className="data-table financial-table"><div className="table-row"><strong>Symbol / FY</strong><strong>Net profit</strong><strong>EPS</strong><strong>ROE</strong><strong>ROA</strong><strong>Net margin</strong><strong>Debt / equity</strong><strong>Current ratio</strong><strong>P/E</strong><strong>P/B</strong></div>{filtered.slice(0,250).map(r=><div className="table-row" key={r.symbol+"-"+r.fiscalYear}><strong>{r.symbol}<small>{r.fiscalYear}</small></strong><span>{fmt(r.netProfit)}</span><span>{fmt(r.eps)}</span><span>{r.roe==null?"—":fmt(r.roe)+"%"}</span><span>{r.roa==null?"—":fmt(r.roa)+"%"}</span><span>{r.netMargin==null?"—":fmt(r.netMargin)+"%"}</span><span>{fmt(r.debtEquity)}</span><span>{fmt(r.currentRatio)}</span><span>{fmt(r.pe)}</span><span>{fmt(r.pb)}</span></div>)}</div>
  <p className="privacy-note">P/E, P/B and dividend yield are calculated only when a market price is supplied in the same imported record. Ratios are mathematical calculations, not recommendations. Check fiscal period, consolidation basis, units, share count and accounting notes.</p></>:<div className="stock-discovery-empty"><FileUp size={22}/><strong>No financial statements imported</strong><p>Import figures from company annual reports or another source you trust. CHITRANYA CAPITAL does not invent missing values.</p></div>}
 </section>;
}
