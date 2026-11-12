export type OHLCBar = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number | null;
};

export type IndicatorPoint = { time: string; value: number | null };
export type MACDPoint = { time: string; macd: number | null; signal: number | null; histogram: number | null };
export type BollingerPoint = { time: string; middle: number | null; upper: number | null; lower: number | null };
export type TechnicalAnalysis = {
  sma: Record<number, IndicatorPoint[]>;
  ema: Record<number, IndicatorPoint[]>;
  rsi: IndicatorPoint[];
  macd: MACDPoint[];
  bollinger: BollingerPoint[];
  atr: IndicatorPoint[];
};

const finite = (n: number) => Number.isFinite(n);
function validateBars(bars: OHLCBar[]): void {
  let previous = "";
  for (const bar of bars) {
    if (!bar.time || ![bar.open, bar.high, bar.low, bar.close].every(finite)) {
      throw new Error("OHLC bars must have a timestamp and finite price values.");
    }
    if (bar.high < bar.low || bar.high < Math.max(bar.open, bar.close) ||
        bar.low > Math.min(bar.open, bar.close) || bar.low < 0) {
      throw new Error(`Invalid OHLC range at ${bar.time}.`);
    }
    if (previous && bar.time <= previous) {
      throw new Error("OHLC bars must be in strictly increasing chronological order.");
    }
    previous = bar.time;
  }
}
function points(times: string[], values: (number | null)[]): IndicatorPoint[] {
  return times.map((time, i) => ({ time, value: values[i] ?? null }));
}
function smaValues(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = Array(values.length).fill(null);
  if (!Number.isInteger(period) || period < 1) throw new Error("Indicator periods must be positive integers.");
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}
function emaValues(values: number[], period: number): (number | null)[] {
  if (!Number.isInteger(period) || period < 1) throw new Error("Indicator periods must be positive integers.");
  const out: (number | null)[] = Array(values.length).fill(null);
  if (values.length < period) return out;
  const alpha = 2 / (period + 1);
  let previous = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out[period - 1] = previous;
  for (let i = period; i < values.length; i++) {
    previous = values[i] * alpha + previous * (1 - alpha);
    out[i] = previous;
  }
  return out;
}
function rsiValues(closes: number[], period: number): (number | null)[] {
  if (!Number.isInteger(period) || period < 1) throw new Error("RSI period must be a positive integer.");
  const out: (number | null)[] = Array(closes.length).fill(null);
  if (closes.length <= period) return out;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    gains += Math.max(change, 0);
    losses += Math.max(-change, 0);
  }
  let avgGain = gains / period, avgLoss = losses / period;
  const value = () => avgLoss === 0 ? (avgGain === 0 ? 50 : 100) : 100 - 100 / (1 + avgGain / avgLoss);
  out[period] = value();
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(change, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-change, 0)) / period;
    out[i] = value();
  }
  return out;
}
function macdValues(closes: number[], fast: number, slow: number, signalPeriod: number, times: string[]): MACDPoint[] {
  if (fast >= slow) throw new Error("MACD fast period must be smaller than slow period.");
  const fastEma = emaValues(closes, fast), slowEma = emaValues(closes, slow);
  const raw: (number | null)[] = closes.map((_, i) =>
    fastEma[i] === null || slowEma[i] === null ? null : fastEma[i]! - slowEma[i]!);
  const first = raw.findIndex(v => v !== null);
  const compact = raw.slice(first).map(v => v as number);
  const signalCompact = emaValues(compact, signalPeriod);
  const signal: (number | null)[] = Array(closes.length).fill(null);
  signalCompact.forEach((v, i) => { signal[first + i] = v; });
  return times.map((time, i) => ({
    time, macd: raw[i], signal: signal[i],
    histogram: raw[i] === null || signal[i] === null ? null : raw[i]! - signal[i]!
  }));
}

export function calculateTechnicalAnalysis(
  bars: OHLCBar[],
  options: { smaPeriods?: number[]; emaPeriods?: number[]; rsiPeriod?: number; macd?: { fast?: number; slow?: number; signal?: number }; bollingerPeriod?: number; bollingerStdDev?: number; atrPeriod?: number } = {}
): TechnicalAnalysis {
  validateBars(bars);
  const times = bars.map(b => b.time), closes = bars.map(b => b.close);
  const smaPeriods = options.smaPeriods ?? [20, 50, 200];
  const emaPeriods = options.emaPeriods ?? [12, 26, 50];
  const rsiPeriod = options.rsiPeriod ?? 14;
  const macd = options.macd ?? {};
  const bbPeriod = options.bollingerPeriod ?? 20;
  const deviations = options.bollingerStdDev ?? 2;
  const atrPeriod = options.atrPeriod ?? 14;
  const sma: Record<number, IndicatorPoint[]> = {};
  const ema: Record<number, IndicatorPoint[]> = {};
  for (const p of smaPeriods) sma[p] = points(times, smaValues(closes, p));
  for (const p of emaPeriods) ema[p] = points(times, emaValues(closes, p));
  const middle = smaValues(closes, bbPeriod);
  const bollinger = bars.map((bar, i): BollingerPoint => {
    if (middle[i] === null) return { time: bar.time, middle: null, upper: null, lower: null };
    const slice = closes.slice(i - bbPeriod + 1, i + 1);
    const variance = slice.reduce((sum, value) => sum + (value - middle[i]!) ** 2, 0) / bbPeriod;
    const width = Math.sqrt(variance) * deviations;
    return { time: bar.time, middle: middle[i], upper: middle[i]! + width, lower: middle[i]! - width };
  });
  const trueRanges = bars.map((bar, i) => i === 0 ? bar.high - bar.low :
    Math.max(bar.high - bar.low, Math.abs(bar.high - bars[i - 1].close), Math.abs(bar.low - bars[i - 1].close)));
  const atr = smaValues(trueRanges, atrPeriod);
  return {
    sma, ema, rsi: points(times, rsiValues(closes, rsiPeriod)),
    macd: macdValues(closes, macd.fast ?? 12, macd.slow ?? 26, macd.signal ?? 9, times),
    bollinger, atr: points(times, atr)
  };
}

/** Fibonacci retracement levels from a confirmed high/low range. */
export function fibonacciRetracement(high: number, low: number): Record<string, number> {
  if (!finite(high) || !finite(low) || high < low || low < 0) {
    throw new Error("Fibonacci range requires finite prices with high greater than or equal to low.");
  }
  const range = high - low;
  return { "0%": high, "23.6%": high - range * 0.236, "38.2%": high - range * 0.382,
    "50%": high - range * 0.5, "61.8%": high - range * 0.618, "78.6%": high - range * 0.786, "100%": low };
}

/** Classic floor pivot levels from the previous completed session. */
export function classicPivotLevels(high: number, low: number, close: number): Record<string, number> {
  if (![high, low, close].every(finite) || high < low || low < 0 || close < 0) {
    throw new Error("Pivot calculation requires valid previous-session OHLC prices.");
  }
  const pivot = (high + low + close) / 3;
  return { pivot, r1: 2 * pivot - low, r2: pivot + (high - low), r3: high + 2 * (pivot - low),
    s1: 2 * pivot - high, s2: pivot - (high - low), s3: low - 2 * (high - pivot) };
}
