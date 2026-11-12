"use client";

import { useEffect, useRef, useState } from "react";
import { BookmarkPlus, Copy, FileDown, MessageSquareText, Trash2 } from "lucide-react";

type ResearchNote = { id: string; question: string; createdAt: string };
type SpeechRecognitionLike = { lang: string; continuous: boolean; interimResults: boolean; onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start: () => void; stop: () => void };
const STORAGE_KEY = "cc-research-notebook-v1";
const templates = [
  { label: "Fundamental analysis", text: "Analyze the company's business model, revenue and profit trend, EPS, book value, ROE, debt, cash flow, valuation and key risks. Separate verified facts from interpretation. Cite every factual claim." },
  { label: "Technical analysis", text: "Review the supplied OHLC history using trend, SMA, EMA, RSI, MACD, volume, support and resistance. State the timeframe and indicator settings. Do not invent missing prices." },
  { label: "Company comparison", text: "Compare the selected companies using the same reporting period and consistent metrics. Highlight data gaps, valuation differences, strengths, weaknesses and material risks. Cite official sources." },
  { label: "Nepali research", text: "यो कम्पनीको उपलब्ध आधिकारिक वित्तीय विवरण र बजार तथ्याङ्कका आधारमा विश्लेषण गर्नुहोस्। EPS, BVPS, ROE, ऋण, नगद प्रवाह, मूल्याङ्कन र मुख्य जोखिम सरल नेपालीमा बुझाउनुहोस्। तथ्य, गणना र अनुमान छुट्याउनुहोस् र स्रोत उल्लेख गर्नुहोस्।" },
];

export default function ResearchNotebook() {
  const [question, setQuestion] = useState("");
  const [notes, setNotes] = useState<ResearchNote[]>([]);
  const [message, setMessage] = useState("");
  const [voiceLanguage, setVoiceLanguage] = useState<"en-US" | "ne-NP">("en-US");
  const [listening, setListening] = useState(false);
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) setNotes(parsed.filter((item): item is ResearchNote =>
          !!item && typeof item.id === "string" && typeof item.question === "string" && typeof item.createdAt === "string"
        ).slice(0, 50));
      }
    } catch { setMessage("Saved research notes could not be read."); }
  }, []);
  const persist = (next: ResearchNote[]) => {
    setNotes(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setMessage("Saved in this browser."); }
    catch { setMessage("Browser storage is unavailable. Export or copy your question."); }
  };
  const save = () => {
    const value = question.trim();
    if (!value) { setMessage("Write a research question first."); return; }
    if (notes.some(note => note.question === value)) { setMessage("This question is already saved."); return; }
    persist([{ id: crypto.randomUUID(), question: value, createdAt: new Date().toISOString() }, ...notes].slice(0, 50));
  };
  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); setMessage("Research question copied."); }
    catch { setMessage("Clipboard access is unavailable in this browser."); }
  };
  const toggleVoice = () => {
    if (listening) { recognition.current?.stop(); setListening(false); return; }
    const browserWindow = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Speech = browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
    if (!Speech) { setMessage("Voice input is not supported in this browser. Try a current version of Chrome."); return; }
    const instance = new Speech();
    instance.lang = voiceLanguage;
    instance.continuous = true;
    instance.interimResults = false;
    instance.onresult = event => {
      const spoken = Array.from(event.results).map(result => result[0]?.transcript ?? "").join(" ").trim();
      if (spoken) setQuestion(current => current ? current + " " + spoken : spoken);
    };
    instance.onerror = () => { setMessage("Voice recognition stopped. Check browser microphone permission."); setListening(false); };
    instance.onend = () => { setListening(false); recognition.current = null; };
    recognition.current = instance;
    try { instance.start(); setListening(true); setMessage("Listening… speak your research question."); }
    catch { setListening(false); setMessage("Could not start voice input. Check microphone permission."); }
  };
  const exportNotes = () => {
    const blob = new Blob([JSON.stringify({ format: "chitranya-capital-research-notebook", version: 1, notes }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "chitranya-capital-research-notes.json"; link.click();
    URL.revokeObjectURL(url);
  };
  useEffect(() => () => { recognition.current?.stop(); }, []);
  return <div className="research-notebook">
    <div className="research-template-row"><span>Start with a research framework</span>{templates.map(template =>
      <button type="button" key={template.label} className="secondary-button" onClick={() => { setQuestion(template.text); setMessage("Template loaded. Add a company or symbol and save your question."); }}>{template.label}</button>
    )}</div>
    <div className="research-voice-row"><label className="field-label" htmlFor="research-question">Research question / अनुसन्धान प्रश्न</label><div><select aria-label="Voice recognition language" value={voiceLanguage} onChange={event => setVoiceLanguage(event.target.value as "en-US" | "ne-NP")} disabled={listening}><option value="en-US">English voice</option><option value="ne-NP">नेपाली आवाज</option></select><button type="button" className={listening?"voice-button listening":"voice-button"} onClick={toggleVoice}><span>{listening?"■":"●"}</span>{listening?"Stop voice input":"Voice input"}</button></div></div>
    <textarea id="research-question" value={question} onChange={event => setQuestion(event.target.value)} placeholder="Example: NABIL को fundamentals कस्तो छ? यसको risk र valuation explain गर।" rows={5}/>
    <div className="panel-actions">
      <span>Questions are stored locally. Browser voice recognition may process audio through your browser provider; the AI engine is not connected yet.</span>
      <div className="research-notebook-actions">
        <button type="button" className="secondary-button" onClick={() => copy(question)} disabled={!question.trim()}><Copy size={14}/>Copy</button>
        <button type="button" className="secondary-button" onClick={save} disabled={!question.trim()}><BookmarkPlus size={14}/>Save question</button>
        <button type="button" className="primary-button" onClick={() => setQuestion("")}>Clear</button>
      </div>
    </div>
    {message && <p className="research-notebook-message" role="status">{message}</p>}
    <div className="research-notes-heading"><div><strong>Saved research notebook</strong><span>{notes.length} of 50 saved questions · this browser only</span></div><button type="button" className="secondary-button" onClick={exportNotes} disabled={!notes.length}><FileDown size={14}/>Export notes</button></div>
    {notes.length ? <div className="research-note-list">{notes.map(note => <article className="research-note" key={note.id}>
      <MessageSquareText size={16}/><div><p>{note.question}</p><time>{new Date(note.createdAt).toLocaleString()}</time></div>
      <button type="button" className="secondary-button" onClick={() => { setQuestion(note.question); setMessage("Question loaded for editing."); }}>Load</button>
      <button type="button" className="icon-danger" aria-label="Delete saved research question" onClick={() => persist(notes.filter(item => item.id !== note.id))}><Trash2 size={14}/></button>
    </article>)}</div> : <p className="research-notebook-empty">Your saved research questions will appear here. This notebook does not generate AI answers or fetch market data.</p>}
  </div>;
}
