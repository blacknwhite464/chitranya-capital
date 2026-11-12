"use client";

import { useEffect, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, BookOpen, BrainCircuit,
  BriefcaseBusiness, Calculator, ChartCandlestick, ChevronDown, CircleHelp,
  Clock3, Command, Compass, FileText, Filter, LayoutDashboard, Menu,
  Newspaper, Search, Settings2, ShieldCheck, Sparkles, Wallet, X
} from "lucide-react";

type Snapshot = {
  provider: string; status: "live" | "delayed" | "end_of_day" | "unavailable";
  asOf: string | null; index: number | null; change: number | null;
  changePercent: number | null; turnoverNpr: number | null;
  advances: number | null; declines: number | null; unchanged: number | null;
  message: string;
};

const nav = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Market", icon: Activity },
  { label: "Stock research", icon: ChartCandlestick },
  { label: "AI analyst", icon: BrainCircuit, tag: "AI" },
  { label: "Stock screener", icon: Filter },
  { label: "Broker intelligence", icon: BriefcaseBusiness },
  { label: "My portfolio", icon: Wallet },
  { label: "IPO & announcements", icon: Newspaper },
  { label: "Financial tools", icon: Calculator },
  { label: "Learning center", icon: BookOpen }
];

const money = (v: number | null) => v == null ? "—" : "NPR " + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(v);
const number = (v: number | null) => v == null ? "—" : new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(v);

export default function Home() {
  const [market, setMarket] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/market", { cache: "no-store" })
      .then(r => r.json())
      .then((data: Snapshot) => { if (active) setMarket(data); })
      .catch(() => { if (active) setMarket(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const status = market?.status ?? "unavailable";
  const statusLabel = status === "live" ? "LIVE DATA" : status === "delayed" ? "DELAYED DATA" : status === "end_of_day" ? "END OF DAY" : "DATA NOT CONNECTED";

  return (
    <main className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">C</div>
          <div><div className="brand-name">CHITRANYA</div><div className="brand-sub">CAPITAL</div></div>
          <button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={18}/></button>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="nav-list">
          {nav.map(item => {
            const Icon = item.icon;
            return <a key={item.label} className={`nav-item ${item.active ? "active" : ""}`} href={item.active ? "/" : "#"} onClick={e => { if (!item.active) e.preventDefault(); }}>
              <Icon size={17}/><span>{item.label}</span>{item.tag && <span className="nav-tag">{item.tag}</span>}
            </a>;
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><div className="help-icon"><CircleHelp size={17}/></div><strong>Need a hand?</strong><p>Explore our guides to get more from the market.</p><a href="#learning">Visit learning center ↗</a></div>
          <a className="nav-item" href="#settings"><Settings2 size={17}/><span>Settings</span></a>
          <div className="profile"><div className="avatar">CC</div><div><strong>Guest workspace</strong><small>Free access</small></div><ChevronDown size={15}/></div>
        </div>
      </aside>

      {menuOpen && <button className="scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)}/>}

      <section className="main-area">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={20}/></button>
          <div className="breadcrumb">Workspace <span>/</span> <strong>Overview</strong></div>
          <div className="top-actions">
            <div className="search-box"><Search size={16}/><span>Search companies, symbols...</span><kbd><Command size={11}/> K</kbd></div>
            <button className="icon-button" aria-label="Notifications"><Bell size={18}/></button>
            <div className="top-avatar">CC</div>
          </div>
        </header>

        <div className="content">
          <div className="welcome-row">
            <div><div className="eyebrow"><span className="eyebrow-dot"/> NEPAL MARKET INTELLIGENCE</div><h1>Market overview</h1><p className="page-subtitle">Your command center for smarter investment decisions.</p></div>
            <div className="date-chip"><Clock3 size={15}/> Nepal Standard Time · UTC+5:45</div>
          </div>

          <section className="market-banner">
            <div className="banner-top"><div><span className="banner-kicker">NEPAL STOCK EXCHANGE</span><h2>NEPSE Index</h2></div><div className={`data-status ${status}`}><span/> {loading ? "CHECKING DATA" : statusLabel}</div></div>
            <div className="banner-main">
              <div className="index-value">{loading ? "Loading…" : number(market?.index ?? null)}</div>
              <div className="index-change"><span className="neutral-change">Verified market data will appear here</span></div>
              <div className="banner-note">{market?.message ?? "Checking market data connection…"}</div>
            </div>
            <div className="banner-footer"><span>Source: {market?.provider ?? "Checking provider"}</span><span>{market?.asOf ? `As of ${new Date(market.asOf).toLocaleString()}` : "No verified quote received"}</span></div>
          </section>

          <div className="section-heading"><div><h3>Market snapshot</h3><p>Key indicators from the latest verified market session.</p></div><span className="session-label"><span/> Provider status</span></div>
          <div className="stats-grid">
            {[
              { label: "Daily change", value: market ? number(market.change) : "—", suffix: market?.changePercent == null ? "" : ` (${market.changePercent.toFixed(2)}%)`, icon: Activity },
              { label: "Total turnover", value: money(market?.turnoverNpr ?? null), icon: Wallet },
              { label: "Advances", value: number(market?.advances ?? null), icon: ArrowUpRight },
              { label: "Declines", value: number(market?.declines ?? null), icon: ArrowDownRight }
            ].map(item => { const Icon = item.icon; return <article className="stat-card" key={item.label}><div className="stat-top"><span>{item.label}</span><Icon size={17}/></div><div className="stat-value">{item.value}<small>{item.suffix}</small></div><div className="stat-foot">Awaiting authorized market feed</div></article>; })}
          </div>

          <div className="two-column">
            <section className="panel chart-panel"><div className="panel-heading"><div><h3>Market performance</h3><p>NEPSE index historical movement</p></div><button className="select-button">1D <ChevronDown size={14}/></button></div><div className="chart-empty"><div className="chart-symbol"><ChartCandlestick size={25}/></div><strong>Historical market data will appear here</strong><span>Connect a licensed data feed to unlock verified price history and interactive charts.</span></div></section>
            <section className="panel movers-panel"><div className="panel-heading"><div><h3>Market movers</h3><p>Top gainers and losers</p></div><button className="text-button">View all ↗</button></div><div className="empty-list"><div className="empty-icon"><Compass size={21}/></div><strong>Waiting for market data</strong><span>Stock movements will populate when the provider is connected.</span></div></section>
          </div>

          <div className="two-column lower-grid">
            <section className="panel"><div className="panel-heading"><div><h3>AI research desk</h3><p>Research grounded in market evidence</p></div><span className="ai-pill"><Sparkles size={13}/> AI POWERED</span></div><div className="ai-card"><div className="ai-orb"><BrainCircuit size={22}/></div><div><strong>Your research copilot</strong><p>Ask about company fundamentals, valuation, technical indicators and portfolio risk once verified data is connected.</p><button className="primary-button" disabled>AI analyst · Coming soon</button></div></div></section>
            <section className="panel"><div className="panel-heading"><div><h3>Market intelligence</h3><p>Events and corporate disclosures</p></div><FileText size={17} className="muted-icon"/></div><div className="empty-list compact"><div className="empty-icon"><Newspaper size={20}/></div><strong>Announcements feed not connected</strong><span>Verified company notices and market news will appear here.</span></div></section>
          </div>

          <footer className="footer"><span>© {new Date().getFullYear()} CHITRANYA CAPITAL</span><span><ShieldCheck size={13}/> Research platform · Not investment advice</span><span>Built for Nepal 🇳🇵</span></footer>
        </div>
      </section>
    </main>
  );
}
