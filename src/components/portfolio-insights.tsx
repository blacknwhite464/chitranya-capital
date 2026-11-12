"use client";

import { useMemo } from "react";
import type { PositionSummary } from "@/lib/portfolio";

type Props = { positions: PositionSummary[] };

const npr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "NPR", maximumFractionDigits: 2 });
const pct = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });

export default function PortfolioInsights({ positions }: Props) {
  const insights = useMemo(() => {
    const open = positions.filter(p => p.quantity > 0);
    const total = open.reduce((sum, p) => sum + p.investedCost, 0);
    const ranked = open.map(p => ({
      ...p,
      weight: total > 0 ? (p.investedCost / total) * 100 : 0
    })).sort((a, b) => b.investedCost - a.investedCost || a.symbol.localeCompare(b.symbol));
    const topThree = ranked.slice(0, 3).reduce((sum, p) => sum + p.weight, 0);
    const hhi = ranked.reduce((sum, p) => sum + (p.weight / 100) ** 2, 0);
    return { ranked, total, topThree, hhi };
  }, [positions]);

  if (!insights.ranked.length) return null;

  return <section className="panel wide-panel portfolio-insights">
    <div className="panel-heading"><div><h3>Portfolio allocation & concentration</h3><p>Based on your remaining invested cost, not current market value</p></div></div>
    <div className="allocation-summary">
      <div><span>Invested cost</span><strong>{npr.format(insights.total)}</strong></div>
      <div><span>Largest position</span><strong>{pct.format(insights.ranked[0].weight)}%</strong><small>{insights.ranked[0].symbol}</small></div>
      <div><span>Top 3 positions</span><strong>{pct.format(insights.topThree)}%</strong></div>
      <div><span>Holdings</span><strong>{insights.ranked.length}</strong></div>
    </div>
    {insights.ranked[0].weight >= 35 && <p className="allocation-warning">Concentration check: {insights.ranked[0].symbol} represents at least 35% of recorded invested cost. Consider the company and sector risks before adding exposure.</p>}
    {insights.topThree >= 70 && insights.ranked.length > 3 && <p className="allocation-warning">Your three largest positions account for at least 70% of invested cost. Portfolio returns may be sensitive to a small number of holdings.</p>}
    <div className="allocation-list">{insights.ranked.map(p=><div className="allocation-row" key={p.symbol}>
      <div className="allocation-label"><strong>{p.symbol}</strong><span>{npr.format(p.investedCost)} · {pct.format(p.weight)}%</span></div>
      <div className="allocation-track" role="img" aria-label={p.symbol+" represents "+pct.format(p.weight)+" percent of invested cost"}><span style={{width:p.weight+"%"}}/></div>
    </div>)}</div>
    <p className="privacy-note">Concentration indicators are descriptive, not investment recommendations. They exclude unrealized gains/losses because verified current prices are not connected.</p>
  </section>;
}
