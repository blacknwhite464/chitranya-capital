# NEPSE live-data provider review

## Current decision

CHITRANYA CAPITAL remains offline-first. No unofficial NEPSE connector is enabled in production yet.

The open-source projects reviewed are useful technical references, but they do not establish a right for this commercial investment website to collect, store, transform, or redistribute NEPSE data. In particular, the `NepseAPI-Unofficial` project describes its use as educational/research and says commercial use requires authorization. The `nepseman-api` project also says it is unofficial, that data accuracy is not guaranteed, and advises against production trading systems. The `@rumess/nepse-api` package documents disabling TLS certificate verification; CHITRANYA CAPITAL must not do that.

## Integration gate

Before enabling an automated live source, obtain written confirmation that the intended use is permitted, including:

- automated access and request frequency;
- commercial display to website customers;
- caching and historical storage;
- floorsheet and market-depth collection, if needed;
- redistribution, derived analytics, and retention;
- attribution and any fees or technical conditions.

An open-source software license covers the software, not necessarily the exchange data or permission to access and redistribute it.

## Technical requirements for an approved provider

- Server-side only; never expose upstream tokens or credentials to browsers.
- Keep TLS certificate verification enabled.
- Use a stable, documented source adapter implementing `src/lib/market-data-contract.ts`.
- Cache centrally; do not issue upstream requests per website visitor.
- Respect documented rate limits and `Retry-After`; use bounded exponential backoff and stop on repeated 401/403/429 responses.
- Persist source name, fetched timestamp, session date, and original status with every stored snapshot.
- Validate numeric values and timestamps; preserve missing values as null.
- Mark live, delayed, and end-of-day data distinctly. Never infer a live quote from a stale response.
- Fall back to the existing user-imported CSV workflow when the provider is unavailable.
- Do not generate synthetic prices, index values, breadth, floorsheet records, or announcements.

## Candidate review notes

| Project | Useful capability | Concern / decision |
|---|---|---|
| `nepsepy` | Python client for market, price, floorsheet, index and company data; documents request pacing and surfaces rate limits | Unofficial. Obtain permission for commercial use and verify current maintenance, endpoint behavior, and data rights before adoption. |
| `nepseman-api` | Self-hosted REST/WebSocket service and Python/Node clients | Its own disclaimer says unofficial, data accuracy is not guaranteed, and not for production trading systems. Not selected. |
| `@rumess/nepse-api` | Node/TypeScript methods for indices, market, securities and floorsheet | Documentation explicitly recommends disabling TLS verification for certificate issues. Rejected for production use. |
| `NepseAPI-Unofficial` | REST, WebSocket and MCP reference architecture | Repository states educational/research use and that commercial use requires authorization. Not selected without written permission. |

## Next safe step

Keep the provider contract and offline workflows ready. Once an official or licensed provider confirms the permitted commercial scope, implement one adapter behind the server-side cache and validate it with recorded fixtures before enabling it for customers.
