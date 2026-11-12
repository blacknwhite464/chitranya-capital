# NEPSE market-data provider onboarding

CHITRANYA CAPITAL is preparing to integrate Source Code Pvt. Ltd.'s Market Data Provider (MDP).

## Public documentation currently confirms

- Documentation: https://data.smartwealthpro.com/documentation/
- UAT base URL shown in the documentation: https://uat.sourcecode.com.np
- Required request headers: `ApiKey`, `ApiSecret`, `AccessId`, `ApiVersion`, and `Content-Type: application/json`.
- The documentation describes NEPSE data, indices, live stock data, today's prices, floorsheet, corporate actions, financial reports, ratios and company profiles.

The UAT URL is not assumed to be the production URL. Obtain the production base URL and current endpoint specifications directly from the provider before enabling requests.

## Ask the provider to confirm in writing

1. Production base URL and current API version.
2. Endpoint paths and response schemas for market status, NEPSE index, sub-indices, all stock quotes, historical OHLC, floorsheet, company fundamentals, financial reports, dividends and announcements.
3. Whether the licence permits public display on CHITRANYA CAPITAL's website and future mobile app.
4. Whether historical storage, caching, charting, AI analysis and derived analytics are permitted.
5. Attribution requirements, rate limits, polling guidance, IP allow-listing and service-level terms.
6. Test credentials and a sample response for each subscribed endpoint.
7. Subscription fees and renewal terms.

## Local secret configuration

Copy `.env.example` to `.env.local` and enter the provider-issued values locally:

```env
MARKET_DATA_PROVIDER=source-code-mdp
MDP_API_BASE_URL=
MDP_API_KEY=
MDP_API_SECRET=
MDP_ACCESS_ID=
MDP_API_VERSION=1.0
MARKET_DATA_MODE=unconfigured
```

Never commit `.env.local`, place credentials in `NEXT_PUBLIC_*` variables, or paste API secrets into chat. The repository ignores local environment files.

## Integration rule

Do not guess endpoint paths or field mappings. Implement and test the adapter only after receiving the provider's current production specification and permitted-use terms. Missing data remains null; it must never be represented as zero or a fabricated live quote.
