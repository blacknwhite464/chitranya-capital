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
- [ ] Wire the trade ledger into the portfolio interface with editable/deletable transactions
- [ ] Expand learning center into complete lessons and glossary
- [ ] Add dedicated methodology, privacy and risk-disclosure pages
- [ ] Add import/export and recovery for browser-local portfolio/watchlist data
- [ ] Authentication and multi-device account lifecycle
- [ ] Complete stock discovery interface backed by a verified security master
- [ ] Stock research chart shell and technical indicator calculations
- [ ] AI research contract, retrieval, citations and risk controls

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
