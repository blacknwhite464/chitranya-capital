# CHITRANYA CAPITAL — implementation roadmap

## Built without a market API
- [x] Responsive dashboard and navigation
- [x] Honest unavailable-data states and server-side market API boundary
- [x] MDP environment template and provider adapter contract
- [x] Domain contracts and PostgreSQL schema draft
- [x] Extend PostgreSQL schema for indices, brokers, floorsheet, financial reports, announcements, user preferences, portfolio events and AI research provenance
- [x] Browser-local watchlist management
- [x] Manual portfolio holdings and invested-cost tracking
- [x] Weighted-average portfolio trade calculation engine (buy/sell fees and realized P/L)
- [x] SIP and lump-sum calculators
- [x] Wire a browser-local chronological trade ledger into the portfolio interface with buy/sell validation, weighted-average cost and realized P/L
- [x] Edit and delete portfolio transactions with full-ledger validation and strict trade-date checks
- [x] Expand learning center into eight bilingual NEPSE investing lessons and searchable glossary
- [x] Add dedicated methodology, privacy and risk-disclosure pages
- [x] Add validated JSON import/export and recovery for browser-local portfolio/watchlist data
- [x] Export portfolio transaction history as a spreadsheet-compatible CSV
- [x] Add portfolio transaction-history filtering by stock symbol, transaction date and buy/sell side
- [x] Add browser-local portfolio allocation and concentration insights based on recorded invested cost, with explicit non-market-value labeling
- [x] Add a position-sizing calculator using user-entered capital, risk budget, entry and stop-loss assumptions
- [x] Add an offline stock screener for user-imported CSV stock universes with numeric filters, sector/search filters and filtered CSV export and a downloadable header template, source label and as-of date
- [x] Export calculated open portfolio positions to CSV with share quantity, weighted-average cost, invested cost and realized P/L
- [x] Add website customer registration, sign-in, sign-out and current-session APIs using PostgreSQL, bcrypt password hashes, HttpOnly sessions and database-backed email throttling
- [x] Add responsive website customer account page and navigation link
- [x] Build protected administrator customer directory with account search, suspend/re-enable controls and session revocation for suspended customers
- [x] Add explicit authenticated cloud backup/restore for customer watchlists, trades, corporate-action records and screener presets with server validation
- [x] Add customer account active-session listing and revocation of individual or all other sessions
- [x] Add authenticated password changes with current-password verification and revocation of other sessions\n- [ ] Complete account lifecycle: email verification, password reset, deletion, admin MFA and automatic multi-device session management
- [x] Build browser-local stock discovery directory with CSV import, strict symbol/duplicate validation, sector and text search, filtered export and one-click watchlist additions (source-labelled; not independently verified)
- [ ] Complete stock discovery interface backed by a verified security master
- [x] Pure TypeScript technical indicator engine (SMA, EMA, RSI, MACD, Bollinger Bands, ATR, Fibonacci and classic pivots)
- [x] Add browser-local OHLC CSV analysis with close/SMA/EMA, RSI and MACD charts plus Fibonacci and classic pivot levels (user-supplied data only; no live-feed claims)
- [x] Export locally calculated OHLC indicators to a separate CSV for offline review
- [x] Show ATR 14, MACD and Bollinger Band levels in the uploaded-data analysis summary
- [x] Add Bollinger Band overlays and an optional uploaded-volume chart to the local OHLC workspace
- [x] Define typed AI research contract and evidence-reference/risk validation gate
- [x] Add a browser-local bilingual AI research question notebook with templates, save/load/delete and JSON export
- [x] Add browser-native English and Nepali voice dictation for research questions (subject to browser support and permissions)
- [x] Add a browser-local portfolio corporate-action ledger for manually confirmed cash dividends, bonus shares and rights shares, with edit/delete and CSV export
- [x] Extend portfolio backup to schema version 2 with corporate-action records while retaining version 1 restore compatibility
- [x] Extend portfolio backup to schema version 3 with validated screener presets while retaining version 1 and 2 restore compatibility
- [x] Add browser-local reusable stock screener presets with validated criteria, load/delete and explicit no-live-data state
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
