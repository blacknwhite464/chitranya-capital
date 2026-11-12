# CHITRANYA CAPITAL — implementation roadmap

## Built without a market API
- [x] Responsive dashboard and navigation
- [x] Honest unavailable-data states and server-side market API boundary
- [x] MDP environment template and provider adapter contract
- [x] Domain contracts and PostgreSQL schema draft
- [x] Browser-local watchlist management
- [x] Manual portfolio holdings and invested-cost tracking
- [x] Weighted-average portfolio trade calculation engine (buy/sell fees and realized P/L)
- [x] SIP and lump-sum calculators
- [x] Wire a browser-local chronological trade ledger into the portfolio interface with buy/sell validation, weighted-average cost and realized P/L
- [x] Edit and delete portfolio transactions with full-ledger validation and strict trade-date checks
- [x] Expand learning center into eight bilingual NEPSE investing lessons and searchable glossary
- [x] Add dedicated methodology, privacy and risk-disclosure pages
- [x] Add validated JSON import/export and recovery for browser-local portfolio/watchlist data
- [ ] Authentication and multi-device account lifecycle
- [ ] Complete stock discovery interface backed by a verified security master
- [x] Pure TypeScript technical indicator engine (SMA, EMA, RSI, MACD, Bollinger Bands, ATR, Fibonacci and classic pivots)
- [x] Add browser-local OHLC CSV analysis with close/SMA/EMA, RSI and MACD charts plus Fibonacci and classic pivot levels (user-supplied data only; no live-feed claims)\n- [x] Export locally calculated OHLC indicators to a separate CSV for offline review
- [x] Define typed AI research contract and evidence-reference/risk validation gate
- [x] Add a browser-local bilingual AI research question notebook with templates, save/load/delete and JSON export
- [ ] Implement model-backed retrieval, source ingestion and cited response generation

## After MDP onboarding
- Confirm production base URL, subscribed endpoint paths and response schemas.
- Confirm public and mobile display, historical retention, caching and derived analytics rights.
- Implement and test the provider adapter against vendor sample responses.
- Add scheduled synchronization with rate-limit-aware caching and visible last-sync time.
- Persist normalized records with provider and ingestion timestamps for auditability.
- Enable live values only after schema validation and source timestamp checks.

## Data integrity
- Never use sample or guessed values for live market data.
- Preserve provider timestamps and ingestion timestamps separately.
- Store money and quantities using decimal database types.
- Label live, delayed and end-of-day data distinctly.
- Keep provider credentials server-side; never expose secrets in public environment variables.
- AI outputs distinguish sourced facts, calculations, assumptions and scenarios.
- A visible screen is not considered complete until its interactions, validation, persistence, error states and responsive behavior work.
