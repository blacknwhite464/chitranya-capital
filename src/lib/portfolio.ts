export type PortfolioTrade = {
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  pricePerShare: number;
  feesNpr?: number;
};

export type PositionSummary = {
  symbol: string;
  quantity: number;
  averageCost: number;
  investedCost: number;
  realizedPnl: number;
  buyQuantity: number;
  sellQuantity: number;
};

export type PortfolioSummary = {
  positions: PositionSummary[];
  totalInvestedCost: number;
  totalRealizedPnl: number;
};

/**
 * Replays a user's own trade ledger in chronological order.
 * Uses weighted-average cost and treats fees as part of buy cost / sell proceeds.
 * It deliberately does not calculate unrealized P&L without a verified market price.
 */
export function calculatePortfolio(trades: PortfolioTrade[]): PortfolioSummary {
  const positions = new Map<string, PositionSummary>();

  for (const trade of trades) {
    const symbol = trade.symbol.trim().toUpperCase();
    const quantity = Number(trade.quantity);
    const price = Number(trade.pricePerShare);
    const fees = Number(trade.feesNpr ?? 0);

    if (!symbol || !Number.isFinite(quantity) || quantity <= 0 ||
        !Number.isFinite(price) || price < 0 ||
        !Number.isFinite(fees) || fees < 0) {
      throw new Error("Every trade needs a symbol, positive quantity, and valid price and fees.");
    }

    const current = positions.get(symbol) ?? {
      symbol, quantity: 0, averageCost: 0, investedCost: 0,
      realizedPnl: 0, buyQuantity: 0, sellQuantity: 0
    };

    if (trade.side === "buy") {
      const totalCost = current.investedCost + quantity * price + fees;
      const nextQuantity = current.quantity + quantity;
      current.quantity = nextQuantity;
      current.investedCost = totalCost;
      current.averageCost = nextQuantity > 0 ? totalCost / nextQuantity : 0;
      current.buyQuantity += quantity;
    } else {
      if (quantity > current.quantity) {
        throw new Error(`Cannot sell ${quantity} shares of ${symbol}; only ${current.quantity} are held.`);
      }
      const allocatedCost = current.averageCost * quantity;
      current.realizedPnl += quantity * price - fees - allocatedCost;
      current.quantity -= quantity;
      current.investedCost = current.quantity * current.averageCost;
      current.sellQuantity += quantity;
      if (current.quantity === 0) {
        current.averageCost = 0;
        current.investedCost = 0;
      }
    }

    positions.set(symbol, current);
  }

  const rows = [...positions.values()].filter(position => position.buyQuantity > 0);
  return {
    positions: rows,
    totalInvestedCost: rows.reduce((sum, position) => sum + position.investedCost, 0),
    totalRealizedPnl: rows.reduce((sum, position) => sum + position.realizedPnl, 0)
  };
}
