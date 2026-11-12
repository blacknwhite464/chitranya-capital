import Link from "next/link";

type InfoSection = { title: string; paragraphs: string[]; bullets?: string[] };
export default function InfoPage({eyebrow,title,subtitle,updated,sections}: {eyebrow:string;title:string;subtitle:string;updated:string;sections:InfoSection[]}) {
  return <main className="info-shell"><header className="info-header"><Link href="/" className="info-brand"><span>C</span><strong>CHITRANYA <em>CAPITAL</em></strong></Link><Link href="/" className="info-back">← Back to workspace</Link></header><article className="info-document"><div className="eyebrow"><span className="eyebrow-dot"/> {eyebrow}</div><h1>{title}</h1><p className="info-subtitle">{subtitle}</p><p className="info-updated">Last updated: {updated}</p>{sections.map((section,i)=><section className="info-section" key={section.title}><h2><span>{String(i+1).padStart(2,"0")}</span>{section.title}</h2>{section.paragraphs.map((p,j)=><p key={j}>{p}</p>)}{section.bullets&&<ul>{section.bullets.map(item=><li key={item}>{item}</li>)}</ul>}</section>)}<div className="info-footer"><span>CHITRANYA CAPITAL · SMARTER INVESTING. BETTER DECISIONS.</span><Link href="/">Return to dashboard</Link></div></article></main>;
}
