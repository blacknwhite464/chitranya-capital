# CHITRANYA CAPITAL — no-API build scope

This document defines what can be completed before Source Code MDP access is approved.

## Functional without market credentials
- Responsive dashboard shell and navigation.
- Local-browser watchlist management.
- Manual portfolio holding entry and invested-cost tracking.
- Portfolio trade calculation engine using weighted-average cost.
- SIP and lump-sum mathematical calculators.
- Learning content, glossary and methodology pages.
- Data-provider status and empty states that never fabricate market values.
- Clear privacy and investment-risk disclosures.

## Requires licensed market data
- NEPSE index, sub-indices, turnover, breadth and market movers.
- Stock master, quotes, historical OHLCV and chart indicators.
- Financial statements, ratios, valuations and screening results.
- Floorsheet, broker analytics, IPO calendar and corporate actions.
- Portfolio market value and unrealized P/L.
- Any AI answer that makes claims about a listed security or current market conditions.

## Requires additional services / credentials
- Multi-device accounts and cloud-synced portfolios: authentication and database hosting.
- Generative AI answers: model API and a retrieval layer over licensed, dated source data.
- Mobile app: separate mobile client after website workflows are stable.
- Email alerts and scheduled data synchronization: hosting and notification infrastructure.

## Release rule
A module is not marked complete merely because its screen exists. It must have working user interactions, validation, persistence appropriate to its scope, error states, responsive layout and documented data dependencies. Market-dependent screens remain explicitly unavailable until a licensed feed is connected and verified.
