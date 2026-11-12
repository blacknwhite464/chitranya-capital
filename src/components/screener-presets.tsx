"use client";

import { useEffect, useState } from "react";
import { BookmarkPlus, Trash2 } from "lucide-react";

type Criterion = { label: string; options: string[] };
type Preset = ScreenerPreset;

const STORAGE_KEY = "cc-screener-presets-v1";
const criteria: Criterion[] = [
  { label: "Sector", options: ["Banking", "Development Bank", "Finance", "Microfinance", "Life Insurance", "Non-life Insurance", "Hydropower", "Hotels & Tourism", "Manufacturing", "Investment", "Trading", "Other"] },
  { label: "Market capitalization", options: ["Below NPR 1 billion", "NPR 1–5 billion", "NPR 5–20 billion", "Above NPR 20 billion"] },
  { label: "Price range", options: ["Below NPR 200", "NPR 200–500", "NPR 500–1,000", "Above NPR 1,000"] },
  { label: "Daily change", options: ["Below -3%", "-3% to 0%", "0% to 3%", "Above 3%"] },
  { label: "Trading volume", options: ["Below 1,000 shares", "1,000–10,000 shares", "10,000–100,000 shares", "Above 100,000 shares"] },
  { label: "EPS", options: ["Negative", "NPR 0–10", "NPR 10–30", "Above NPR 30"] },
  { label: "P/E ratio", options: ["Negative / not meaningful", "Below 15", "15–25", "25–40", "Above 40"] },
  { label: "Book value per share", options: ["Below NPR 100", "NPR 100–200", "NPR 200–400", "Above NPR 400"] },
  { label: "RSI (14)", options: ["Below 30", "30–50", "50–70", "Above 70"] },
  { label: "Dividend yield", options: ["0%", "Above 0%–3%", "3%–6%", "Above 6%"] },
];

export type ScreenerPreset = { id: string; name: string; values: Record<string,string>; createdAt: string };
export function validateScreenerPresets(value: unknown): ScreenerPreset[] {
  if (!Array.isArray(value) || value.length > 30) throw new Error("Invalid saved screener presets.");
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  return value.map((item: unknown) => {
    if (!item || typeof item !== "object") throw new Error("Invalid saved screener preset.");
    const preset = item as Record<string, unknown>;
    if (typeof preset.id !== "string" || !preset.id || seenIds.has(preset.id) ||
        typeof preset.name !== "string" || !preset.name.trim() || preset.name.length > 50 ||
        seenNames.has(preset.name.trim().toLowerCase()) ||
        typeof preset.createdAt !== "string" || Number.isNaN(Date.parse(preset.createdAt)) ||
        !preset.values || typeof preset.values !== "object" || Array.isArray(preset.values)) {
      throw new Error("Invalid saved screener preset.");
    }
    const values = preset.values as Record<string, unknown>;
    if (Object.entries(values).some(([key, selected]) =>
      !criteria.some(criterion => criterion.label === key && (selected === "" || (typeof selected === "string" && criterion.options.includes(selected))))
    )) throw new Error("Invalid screening criteria in backup.");
    seenIds.add(preset.id);
    seenNames.add(preset.name.trim().toLowerCase());
    return { id: preset.id, name: preset.name.trim(), createdAt: preset.createdAt, values: Object.fromEntries(criteria.map(criterion => [criterion.label, typeof values[criterion.label] === "string" ? values[criterion.label] as string : ""])) };
  });
}

const emptyValues = () => Object.fromEntries(criteria.map(item => [item.label, ""])) as Record<string,string>;

export default function ScreenerPresets() {
  const [values, setValues] = useState<Record<string,string>>(emptyValues);
  const [name, setName] = useState("");
  const [presets, setPresets] = useState<Preset[]>([]);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) { setPresets([]); return; }
        setPresets(validateScreenerPresets(JSON.parse(raw)));
      } catch { setMessage("Saved screening presets could not be read."); }
    };
    load();
    window.addEventListener("cc-screener-presets-updated", load);
    return () => window.removeEventListener("cc-screener-presets-updated", load);
  }, []);
  const persist = (next: Preset[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setPresets(next);
      setMessage("Screening preset saved in this browser.");
    } catch { setMessage("Browser storage is unavailable. Export your browser data before clearing it."); }
  };
  const save = () => {
    const clean = name.trim();
    if (!clean) { setMessage("Enter a name for this screening preset."); return; }
    if (!Object.values(values).some(Boolean)) { setMessage("Choose at least one screening condition."); return; }
    if (presets.some(p => p.name.toLowerCase() === clean.toLowerCase())) { setMessage("A preset with this name already exists."); return; }
    if (presets.length >= 30) { setMessage("You can save up to 30 screening presets."); return; }
    persist([{ id: crypto.randomUUID(), name: clean, values: { ...values }, createdAt: new Date().toISOString() }, ...presets]);
    setName("");
  };
  const load = (preset: Preset) => { setValues({ ...emptyValues(), ...preset.values }); window.dispatchEvent(new CustomEvent("cc-screener-preset-loaded",{detail:preset.values})); setMessage("Preset applied to the imported-data screener. Results use the reporting date in your CSV."); };
  const remove = (id: string) => persist(presets.filter(p => p.id !== id));
  const clear = () => { const empty=emptyValues(); setValues(empty); window.dispatchEvent(new CustomEvent("cc-screener-preset-loaded",{detail:empty})); setMessage("Filter conditions cleared."); };
  return <section className="panel screener-presets">
    <div className="panel-heading"><div><h3>Screening criteria & saved presets</h3><p>Save filter combinations and apply them to an imported stock CSV.</p></div></div>
    <div className="screener-grid">{criteria.map(item => <label key={item.label} className="filter-field"><span>{item.label}</span><select value={values[item.label] ?? ""} onChange={event => setValues(current => ({ ...current, [item.label]: event.target.value }))}><option value="">Any</option>{item.options.map(option => <option key={option} value={option}>{option}</option>)}</select></label>)}</div>
    <div className="preset-save-row"><label className="filter-field"><span>Preset name</span><input value={name} onChange={event => setName(event.target.value)} maxLength={50} placeholder="e.g. Dividend-focused banks"/></label><div className="trade-form-actions"><button className="primary-button" onClick={save}><BookmarkPlus size={14}/> Save preset</button><button className="secondary-button" onClick={clear}>Clear filters</button></div></div>
    {message && <p className="privacy-note" role="status">{message}</p>}
    <div className="saved-presets"><div className="saved-presets-heading"><strong>Saved presets</strong><span>{presets.length} / 30</span></div>{presets.length ? presets.map(preset => <div className="saved-preset-row" key={preset.id}><div><strong>{preset.name}</strong><span>{Object.entries(preset.values).filter(([,value]) => value).map(([key,value]) => key + ": " + value).join(" · ")}</span></div><button className="secondary-button" onClick={() => load(preset)}>Load</button><button className="icon-danger" onClick={() => remove(preset.id)} aria-label={"Delete " + preset.name}><Trash2 size={14}/></button></div>) : <p className="privacy-note">No saved presets yet. Choose criteria and save a combination for later.</p>}</div>
    <p className="privacy-note">Saved presets filter the imported file only. Results reflect the source date and definitions in that file, not live market readings or recommendations. Presets are stored in this browser only.</p>
  </section>;
}
