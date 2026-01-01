import type { OHLCV } from '@/types';
import { emaFromValues } from './moving-average';

export interface MACDResult {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
}

/**
 * MACD (Moving Average Convergence Divergence) 이동평균 수렴·확산
 * @param data OHLCV 데이터 배열
 * @param fastPeriod 빠른 EMA 기간 (기본값: 12)
 * @param slowPeriod 느린 EMA 기간 (기본값: 26)
 * @param signalPeriod 시그널 EMA 기간 (기본값: 9)
 * @returns MACD, Signal, Histogram 값 배열
 */
export function macd(
  data: OHLCV[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult {
  if (data.length === 0) {
    return { macd: [], signal: [], histogram: [] };
  }

  const closes = data.map((d) => d.close);

  // EMA 계산
  const fastEma = emaFromValues(closes, fastPeriod);
  const slowEma = emaFromValues(closes, slowPeriod);

  // MACD Line = Fast EMA - Slow EMA
  const macdLine: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (fastEma[i] === null || slowEma[i] === null) {
      macdLine.push(null);
    } else {
      macdLine.push(fastEma[i]! - slowEma[i]!);
    }
  }

  // Signal Line = MACD의 EMA
  const validMacdValues = macdLine.filter((v): v is number => v !== null);
  const signalEma = emaFromValues(validMacdValues, signalPeriod);

  // Signal을 원래 배열 크기에 맞춤
  const signalLine: (number | null)[] = [];
  let signalIndex = 0;

  for (let i = 0; i < data.length; i++) {
    if (macdLine[i] === null) {
      signalLine.push(null);
    } else {
      signalLine.push(signalEma[signalIndex++] ?? null);
    }
  }

  // Histogram = MACD - Signal
  const histogram: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (macdLine[i] === null || signalLine[i] === null) {
      histogram.push(null);
    } else {
      histogram.push(macdLine[i]! - signalLine[i]!);
    }
  }

  return {
    macd: macdLine,
    signal: signalLine,
    histogram,
  };
}
