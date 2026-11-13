import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ symbol: string }> };

const ROOT = "https://raw.githubusercontent.com/binayabaral/nepal-market-data/main/data/nepse/";

function numberOrNull(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const valueNumber = Number(value);
  return Number.isFinite(valueNumber) ? valueNumber : null;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"' && quoted && text[i + 1] === '"') { cell += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(cell.trim()); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim()); cell = "";
      if (row.some(value => value !== "")) rows.push(row);
      row = [];
    } else cell += char;
  }
  if (quoted) throw new Error("Invalid CSV quote.");
  row.push(cell.trim());
  if (row.some(value => value !== "")) rows.push(row);
  return rows;
}

export async function GET(_request: Request, { params }: Params) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();
  if (!/^[A-Z0-9-]{1,24}$/.test(symbol)) return NextResponse.json({ error: "Invalid security symbol." }, { status: 400 });

  try {
    const response = await fetch(ROOT + encodeURIComponent(symbol) + ".csv", {
      headers: { Accept: "text/csv" },
      next: { revalidate: 900 }
    });
    if (response.status === 404) return NextResponse.json({ error: "No historical EOD file is available for this symbol in the community archive." }, { status: 404 });
    if (!response.ok) return NextResponse.json({ error: "Historical EOD archive is temporarily unavailable." }, { status: 502 });
    const csv = (await response.text()).replace(/^\uFEFF/, "");
    if (csv.length > 5_000_000) return NextResponse.json({ error: "Historical data file exceeds size limit." }, { status: 502 });
    const rows = parseCsv(csv);
    const header = rows.shift()?.map(value => value.toLowerCase());
    if (!header || header.join(",") !== "published_date,open,high,low,close,per_change,traded_quantity,traded_amount,status") {
      return NextResponse.json({ error: "Historical data schema changed; data was not processed." }, { status: 502 });
    }
    const history = rows.map(row => ({
      date: row[0],
      open: numberOrNull(row[1]),
      high: numberOrNull(row[2]),
      low: numberOrNull(row[3]),
      close: numberOrNull(row[4]),
      changePercent: numberOrNull(row[5]),
      volume: numberOrNull(row[6]),
      turnoverNpr: numberOrNull(row[7])
    })).filter(row => /^\d{4}-\d{2}-\d{2}$/.test(row.date) &&
      [row.open, row.high, row.low, row.close].every(value => value !== null))
      .sort((a, b) => a.date.localeCompare(b.date));
    if (!history.length) return NextResponse.json({ error: "No valid completed-session history is available for this symbol." }, { status: 404 });
    const latest = history[history.length - 1];
    return NextResponse.json({
      symbol, source: "Nepal Market Data community EOD archive (MIT-licensed dataset; unofficial)",
      sourceUrl: "https://github.com/binayabaral/nepal-market-data",
      status: "end_of_day", asOf: latest.date, count: history.length,
      latest, history: history.slice(-1500)
    }, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.json({ error: "Could not retrieve or validate historical EOD data." }, { status: 502 });
  }
}
