import type { MarketSnapshot } from "@/lib/market";
export type MarketProviderConfig = { baseUrl: string; apiKey: string; apiSecret: string; accessId: string; apiVersion: string };
export type ProviderResult<T> = { data: T; sourceTimestamp: string | null; receivedAt: string };
/** Server-only adapter boundary. Validate vendor payloads before normalization. */
export interface MarketDataProvider { getMarketSnapshot(): Promise<ProviderResult<MarketSnapshot>>; }
