"use client";

import { useMemo, useState } from "react";

const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "NPR", maximumFractionDigits: 2 }).format(value);
const number = (value: number) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 4 }).format(value);

export default function PositionRiskCalculator() {
  const [capital,setCapital]=useState("100000");
  const [riskPercent,setRiskPercent]=useState("1");
  const [entry,setEntry]=useState("");
  const [stop,setStop]=useState("");
  const result=useMemo(()=>{
    const c=Number(capital),r=Number(riskPercent),e=Number(entry),s=Number(stop);
    if(!capital.trim()||!riskPercent.trim()||!entry.trim()||!stop.trim()||![c,r,e,s].every(Number.isFinite)||c<=0||r<=0||r>100||e<=0||s<=0||s>=e)return null;
    const riskBudget=c*r/100, riskPerShare=e-s, riskBasedShares=Math.floor(riskBudget/riskPerShare), cashBasedShares=Math.floor(c/e), shares=Math.min(riskBasedShares,cashBasedShares);
    return {riskBudget,riskPerShare,riskBasedShares,cashBasedShares,shares,capitalLimited:cashBasedShares<riskBasedShares,positionValue:shares*e,actualRisk:shares*riskPerShare,capitalWeight:shares*e/c};
  },[capital,riskPercent,entry,stop]);
  return <section className="panel wide-panel position-risk">
    <div className="panel-heading"><div><h3>Position sizing & risk calculator</h3><p>Estimate share quantity from a fixed risk budget and your own entry/stop assumptions</p></div></div>
    <div className="trade-form risk-inputs">
      <label className="filter-field"><span>Available capital (NPR)</span><input inputMode="decimal" type="number" min="0" value={capital} onChange={e=>setCapital(e.target.value)}/></label>
      <label className="filter-field"><span>Risk budget (%)</span><input inputMode="decimal" type="number" min="0" max="100" step="any" value={riskPercent} onChange={e=>setRiskPercent(e.target.value)}/></label>
      <label className="filter-field"><span>Planned entry price (NPR)</span><input inputMode="decimal" type="number" min="0" step="any" value={entry} onChange={e=>setEntry(e.target.value)} placeholder="e.g. 500"/></label>
      <label className="filter-field"><span>Stop-loss price (NPR)</span><input inputMode="decimal" type="number" min="0" step="any" value={stop} onChange={e=>setStop(e.target.value)} placeholder="e.g. 475"/></label>
    </div>
    {result?<div className="risk-results">
      <div><span>Maximum planned loss</span><strong>{money(result.riskBudget)}</strong></div>
      <div><span>Risk per share</span><strong>{money(result.riskPerShare)}</strong></div>
      <div><span>Estimated shares (both limits)</span><strong>{number(result.shares)}</strong></div>
      <div><span>Risk-budget share limit</span><strong>{number(result.riskBasedShares)}</strong></div>
      <div><span>Cash-budget share limit</span><strong>{number(result.cashBasedShares)}</strong></div>
      <div><span>Position value</span><strong>{money(result.positionValue)}</strong></div>
      <div><span>Estimated capital used</span><strong>{number(result.capitalWeight*100)}%</strong></div>
      <div><span>Risk at stop (before costs/gaps)</span><strong>{money(result.actualRisk)}</strong></div>
      {result.shares===0&&<p className="allocation-warning">The risk budget is smaller than the loss from one share at these prices.</p>}
      {result.capitalLimited&&<p className="allocation-warning">Available capital is the tighter limit. The displayed share quantity is reduced to fit the cash budget.</p>}
    </div>:<p className="privacy-note">Enter positive capital, risk percentage, entry and a stop price below entry to calculate an estimate.</p>}
    <p className="privacy-note">Illustrative arithmetic only. It excludes broker fees, taxes, slippage, liquidity, price gaps and exchange rules. A stop order may execute below the stop price; this does not cap actual losses.</p>
  </section>;
}
