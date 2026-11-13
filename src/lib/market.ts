export type MarketStatus = "live" | "delayed" | "end_of_day" | "unavailable";
export type MarketSnapshot = {
  provider: string; status: MarketStatus; asOf: string | null; index: number | null;
  change: number | null; changePercent: number | null; turnoverNpr: number | null;
  advances: number | null; declines: number | null; unchanged: number | null; message: string;
};
const COMMUNITY_ARCHIVE = "https://raw.githubusercontent.com/binayabaral/nepal-market-data/main/data/nepse/NEPSE_INDEX.csv";
const COMMUNITY_SOURCE = "Nepal Market Data community EOD archive";
const emptySnapshot = (provider: string, message: string): MarketSnapshot => ({
  provider, status: "unavailable", asOf: null, index: null, change: null, changePercent: null,
  turnoverNpr: null, advances: null, declines: null, unchanged: null, message
});
function parseNumber(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
function nepalToday(): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (type: string) => parts.find(part => part.type === type)?.value ?? "";
  return get("year") + "-" + get("month") + "-" + get("day");
}
function calendarDaysBetween(older: string, newer: string): number {
  const [oy, om, od] = older.split("-").map(Number), [ny, nm, nd] = newer.split("-").map(Number);
  return Math.floor((Date.UTC(ny, nm - 1, nd) - Date.UTC(oy, om - 1, od)) / 86400000);
}
async function getCommunityEodSnapshot(): Promise<MarketSnapshot> {
  try {
    const response = await fetch(COMMUNITY_ARCHIVE, { headers: { Accept: "text/csv" }, next: { revalidate: 900 } });
    if (!response.ok) return emptySnapshot(COMMUNITY_SOURCE, "The community EOD archive is temporarily unavailable. No market figures are being estimated.");
    const csv = await response.text();
    if (csv.length > 5_000_000) return emptySnapshot(COMMUNITY_SOURCE, "The archive response exceeded the expected size and was not processed.");
    const lines = csv.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
    if (lines.length < 2 || lines[0].trim() !== "published_date,open,high,low,close,per_change,traded_quantity,traded_amount,status") {
      return emptySnapshot(COMMUNITY_SOURCE, "The archive format changed. Data is withheld until its schema can be checked.");
    }
    const records = lines.slice(1).map(line => {
      const fields = line.split(",");
      return { date: fields[0], close: parseNumber(fields[4]), percent: parseNumber(fields[5]), turnover: parseNumber(fields[7]) };
    }).filter(row => /^\d{4}-\d{2}-\d{2}$/.test(row.date) && row.close !== null)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (!records.length) return emptySnapshot(COMMUNITY_SOURCE, "No valid completed index sessions were found in the archive.");
    const latest = records[records.length - 1], previous = records.length > 1 ? records[records.length - 2] : null;
    const age = calendarDaysBetween(latest.date, nepalToday());
    const change = previous ? Number((latest.close! - previous.close!).toFixed(2)) : null;
    const staleNote = age > 3 ? " The latest archived session is " + age + " calendar days old; treat it as historical, not current market data." : " This is completed-session data, not a live quote.";
    return {
      provider: COMMUNITY_SOURCE + " (MIT-licensed dataset; unofficial, not an exchange feed)",
      status: "end_of_day", asOf: latest.date, index: latest.close, change,
      changePercent: latest.percent, turnoverNpr: latest.turnover,
      advances: null, declines: null, unchanged: null,
      message: "Historical NEPSE index OHLC and turnover from the public community archive. Market breadth is not supplied by this file." + staleNote
    };
  } catch {
    return emptySnapshot(COMMUNITY_SOURCE, "Could not retrieve the community EOD archive. No market figures are being estimated.");
  }
}
export async function getMarketSnapshot(): Promise<MarketSnapshot> {
  const provider = process.env.MARKET_DATA_PROVIDER || "community-eod";
  if (provider === "community-eod") return getCommunityEodSnapshot();
  if (provider === "source-code-mdp") {
    const configured = Boolean(process.env.MDP_API_BASE_URL && process.env.MDP_API_KEY && process.env.MDP_API_SECRET && process.env.MDP_ACCESS_ID);
    return emptySnapshot("Source Code MDP — not connected", configured
      ? "MDP credentials are present, but its subscribed production endpoint and response schemas have not been integrated."
      : "The paid MDP connection is disabled or not configured. CHITRANYA CAPITAL is using its no-cost historical-data path where available.");
  }
  return emptySnapshot("Market data provider not configured", "Choose a supported, properly licensed data source. No market figures are being invented.");
}
