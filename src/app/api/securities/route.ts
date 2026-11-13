import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SOURCE = "https://raw.githubusercontent.com/binayabaral/nepal-market-data/main/data/reference/nepse-symbols.csv";

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let field = "", quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && quoted && line[i + 1] === '"') { field += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { fields.push(field.trim()); field = ""; }
    else field += char;
  }
  if (quoted) throw new Error("Invalid quoted CSV field.");
  fields.push(field.trim());
  return fields;
}

export async function GET() {
  try {
    const response = await fetch(SOURCE, { headers: { Accept: "text/csv" }, next: { revalidate: 3600 } });
    if (!response.ok) return NextResponse.json({ error: "Community security directory is unavailable." }, { status: 502 });
    const text = (await response.text()).replace(/^\uFEFF/, "");
    if (text.length > 2_000_000) return NextResponse.json({ error: "Security directory exceeds size limit." }, { status: 502 });
    const lines = text.trim().split(/\r?\n/);
    if (lines.shift()?.trim() !== "symbol,name,source_category,instrument_type,sector,status") {
      return NextResponse.json({ error: "Security directory schema changed; import paused pending review." }, { status: 502 });
    }
    const rows = lines.map(parseCsvLine).filter(row => row.length >= 6).map(row => ({
      symbol: row[0].toUpperCase(),
      name: row[1],
      sourceCategory: row[2],
      instrumentType: row[3],
      sector: row[4],
      status: row[5].toLowerCase()
    }));
    const valid = rows.filter(row =>
      /^[A-Z0-9-]{1,24}$/.test(row.symbol) && row.name.length > 0 &&
      ["listed", "merged"].includes(row.status) &&
      ["ordinary", "debenture", "mutual_fund", "promoter_share", "government_bond"].includes(row.instrumentType)
    );
    if (!valid.length || new Set(valid.map(row => row.symbol)).size !== valid.length) {
      return NextResponse.json({ error: "Security directory failed validation." }, { status: 502 });
    }
    return NextResponse.json({
      source: "Nepal Market Data community security master (MIT-licensed dataset; unofficial)",
      sourceUrl: "https://github.com/binayabaral/nepal-market-data",
      retrievedAt: new Date().toISOString(),
      count: valid.length,
      securities: valid
    }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.json({ error: "Could not retrieve or validate the community security directory." }, { status: 502 });
  }
}
