"use client";

import { useMemo, useState } from "react";
import { Activity, Search, ShieldCheck } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Candle = { date: string; open: number; high: number; low: number; close: number; changePercent: number | null; volume: number | null; turnoverNpr: number | null };
type HistoryResponse = { symbol: string; source: string; sourceUrl: string; status: "end_of_day"; asOf: string; count: number; latest: Candle; history: Candle[] };
type Props = { watchlistSymbols: string[] };

const npr = (value: number | null | undefined) => value === null || value === undefined ? "—" : "NPR " + value.toLocaleString("en-IN", { maximumFractionDigits: 2 });

export default function StockHistoryPanel({ watchlistSymbols }: Props) {
  const [symbol, setSymbol] = useState(watchlistSymbols[0] ?? "");
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const chartData = useMemo(() => (data?.history ?? []).map(row => ({
    ...row,
    shortDate: row.date.slice(2).replace("-", "/")
  })), [data]);

  const load = async (value = symbol) => {
    const normalized = value.trim().toUpperCase();
    if (!/^[A-Z0-9-]{1,24}$/.test(normalized)) { setError("Enter a valid NEPSE symbol."); return; }
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/market/history/" + encodeURIComponent(normalized), { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Historical prices are unavailable.");
      setData(result as HistoryResponse);
      setSymbol(normalized);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Could not load historical prices.");
    } finally { setLoading(false); }
  };

  return <section className="panel stock-history-panel">
    <div className="stock-history-heading"><div><span className="banner-kicker">HISTORICAL PRICE RESEARCH</span><h3>Stock price history</h3><p>Daily completed-session OHLC history from a no-cost community archive.</p></div><span className="muted-chip"><Activity size={13}/> EOD only</span></div>
    <div className="stock-history-search">
      <label className="glossary-search"><Search size={15}/><input value={symbol} maxLength={24} onChange={event => setSymbol(event.target.value.toUpperCase())} onKeyDown={event => { if (event.key === "Enter") void load(); }} placeholder="Enter symbol e.g. NABIL"/></label>
      <button type="button" className="primary-button" onClick={() => void load()} disabled={loading}>{loading ? "Loading…" : "Load history"}</button>
      {watchlistSymbols.length > 0 && <select aria-label="Choose a watchlist symbol" value={symbol} onChange={event => { setSymbol(event.target.value); void load(event.target.value); }}><option value="">Watchlist</option>{watchlistSymbols.map(item => <option key={item} value={item}>{item}</option>)}</select>}
    </div>
    {error && <p className="research-notebook-message" role="alert">{error}</p>}
    {data ? <>
      <div className="stock-history-meta"><div><strong>{data.symbol}</strong><span>Latest archived session: {data.asOf}</span></div><span>{data.count.toLocaleString()} sessions available</span></div>
      <div className="stock-history-metrics">
        <div><span>Last close</span><strong>{npr(data.latest.close)}</strong></div>
        <div><span>Session change</span><strong>{data.latest.changePercent === null ? "—" : data.latest.changePercent.toFixed(2) + "%"}</strong></div>
        <div><span>Session volume</span><strong>{data.latest.volume === null ? "—" : data.latest.volume.toLocaleString()}</strong></div>
        <div><span>Turnover</span><strong>{npr(data.latest.turnoverNpr)}</strong></div>
      </div>
      <div className="stock-history-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false}/>
            <XAxis dataKey="shortDate" minTickGap={42} tick={{ fontSize: 10 }} />
            <YAxis domain={["auto", "auto"]} width={64} tick={{ fontSize: 10 }} tickFormatter={(value: number) => value.toLocaleString("en-IN")}/>
            <Tooltip labelFormatter={label => "Session " + label} formatter={(value) => [npr(Number(value)), "Close"]}/>
            <Line type="monotone" dataKey="close" name="Close" dot={false} strokeWidth={2} isAnimationActive={false}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="stock-history-table">
        <div className="stock-history-table-head"><span>Session</span><span>Open</span><span>High</span><span>Low</span><span>Close</span><span>Volume</span></div>
        {data.history.slice(-8).reverse().map(row => <div className="stock-history-table-row" key={row.date}><span>{row.date}</span><span>{row.open.toLocaleString()}</span><span>{row.high.toLocaleString()}</span><span>{row.low.toLocaleString()}</span><strong>{row.close.toLocaleString()}</strong><span>{row.volume?.toLocaleString() ?? "—"}</span></div>)}
      </div>
      <div className="stock-history-trust"><ShieldCheck size={14}/><span>Unofficial third-party historical data; not a live quote. Raw prices are not adjusted for bonus shares, rights issues or splits. Verify corporate actions before interpreting long-term returns.</span></div>
      <a className="text-link" href={data.sourceUrl} target="_blank" rel="noreferrer">Source: {data.source}</a>
    </> : <div className="stock-discovery-empty"><Activity size={21}/><strong>Choose a stock to inspect its history</strong><p>Historical daily candles are loaded only when requested. No intraday values or adjusted total-return series are implied.</p></div>}
  </section>;
}
