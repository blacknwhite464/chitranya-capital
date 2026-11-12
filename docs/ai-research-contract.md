# AI research response contract

CHITRANYA CAPITAL must not turn an unsupported model completion into a stock call. The typed contract in `src/lib/ai-research-contract.ts` is the validation boundary for future model output.

## Required response structure

- Symbol and response language (English or Nepali).
- Generation time, source-data timestamp and a plain-language freshness note.
- A conclusion that may explicitly be `insufficient_data`.
- Summary and individually classified claims: sourced fact, calculation or interpretation.
- Evidence records with stable IDs, source names, HTTPS URLs where available, source timestamps and retrieval timestamps.
- Material risks, assumptions, limitations and a visible investment-risk disclaimer.
- Bull, base and bear scenarios only when evidence is sufficient. Every scenario must state its assumptions, catalysts, invalidation conditions and time horizon.
- Reference prices are optional. If supplied, they must identify their calculation/source basis and currency.

## Validation rules

`validateAIResearchResponse` checks required disclosures, evidence-ID references, HTTPS links, scenario assumptions, invalidation conditions and reference-price validity. A directional conclusion cannot pass with an empty evidence set. An insufficient-data response cannot contain directional scenarios.

This validator checks structural provenance, not source truth. Provider adapters must independently validate source identity, timestamps, data entitlements, symbol mapping and numerical consistency before evidence reaches the model.

## Safety requirements

1. Never fabricate NEPSE prices, company fundamentals, broker activity, corporate actions, IPO dates or news.
2. Distinguish sourced facts, deterministic calculations, interpretations and hypothetical scenarios.
3. Never describe a scenario as a guaranteed return or personalized investment instruction.
4. If sources conflict, show the conflict and prefer the relevant official source; do not silently reconcile.
5. Display source timestamps and explain stale or missing inputs.
6. Do not send user portfolio or account data to a model without explicit consent and an approved privacy design.
7. Keep model credentials server-side. Do not place keys in client bundles or public environment variables.
8. Do not generate Buy/Hold/Sell outputs when evidence is insufficient or stale for the question.

## Not enabled yet

The contract is not a connected AI analyst. Model access, retrieval, verified market evidence, account consent and operational monitoring must be implemented before responses are generated in the product.
