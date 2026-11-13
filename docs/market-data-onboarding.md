# Offline market-data workflow

CHITRANYA CAPITAL's market research workspace does not require an external market-data API, paid subscription, API key or automatic data feed.

## How data enters the website

Users import source files directly into the website. The browser parses and validates the files, performs calculations locally and stores supported research datasets in browser storage. The website does not fetch market prices or company records from a third-party endpoint.

Supported workflows:
- Security master CSV: symbol, name, sector, ISIN and listing status.
- Historical OHLC CSV: date, open, high, low, close; optional volume, percentage change and turnover.
- Technical indicators: SMA, EMA, RSI, MACD, Bollinger Bands, ATR, Fibonacci and classic pivots, calculated locally from imported OHLC.
- Portfolio: manual transaction records, cost basis and realized P/L, stored locally.
- Corporate actions: manually entered and source-labelled dividend, bonus and rights events.
- Screener: user-imported security/financial CSV with filters and export.

## Security master CSV

Required columns: `symbol,name,sector`
Optional: `isin,listed`

The import validates symbols, required names/sectors and duplicate symbols. It does not assert that a company is currently listed. The user should record the publisher and effective date.

## Historical OHLC CSV

Required columns: `date,open,high,low,close`
Accepted date aliases include `published_date` and `tradedate`. Optional columns include `per_change`, `traded_quantity`, and `traded_amount`.

Files must be checked for source, symbol, currency, units, date range and corporate-action adjustments before analysis. Prices are not automatically adjusted for bonus issues, rights issues, splits or dividends. The app preserves missing data rather than filling it with zero.

## Local storage and portability

Imported security master and per-symbol OHLC histories are stored in the browser's local storage. They remain on that browser profile and device unless the user exports a copy. Clearing browser storage or changing devices can remove access. Export CSV backups regularly. Do not upload confidential or licensed data unless its terms allow that use.

## Live market data

Live quotes, market depth, official market breadth and automatic exchange updates are intentionally not provided in the no-API version. The dashboard clearly shows that no feed is connected. A manual file import can add historical context but must never be described as live.

## Optional future provider

An external provider can be evaluated later only if the user explicitly chooses one and its cost and permitted-use terms are acceptable. No provider is required for the current build.
