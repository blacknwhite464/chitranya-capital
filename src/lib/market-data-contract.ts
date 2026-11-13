export type MarketFeedStatus = "live" | "delayed" | "end_of_day" | "unavailable";

export type MarketSource = {
  id: string;
  name: string;
  authorization: "official" | "licensed" | "user_import";
};

export type MarketQuote = {
  symbol: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  tradedQuantity: number | null;
  tradedValueNpr: number | null;
  tradedAt: string | null;
};

export type MarketSnapshot = {
  status: MarketFeedStatus;
  source: MarketSource | null;
  fetchedAt: string | null;
  sessionDate: string | null;
  index: number | null;
  change: number | null;
  changePercent: number | null;
  turnoverNpr: number | null;
  advances: number | null;
  declines: number | null;
  unchanged: number | null;
  quotes: MarketQuote[];
  message: string;
};

export type MarketProvider = {
  readonly id: string;
  readonly displayName: string;
  getSnapshot(signal?: AbortSignal): Promise<MarketSnapshot>;
};

/**
 * Validate provider data before it enters the application.
 * Values must be finite numbers; missing values stay null rather than being guessed.
 */
export function isFiniteOrNull(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

export function isIsoDateTime(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}
