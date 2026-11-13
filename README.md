# CHITRANYA CAPITAL

**Smarter Investing. Better Decisions.**  
AI-powered financial intelligence for Nepal's capital market.

CHITRANYA CAPITAL is an independent NEPSE research, analytics and portfolio workspace. The responsive website is the product; no separate native app is required for this phase.

## Product modules

- **Market dashboard:** clear no-feed state; no prices or market breadth are fabricated. Historical context can be added from user-imported files.
- **Stock research:** local company directory imports, per-stock OHLC history, financial statement imports and calculated ratios; no external market-data API.
- **Technical analysis:** SMA, EMA, RSI, MACD, Bollinger Bands, ATR, Fibonacci retracement and classic pivot levels calculated from imported CSV data.
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
- No external market-data API, API key or paid subscription is required. Market figures are not fetched automatically: users import their own verified CSV files and calculations run in the browser. The dashboard clearly states that no live feed is connected.
- CSV analysis, security master, stock history, financial records and portfolio records are processed/stored in the user's browser. They are not automatically synced to a cloud account.
- The AI research notebook stores questions; it does not generate AI answers until a model and evidence-retrieval service are connected.
- Broker, floorsheet, company financials and announcement feeds require verified sources.
- Portfolio unrealized P/L is not calculated without verified current prices.
- User-uploaded data must be checked for its source, reporting period, units and completeness.

## Technology

- Next.js App Router, React and TypeScript
- Tailwind CSS and Recharts
- Zod for validation
- PostgreSQL schema foundation in `docs/database-schema.sql`
- Browser-local CSV import and market calculations; no external market-data provider dependency
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

The website uses a fully offline market-data workflow. Import a security-master CSV and per-stock OHLC CSV files from sources you trust. Files are validated and analyzed in the browser, with local storage and CSV export. There are no market-data network calls or provider credentials. Live quotes, breadth and automatic exchange updates remain unavailable until a future provider is explicitly chosen.

See `docs/market-data-onboarding.md`, `docs/data-import-formats.md`, `docs/account-security.md`, `docs/production-launch-checklist.md` and `docs/product-roadmap.md`.

## Website-only scope

CHITRANYA CAPITAL is being developed as a responsive website. There is no separate native mobile-app deliverable in this project.

## Planned production milestones

1. Improve local CSV import, security master, historical charts and fundamentals analysis; no external market-data API is required.
2. Connect PostgreSQL through secure server-side migrations and repository services.
3. Add user authentication, cloud portfolios, multi-device sync and account recovery.
4. Implement verified security master, historical price storage, scheduled sync and visible source timestamps.
5. Connect evidence retrieval and model-backed bilingual AI research with citations and risk gates.
6. Add licensed floorsheet, company fundamentals, IPO, corporate-action and announcement ingestion.
7. Deploy production monitoring, backups, security controls and mobile app.

## Disclaimer

CHITRANYA CAPITAL is an informational research and analytics product, not a broker or personalized investment adviser. Investing involves risk, including loss of principal. Calculators are mathematical illustrations, not forecasts. AI analysis, when enabled, will remain subject to source quality, freshness and uncertainty.
