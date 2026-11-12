"use client";

import { useMemo, useRef, useState } from "react";
import { Activity, FileUp, ShieldCheck, X } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { calculateTechnicalAnalysis, type OHLCBar } from "@/lib/technical-analysis";

type ChartRow = OHLCBar & { sma20: number | null; ema20: number | null; rsi: number | null };

function parseCsv(text: string): OHLCBar[] {
  const rows = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(line => line.trim());
  if (rows.length < 3) throw new Error("CSV must contain a header and at least two OHLC rows.");
  const split = (line: string) => {
    const fields: string[] = [];
    let field = "", quoted = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && line[i + 1] === '"' && quoted) { field += '"'; i++; }
      else if (char === '"') quoted = !quoted;
      else if (char === "," && !quoted) { fields.push(field.trim()); field = ""; }
      else field += char;
    }
    if (quoted) throw new Error("CSV contains an unclosed quoted field.");
    fields.push(field.trim());
    return fields;
  };
  const headers = split(rows[0]).map(value => value.toLowerCase().replace(/[\s_-]/g, ""));
  const find = (...names: string[]) => headers.findIndex(header => names.includes(header));
  const dateIndex = find("date", "time", "tradedate", "timestamp");
  const openIndex = find("open");
  const highIndex = find("high");
  const lowIndex = find("low");
  const closeIndex = find("close", "ltp", "closingprice");
  const volumeIndex = find("volume", "totaltradedquantity", "quantity");
  if ([dateIndex, openIndex, highIndex, lowIndex, closeIndex].some(index => index < 0)) {
    throw new Error("Required columns: Date, Open, High, Low and Close. Volume is optional.");
  }
  const bars = rows.slice(1).map((line, index) => {
    const fields = split(line);
    const time = fields[dateIndex];
    const number = (column: number, name: string) => {
      const value = Number(fields[column]?.replace(/,/g, ""));
      if (!Number.isFinite(value)) throw new Error(`Invalid ${name} on CSV row ${index + 2}.`);
      return value;
    };
    const bar: OHLCBar = { time, open: number(openIndex, "Open"), high: number(highIndex, "High"), low: number(lowIndex, "Low"), close: number(closeIndex, "Close") };
    if (volumeIndex >= 0 && fields[volumeIndex]?.trim()) bar.volume = number(volumeIndex, "Volume");
    return bar;
  });
  return bars;
}

const numberFormat = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
const value = (n: number | null | undefined) => n == null ? "—" : numberFormat.format(n);

export default function OHLCAnalysisLab() {
  const input = useRef<HTMLInputElement>(null);
  const [bars, setBars] = useState<OHLCBar[]>([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const analysis = useMemo(() => bars.length ? calculateTechnicalAnalysis(bars) : null, [bars]);
  const rows: ChartRow[] = useMemo(() => bars.map((bar, index) => ({
    ...bar,
    sma20: analysis?.sma[20]?.[index]?.value ?? null,
    ema20: analysis?.ema[12]?.[index]?.value ?? null,
    rsi: analysis?.rsi[index]?.value ?? null
  })), [bars, analysis]);
  const latest = rows.at(-1);
  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true); setError("");
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("CSV file must be 5 MB or smaller.");
      const parsed = parseCsv(await file.text());
      if (parsed.length > 10000) throw new Error("Please upload no more than 10,000 OHLC rows at a time.");
      const calculated = calculateTechnicalAnalysis(parsed);
      if (!calculated) throw new Error("Could not calculate indicators from this file.");
      setBars(parsed); setFileName(file.name);
    } catch (reason) {
      setBars([]); setFileName("");
      setError(reason instanceof Error ? reason.message : "Could not read this CSV file.");
    } finally { setBusy(false); if (input.current) input.current.value = ""; }
  };
  return <section className="panel wide-panel ohlc-lab">
    <div className="ohlc-lab-heading"><div><div className="eyebrow">LOCAL DATA WORKSPACE</div><h3>Analyze your own OHLC history</h3><p>Upload a price-history CSV to calculate indicators without connecting an unverified market feed.</p></div><button className="secondary-button" onClick={() => input.current?.click()} disabled={busy}><FileUp size={15}/>{busy ? "Reading…" : "Upload OHLC CSV"}</button><input ref={input} type="file" accept=".csv,text/csv" hidden onChange={event => upload(event.target.files?.[0])}/></div>
    <div className="ohlc-format-note"><ShieldCheck size={15}/><span>Required headers: Date, Open, High, Low, Close. Optional: Volume. Data is processed in this browser and is not uploaded to CHITRANYA CAPITAL servers.</span></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {bars.length ? <>
      <div className="ohlc-file-row"><strong>{fileName}</strong><span>{bars.length.toLocaleString()} rows · User-provided data</span><button className="icon-danger" onClick={() => {setBars([]);setFileName("");setError("");}} aria-label="Clear uploaded OHLC data"><X size={15}/></button></div>
      <div className="ohlc-metrics"><div><span>Latest close</span><strong>{value(latest?.close)}</strong></div><div><span>SMA 20</span><strong>{value(latest?.sma20)}</strong></div><div><span>EMA 12</span><strong>{value(latest?.ema20)}</strong></div><div><span>RSI 14</span><strong>{value(latest?.rsi)}</strong></div></div>
      <div className="ohlc-chart-wrap"><div className="ohlc-chart-title"><strong>Closing price & moving averages</strong><span>Values from uploaded file only</span></div><ResponsiveContainer width="100%" height={300}><LineChart data={rows} margin={{top:12,right:16,left:0,bottom:4}}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="time" minTickGap={32} tick={{fontSize:11}}/><YAxis domain={["auto","auto"]} tick={{fontSize:11}} width={68}/><Tooltip formatter={(v) => value(Number(v))}/><Line type="monotone" dataKey="close" name="Close" stroke="#D8BD7C" dot={false} strokeWidth={2}/><Line type="monotone" dataKey="sma20" name="SMA 20" stroke="#16A36A" dot={false} strokeWidth={1.5} connectNulls={false}/><Line type="monotone" dataKey="ema20" name="EMA 12" stroke="#6D9FE8" dot={false} strokeWidth={1.5} connectNulls={false}/></LineChart></ResponsiveContainer></div>
      <div className="ohlc-lab-foot"><Activity size={14}/><span>Technical indicators are mathematical summaries, not buy/sell recommendations. Confirm the file's exchange, symbol, adjustment basis and date range before relying on results.</span></div>
    </> : <div className="ohlc-empty"><FileUp size={22}/><strong>No OHLC file loaded</strong><span>Use a CSV exported or prepared from a source you trust. No sample market prices are inserted.</span></div>}
  </section>;
}
