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
- **Administrator website:** protected operations dashboard for customer, security-master, market-history, floorsheet, financial-report, announcement and synchronization counts.
- **Website discoverability:** search/social metadata, crawler rules and a configurable sitemap. Email verification, recovery and production database setup remain required.
- **Portfolio:** browser-local buy/sell ledger, weighted-average cost, realized P/L, open-position export, transaction CSV, watchlist, corporate-action ledger, allocation/concentration insights, backup/restore and position-risk calculator.
- **IPO and corporate actions:** source-ready workspace and manually recorded portfolio dividend/bonus/rights events.
- **Financial tools:** SIP, lump-sum and position-sizing calculators.
- **Learning and disclosures:** eight bilingual investing lessons, glossary, methodology, privacy and risk-disclosure pages.

## Data integrity and current limitations

- No fabricated NEPSE prices, indices, movers, broker activity, financial ratios, IPO dates or announcements.
- Market data is disabled until an authorized provider supplies the production endpoint specifications, credentials and permitted-use terms.
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

## Authorized market-data setup

The server reads these environment variables:

```env
MARKET_DATA_PROVIDER=source-code-mdp
MDP_API_BASE_URL=
MDP_API_KEY=
MDP_API_SECRET=
MDP_ACCESS_ID=
MDP_API_VERSION=1.0
MARKET_DATA_MODE=unconfigured
```

Never add provider secrets to `NEXT_PUBLIC_*` variables or commit credentials. The Source Code MDP adapter must be implemented only after receiving the subscribed production endpoint paths, request/response schemas, sample payloads and written permissions for display, storage, derived analytics and AI use. Do not scrape or redistribute data without authorization.

See `docs/market-data-onboarding.md`, `docs/data-import-formats.md` and `docs/product-roadmap.md`.

## Website-only scope

CHITRANYA CAPITAL is being developed as a responsive website. There is no separate native mobile-app deliverable in this project.

## Planned production milestones

1. Complete authorized MDP onboarding and schema-validated market-data adapter.
2. Connect PostgreSQL through secure server-side migrations and repository services.
3. Add user authentication, cloud portfolios, multi-device sync and account recovery.
4. Implement verified security master, historical price storage, scheduled sync and visible source timestamps.
5. Connect evidence retrieval and model-backed bilingual AI research with citations and risk gates.
6. Add licensed floorsheet, company fundamentals, IPO, corporate-action and announcement ingestion.
7. Deploy production monitoring, backups, security controls and mobile app.

## Disclaimer

CHITRANYA CAPITAL is an informational research and analytics product, not a broker or personalized investment adviser. Investing involves risk, including loss of principal. Calculators are mathematical illustrations, not forecasts. AI analysis, when enabled, will remain subject to source quality, freshness and uncertainty.
