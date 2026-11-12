# CHITRANYA CAPITAL — implementation roadmap
## Build now (provider-independent)
- [x] Responsive market overview and unavailable-data states
- [x] Server-side market API boundary and MDP environment template
- [x] Domain contracts for securities, watchlists, portfolios and corporate actions
- [x] PostgreSQL schema draft for market history and investment records
- [ ] Authentication and user account lifecycle
- [ ] Security master and symbol search interface
- [ ] Watchlist management
- [ ] Portfolio transaction entry and cost-basis calculations
- [ ] Stock research layout and chart interaction shell
- [ ] AI research contract with citations and risk disclosures
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
