# CHITRANYA CAPITAL

AI-powered financial intelligence for Nepal's capital market.

## Current status
- Next.js App Router + TypeScript foundation
- Premium responsive dashboard shell
- Market API contract and server-side provider adapter boundary
- Honest unavailable state until an authorized data provider is connected
- No fabricated market prices or demo quotes

## Requirements
- Node.js 20.9+
- npm
- Authorized NEPSE market-data provider account and API documentation

## Local setup
```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```
Open http://localhost:3000.

## Market data configuration
Set the following server-only environment variables in `.env.local` after receiving credentials from an authorized provider:

```env
MARKET_DATA_PROVIDER=
MARKET_DATA_BASE_URL=
MARKET_DATA_API_KEY=
MARKET_DATA_MODE=unconfigured
```

The API key must never use a `NEXT_PUBLIC_` prefix. The provider-specific adapter must be implemented against the vendor's official documentation and permitted use. Do not scrape or redistribute market data without authorization.

## Next milestones
1. Select and contract an authorized data vendor.
2. Implement and test its adapter using official API documentation.
3. Persist licensed quotes and historical data in PostgreSQL.
4. Add charts, screeners, fundamentals, floorsheet and corporate actions.
5. Add AI analysis grounded in verified source data, then portfolio and user accounts.

## Disclaimer
CHITRANYA CAPITAL is a research and analytics product, not a broker or investment adviser. Market data may be live, delayed or end-of-day depending on the provider's licensed service. AI output is informational and is not a guarantee of investment results.
