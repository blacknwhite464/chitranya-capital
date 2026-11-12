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

const emptySnapshot = (provider: string, message: string): MarketSnapshot => ({
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
  message
});

export async function getMarketSnapshot(): Promise<MarketSnapshot> {
  const provider = process.env.MARKET_DATA_PROVIDER;
  const baseUrl = process.env.MDP_API_BASE_URL;
  const apiKey = process.env.MDP_API_KEY;
  const apiSecret = process.env.MDP_API_SECRET;
  const accessId = process.env.MDP_ACCESS_ID;
  const apiVersion = process.env.MDP_API_VERSION || "1.0";

  if (!provider || !baseUrl || !apiKey || !apiSecret || !accessId) {
    return emptySnapshot(
      "Source Code MDP — not connected",
      "The authorized MDP production endpoint and API credentials are not configured yet. No market figures are being invented."
    );
  }

  // The public MDP documentation confirms the authentication headers, but the
  // vendor must provide the production endpoint and subscribed endpoint schemas.
  // Implement the response adapter only against those confirmed specifications.
  return emptySnapshot(
    "Source Code MDP — credentials configured",
    `MDP configuration detected (API version ${apiVersion}), but the verified production endpoint adapter is awaiting the vendor's subscribed API specification.`
  );
}
