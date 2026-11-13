"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, Download, FileUp, Plus, Search, ShieldCheck, RefreshCw } from "lucide-react";

type SecurityRow = { symbol: string; name: string; sector: string; isin: string; listed: boolean; sourceCategory?: string; instrumentType?: string; status?: string };
type Props = { onAddSymbol: (symbol: string) => void; watchlistSymbols: string[] };

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  const input = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '"' && quoted && input[i + 1] === '"') { cell += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(cell.trim()); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && input[i + 1] === "\n") i++;
      row.push(cell.trim()); cell = "";
      if (row.some(value => value !== "")) rows.push(row);
      row = [];
    } else cell += char;
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field.");
  row.push(cell.trim());
  if (row.some(value => value !== "")) rows.push(row);
  return rows;
}

function csvCell(value: string): string {
  return '"' + value.replace(/"/g, '""') + '"';
}

export default function StockDiscovery({ onAddSymbol, watchlistSymbols }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<SecurityRow[]>([]);
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("All sectors");
  const [source, setSource] = useState("");
  const [asOf, setAsOf] = useState("");
  const [message, setMessage] = useState("");
  const [fileName, setFileName] = useState("");
  const [directoryLoading, setDirectoryLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("cc-security-master-v1");
      if (!raw) return;
      const saved = JSON.parse(raw) as { rows?: SecurityRow[]; source?: string; asOf?: string; fileName?: string };
      if (!Array.isArray(saved.rows) || saved.rows.some(row =>
        !row || typeof row.symbol !== "string" || typeof row.name !== "string" ||
        typeof row.sector !== "string" || typeof row.isin !== "string" ||
        typeof row.listed !== "boolean"
      )) throw new Error("Saved security directory has an invalid format.");
      setRows(saved.rows.slice(0, 10000));
      setSource(typeof saved.source === "string" ? saved.source : "");
      setAsOf(typeof saved.asOf === "string" ? saved.asOf : "");
      setFileName(typeof saved.fileName === "string" ? saved.fileName : "Saved browser directory");
    } catch {
      setMessage("A saved security directory could not be restored. Import the source CSV again.");
    }
  }, []);

  useEffect(() => {
    if (!rows.length) return;
    try {
      localStorage.setItem("cc-security-master-v1", JSON.stringify({ rows, source, asOf, fileName }));
    } catch {
      setMessage("Directory is available for this session, but browser storage is full. Export the CSV to keep a copy.");
    }
  }, [rows, source, asOf, fileName]);

  const sectors = useMemo(() => ["All sectors", ...Array.from(new Set(rows.map(row => row.sector).filter(Boolean))).sort()], [rows]);
  const filtered = useMemo(() => rows.filter(row =>
    (sector === "All sectors" || row.sector === sector) &&
    (row.symbol + " " + row.name + " " + row.sector + " " + row.isin + " " + (row.sourceCategory ?? "") + " " + (row.instrumentType ?? "")).toLowerCase().includes(query.trim().toLowerCase())
  ).sort((a, b) => a.symbol.localeCompare(b.symbol)), [rows, sector, query]);

  const loadCommunityDirectory = async () => {
    setDirectoryLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/securities", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.securities)) throw new Error(data.error || "Could not load the community security directory.");
      const next: SecurityRow[] = data.securities.map((row: { symbol: string; name: string; sector: string; sourceCategory: string; instrumentType: string; status: string }) => ({
        symbol: row.symbol, name: row.name, sector: row.sector || "", isin: "",
        listed: row.status === "listed", status: row.status,
        sourceCategory: row.sourceCategory, instrumentType: row.instrumentType
      }));
      if (!next.length || new Set(next.map(row => row.symbol)).size !== next.length) throw new Error("The community directory did not pass duplicate and content checks.");
      setRows(next);
      setSource(typeof data.source === "string" ? data.source : "Community dataset");
      setAsOf("");
      setFileName("Community security master");
      setSector("All sectors");
      setQuery("");
      setMessage(next.length.toLocaleString() + " securities loaded from the community dataset. This is an unofficial reference list, not a live market feed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load the community security directory.");
    } finally {
      setDirectoryLoading(false);
    }
  };

  const importFile = async (file: File) => {
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("Security master file must be 5 MB or smaller.");
      const parsed = parseCsv(await file.text());
      if (parsed.length < 2) throw new Error("The CSV needs a header and at least one company row.");
      const headers = parsed[0].map(value => value.toLowerCase().replace(/\s+/g, ""));
      const required = ["symbol", "name", "sector"];
      for (const key of required) if (!headers.includes(key)) throw new Error("Required CSV columns: symbol, name, sector. Optional: isin, listed.");
      const index = (key: string) => headers.indexOf(key);
      const next = parsed.slice(1).map((values, i) => {
        const get = (key: string) => index(key) < 0 ? "" : (values[index(key)] ?? "").trim();
        const symbol = get("symbol").toUpperCase();
        const name = get("name");
        const listedText = get("listed").toLowerCase();
        if (!/^[A-Z0-9._-]{1,24}$/.test(symbol) || !name || name.length > 180 || !get("sector")) {
          throw new Error("Invalid symbol, company name or sector on CSV row " + (i + 2) + ".");
        }
        if (listedText && !["true", "yes", "1", "listed", "false", "no", "0", "unlisted"].includes(listedText)) {
          throw new Error("Use true/false in the optional listed column (row " + (i + 2) + ").");
        }
        return { symbol, name, sector: get("sector"), isin: get("isin"), listed: !["false", "no", "0", "unlisted"].includes(listedText) };
      });
      if (next.length > 10000) throw new Error("A maximum of 10,000 security records can be imported.");
      if (new Set(next.map(row => row.symbol)).size !== next.length) throw new Error("The file contains duplicate stock symbols.");
      setRows(next);
      setFileName(file.name);
      setSector("All sectors");
      setQuery("");
      setMessage(next.length + " security records imported. Review the source and effective date before relying on this list.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not read this security master file.");
    } finally {
      if (input.current) input.current.value = "";
    }
  };

  const downloadTemplate = () => {
    const csv = "symbol,name,sector,isin,listed\r\n";
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "chitranya-security-master-template.csv"; link.click();
    URL.revokeObjectURL(url);
  };

  const exportRows = () => {
    const csv = [["symbol", "name", "sector", "isin", "status"], ...filtered.map(row => [row.symbol, row.name, row.sector || row.sourceCategory || "", row.isin, row.status || (row.listed ? "listed" : "unlisted")])]
      .map(row => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "chitranya-security-master-filtered.csv"; link.click();
    URL.revokeObjectURL(url);
  };

  return <section className="panel stock-discovery">
    <div className="stock-discovery-heading">
      <div><span className="banner-kicker">SECURITY MASTER</span><h3>Discover listed companies</h3><p>Search and filter an imported company directory. No guessed company list or market values.</p></div>
      <div className="stock-discovery-actions">
        <button type="button" className="secondary-button" onClick={() => void loadCommunityDirectory()} disabled={directoryLoading}><RefreshCw size={14}/>{directoryLoading ? "Loading…" : "Load free directory"}</button>
        <button type="button" className="secondary-button" onClick={downloadTemplate}><Download size={14}/>CSV template</button>
        <button type="button" className="primary-button" onClick={() => input.current?.click()}><FileUp size={14}/>Import directory</button>
        <input ref={input} type="file" accept=".csv,text/csv" hidden onChange={event => { const file = event.target.files?.[0]; if (file) void importFile(file); }}/>
      </div>
    </div>
    <div className="stock-discovery-source">
      <label className="filter-field"><span>Directory source / publisher</span><input value={source} maxLength={120} onChange={event => setSource(event.target.value)} placeholder="e.g. Official exchange / licensed provider"/></label>
      <label className="filter-field"><span>Effective date</span><input type="date" value={asOf} onChange={event => setAsOf(event.target.value)}/></label>
    </div>
    {rows.length ? <>
      <div className="offline-screener-meta"><span>{fileName} · {rows.length.toLocaleString()} securities{source ? " · " + source : ""}{asOf ? " · Effective " + asOf : ""}</span><span>{filtered.length.toLocaleString()} matches</span></div>
      <div className="stock-directory-stats"><div><strong>{rows.length.toLocaleString()}</strong><span>Total securities</span></div><div><strong>{sectors.length - 1}</strong><span>Sector groups</span></div><div><strong>{rows.filter(row => row.listed).length.toLocaleString()}</strong><span>Marked listed</span></div></div>
      <div className="screener-search-row">
        <label className="glossary-search"><Search size={15}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search symbol, company, sector or ISIN"/></label>
        <select aria-label="Filter by sector" value={sector} onChange={event => setSector(event.target.value)}>{sectors.map(value => <option key={value}>{value}</option>)}</select>
        <button type="button" className="secondary-button" onClick={exportRows} disabled={!filtered.length}><Download size={14}/>Export results</button>
      </div>
      <div className="data-table security-directory">
        <div className="table-row"><strong>Symbol</strong><strong>Company</strong><strong>Sector</strong><strong>ISIN</strong><strong>Status</strong><strong>Watchlist</strong></div>
        {filtered.slice(0, 500).map(row => {
          const saved = watchlistSymbols.includes(row.symbol);
          return <div className="table-row" key={row.symbol}><strong>{row.symbol}</strong><span>{row.name}</span><span>{row.sector || row.sourceCategory || "Unclassified"}</span><span>{row.isin || "—"}</span><span>{row.status === "merged" ? "Merged" : row.listed ? "Listed" : "Unlisted"}</span><span>{saved ? <em>Saved</em> : <button type="button" className="icon-edit" aria-label={"Add " + row.symbol + " to watchlist"} onClick={() => onAddSymbol(row.symbol)}><Plus size={15}/></button>}</span></div>;
        })}
      </div>
      {filtered.length > 500 && <p className="privacy-note">Showing 500 of {filtered.length.toLocaleString()} matches. Export results to download the complete filtered directory.</p>}
    </> : <div className="stock-discovery-empty"><Building2 size={22}/><strong>No security directory imported</strong><p>Import a CSV from an authorized or otherwise verified source to unlock company search, sector filtering and one-click watchlist additions.</p><button type="button" className="secondary-button" onClick={downloadTemplate}><Download size={14}/>Download CSV template</button></div>}
    <div className="stock-discovery-trust"><ShieldCheck size={15}/><span>Community directory data is unofficial and may lag exchange changes. CSV imports are user-supplied. Company listings are reference information only; no prices or financial figures are included. Source: <a href="https://github.com/binayabaral/nepal-market-data" target="_blank" rel="noreferrer">Nepal Market Data (MIT)</a>.</span></div>
    {message && <p className="research-notebook-message" role="status">{message}</p>}
  </section>;
}
