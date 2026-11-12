export type MarketStatus = "live" | "delayed" | "end_of_day" | "unavailable";
export type MarketSnapshot = {
  provider: string;
  status: MarketStatus;
  asOf: string | null;
  index: number | null;
  change: number | null;
  changePercent: number | null;
  turnoverNpr: number | null;
  advances: number | null;
  declines: number | null;
  unchanged: number | null;
  message: string;
};

export async function getMarketSnapshot(): Promise<MarketSnapshot> {
  const provider = process.env.MARKET_DATA_PROVIDER;
  const baseUrl = process.env.MARKET_DATA_BASE_URL;
  const apiKey = process.env.MARKET_DATA_API_KEY;

  if (!provider || !baseUrl || !apiKey) {
    return {
      provider: "Not connected",
      status: "unavailable",
      asOf: null,
      index: null,
      change: null,
      changePercent: null,
      turnoverNpr: null,
      advances: null,
      declines: null,
      unchanged: null,
      message: "Connect an authorized NEPSE market-data provider to display verified market figures."
    };
  }

  // Provider-specific adapters will be implemented after the selected vendor's API
  // documentation and credentials are supplied. Never guess endpoints or fabricate quotes.
  return {
    provider,
    status: "unavailable",
    asOf: null,
    index: null,
    change: null,
    changePercent: null,
    turnoverNpr: null,
    advances: null,
    declines: null,
    unchanged: null,
    message: "Provider credentials are configured, but its verified API adapter is not implemented yet."
  };
}
