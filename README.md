# CHITRANYA CAPITAL

**Smarter Investing. Better Decisions.**  
AI-powered financial intelligence for Nepal's capital market.

CHITRANYA CAPITAL is an independent NEPSE research, analytics and portfolio workspace. The website is the first product; mobile access follows after the data and account foundations are ready.

## Product modules

- **Market dashboard:** NEPSE index snapshot, turnover and breadth interface. Live values remain unavailable until an authorized market-data provider is connected.
- **Stock research:** company discovery workspace, technical-analysis engine and user-uploaded OHLC analysis.
- **Technical analysis:** SMA, EMA, RSI, MACD, Bollinger Bands, ATR, Fibonacci retracement and classic pivot levels.
- **AI research workspace:** bilingual English/Nepali research notebook, prompt templates, saved questions and browser voice dictation. Model-backed answers are not connected yet.
- **Stock screener:** reusable saved criteria plus a local CSV screener for user-supplied stock-universe data, with sector/search/numeric filters and filtered CSV export.
- **Broker intelligence:** floorsheet analytics workspace awaiting licensed floorsheet data.
- **Customer accounts:** responsive website sign-in/registration page and server-side PostgreSQL account APIs with bcrypt password hashing, opaque HttpOnly sessions and database-backed attempt throttling.
- **Administrator website:** protected operations dashboard plus customer account directory, search, customer suspension and reactivation (administrator accounts are protected).
- **Website discoverability:** search/social metadata, crawler rules and a configurable sitemap. Email verification, recovery and production database setup remain required.
- **Portfolio:** buy/sell ledger, weighted-average cost, realized P/L, open-position export, transaction CSV, watchlist, corporate-action ledger, allocation/concentration insights, local backup/restore, and validated account cloud backup/restore for signed-in customers.
- **IPO and corporate actions:** source-ready workspace and manually recorded portfolio dividend/bonus/rights events.
- **Financial tools:** SIP, lump-sum and position-sizing calculators.
- **Learning and disclosures:** eight bilingual investing lessons, glossary, methodology, privacy and risk-disclosure pages.

## Data integrity and current limitations

- No fabricated NEPSE prices, indices, movers, broker activity, financial ratios, IPO dates or announcements.
- The default market snapshot uses a public, MIT-licensed community dataset for historical end-of-day NEPSE index data. It is unofficial, may be delayed, and is never labelled live. No paid MDP subscription is required for this default path.
- CSV analysis and portfolio records are processed/stored in the user's browser. They are not synced to a cloud account.
- The AI research notebook stores questions; it does not generate AI answers until a model and evidence-retrieval service are connected.
- Broker, floorsheet, company financials and announcement feeds require verified sources.
- Portfolio unrealized P/L is not calculated without verified current prices.
- User-uploaded data must be checked for its source, reporting period, units and completeness.

## Technology

- Next.js App Router, React and TypeScript
- Tailwind CSS and Recharts
- Zod for validation
- PostgreSQL schema foundation in `docs/database-schema.sql`
- Server-side market-provider adapter boundary
- GitHub Actions typecheck and production build workflow

## Local development

Requirements: Node.js 20.9+ and npm.

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open http://localhost:3000.

Run checks:

```powershell
npm run typecheck
npm run lint
npm run build
```

## Market-data source and cost strategy

The default setting is `MARKET_DATA_PROVIDER=community-eod`, using the [Nepal Market Data](https://github.com/binayabaral/nepal-market-data) public MIT-licensed dataset for historical completed-session data. The source is unofficial, not an exchange feed; the UI shows its session date and warns when the archive is stale. It does not provide live quotes or market breadth. Source credit and limitations are documented in `docs/market-data-onboarding.md`.

A paid provider such as Source Code MDP is optional, not a dependency. Reconsider one only after reviewing price and licensing terms. Never add provider secrets to `NEXT_PUBLIC_*` variables or commit credentials.

See `docs/market-data-onboarding.md`, `docs/data-import-formats.md`, `docs/account-security.md`, `docs/production-launch-checklist.md` and `docs/product-roadmap.md`.

## Website-only scope

CHITRANYA CAPITAL is being developed as a responsive website. There is no separate native mobile-app deliverable in this project.

## Planned production milestones

1. Improve the no-cost EOD data path, security master and per-stock historical charts; evaluate paid live-data providers only if cost-effective.
2. Connect PostgreSQL through secure server-side migrations and repository services.
3. Add user authentication, cloud portfolios, multi-device sync and account recovery.
4. Implement verified security master, historical price storage, scheduled sync and visible source timestamps.
5. Connect evidence retrieval and model-backed bilingual AI research with citations and risk gates.
6. Add licensed floorsheet, company fundamentals, IPO, corporate-action and announcement ingestion.
7. Deploy production monitoring, backups, security controls and mobile app.

## Disclaimer

CHITRANYA CAPITAL is an informational research and analytics product, not a broker or personalized investment adviser. Investing involves risk, including loss of principal. Calculators are mathematical illustrations, not forecasts. AI analysis, when enabled, will remain subject to source quality, freshness and uncertainty.
