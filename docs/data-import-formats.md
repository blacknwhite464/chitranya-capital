# User data import formats

CHITRANYA CAPITAL can analyze user-provided files locally in the browser. These files are not uploaded to the application server.

## Stock screener CSV

Use the CSV template button in Stock screener to download the header row.

| Column | Required | Meaning / unit |
|---|---:|---|
| Symbol | Yes | NEPSE trading symbol |
| Company | No | Company display name |
| Sector | No | Sector label; used for exact sector filtering |
| Price | No | Price per share in NPR |
| Daily change % | No | Percentage points, e.g. 2.5 means +2.5% |
| Volume | No | Shares traded for the source's stated session |
| EPS | No | Earnings per share in NPR |
| P/E | No | Price-to-earnings ratio |
| Book value | No | Book value per share in NPR |
| RSI 14 | No | RSI value on a 0–100 scale |
| Dividend yield % | No | Percentage points, e.g. 4 means 4% |
| Market cap | No | Market capitalization in NPR (not NPR millions/billions) |

Leave unavailable values blank. Do not enter zero to mean unknown. The screener treats missing values as unavailable and excludes them when a filter is applied to that field. The source label and data-as-of date are user-entered metadata; verify both against the original provider.

## OHLC history CSV

Use these columns for the technical-analysis workspace:

| Column | Required | Meaning |
|---|---:|---|
| Date | Yes | Timestamp or date; use a consistent sortable format such as YYYY-MM-DD |
| Open | Yes | Opening price in NPR |
| High | Yes | Highest price in NPR |
| Low | Yes | Lowest price in NPR |
| Close | Yes | Closing price in NPR |
| Volume | No | Shares traded in the interval |

Rows must be in strictly increasing chronological order, with no duplicate timestamps. Each row must satisfy High >= max(Open, Close) and Low <= min(Open, Close). Use plain numeric values without thousands separators; keep dates and values consistent with the source's interval and adjustment policy.

## Data handling

- CSV files are parsed in the browser and are not sent to CHITRANYA CAPITAL.
- Maximum file size is 5 MB; each import is limited to 10,000 rows.
- Imported values are not independently verified by the application.
- Corporate actions and adjusted/unadjusted price conventions can materially affect comparisons. Confirm the source's treatment before interpreting results.
- Exported analysis is a calculation over the imported file, not an official market feed or investment recommendation.
