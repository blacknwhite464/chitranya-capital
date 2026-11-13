# Market-data sources and cost strategy

CHITRANYA CAPITAL does not require a paid MDP subscription to provide historical research tools. The default market snapshot uses a public, MIT-licensed community archive for completed NEPSE sessions. Paid live data remains optional and disabled unless deliberately configured.

## Default: community end-of-day archive

- Dataset: [Nepal Market Data](https://github.com/binayabaral/nepal-market-data)
- Dataset browser: https://binayabaral.github.io/nepal-market-data/
- Index CSV: https://raw.githubusercontent.com/binayabaral/nepal-market-data/main/data/nepse/NEPSE_INDEX.csv
- Security master: https://raw.githubusercontent.com/binayabaral/nepal-market-data/main/data/reference/nepse-symbols.csv
- License: MIT, see [upstream LICENSE](https://github.com/binayabaral/nepal-market-data/blob/main/LICENSE).
- Attribution: Nepal Market Data by Binaya Baral.
- Dataset documentation describes daily-updated NEPSE stock and index CSVs, their fields, missing-session behavior and raw (unadjusted) prices.

This is a third-party community-maintained dataset, not a live NEPSE feed or an exchange endorsement. Its source README says its figures are collected from public sources. CHITRANYA CAPITAL labels these values as historical end-of-day data and displays the source session date. If the archive is old or unavailable, the UI must make that clear and must not present it as today's quote.

### Important data limitations

- No intraday/live quotes, order book, market depth or guaranteed real-time refresh.
- The index CSV supplies index OHLC, percentage change and turnover; it does not supply advances/declines breadth.
- Per-symbol files contain raw traded prices, not corporate-action-adjusted total returns. Bonus shares, rights issues and splits can create misleading apparent price drops. Do not calculate total-return performance across corporate actions without separately verified adjustment data.
- Some securities may not have traded in a recent session; a missing recent row is not a zero price.
- Third-party archive accuracy, completeness and availability are not guaranteed by CHITRANYA CAPITAL.

## Optional paid provider: Source Code MDP

MDP can be reconsidered only if its subscription cost and permitted-use terms make sense. No credentials or paid requests are needed for the default community EOD path.

Official documentation: https://data.smartwealthpro.com/documentation/

Before enabling a paid provider, confirm in writing:
1. Total subscription fees, renewals, taxes and any usage charges.
2. Production base URL and endpoint paths / response schemas.
3. Rights for public website display, caching, historical storage, charting, derived analytics and AI analysis.
4. Attribution, rate limits, polling, IP allow-listing and SLA.
5. Test credentials and representative response payloads.

Do not assume the UAT URL is the production URL or guess endpoint paths.

## Configuration

The default setting is:

```env
MARKET_DATA_PROVIDER=community-eod
```

To deliberately select the paid adapter boundary (not yet implemented), set:

```env
MARKET_DATA_PROVIDER=source-code-mdp
MDP_API_BASE_URL=
MDP_API_KEY=
MDP_API_SECRET=
MDP_ACCESS_ID=
MDP_API_VERSION=1.0
```

All provider credentials are server-side only. Never use `NEXT_PUBLIC_*` variables for secrets or commit `.env.local`.

## Data integrity rules

- Label completed-session values as EOD, never live.
- Show the source and actual session date.
- Preserve missing values as null; never substitute zero.
- Do not calculate breadth from an index-only file.
- Keep user-uploaded data distinct from external archive data.
- Implement additional data fields only against documented, checked schemas.
