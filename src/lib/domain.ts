export type Security = { id: string; symbol: string; name: string; sector: string | null; isin: string | null; listed: boolean };
export type Watchlist = { id: string; name: string; createdAt: string; items: WatchlistItem[] };
export type WatchlistItem = { securityId: string; symbol: string; addedAt: string; note: string | null };
export type Portfolio = { id: string; name: string; baseCurrency: "NPR"; createdAt: string; holdings: Holding[] };
export type Holding = { securityId: string; symbol: string; quantity: string; averageCost: string; updatedAt: string };
export type PortfolioTransaction = { id: string; securityId: string; side: "buy" | "sell"; tradeDate: string; quantity: string; pricePerShare: string; fees: string; broker: string | null; reference: string | null };
export type CorporateAction = { id: string; securityId: string; type: "cash_dividend" | "bonus_share" | "right_share" | "agm" | "other"; announcementDate: string; bookCloseDate: string | null; fiscalYear: string | null; cashPerShare: string | null; bonusPercent: string | null; rightRatio: string | null; sourceUrl: string | null };
export type DataProvenance = { provider: string; sourceTimestamp: string | null; receivedAt: string; status: "live" | "delayed" | "end_of_day" | "unavailable" };
