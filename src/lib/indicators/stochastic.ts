import type { OHLCV } from '@/types';
import { smaFromValues } from './moving-average';

export interface StochasticResult {
  k: (number | null)[]; // Slow %K
  d: (number | null)[]; // Slow %D
}

/**
 * Slow Stochastic Oscillator 스토캐스틱
 * @param data OHLCV 데이터 배열
 * @param kPeriod %K 기간 (기본값: 14)
 * @param dPeriod %D 기간 (기본값: 3)
 * @param smoothK %K 스무딩 기간 (기본값: 3)
 * @returns Slow %K, Slow %D 값 배열 (0-100 사이)
 *
 * Slow Stochastic:
 * - Raw %K = (종가 - 최저가) / (최고가 - 최저가) × 100
 * - Slow %K = SMA(Raw %K, smoothK)
 * - Slow %D = SMA(Slow %K, dPeriod)
 */
export function stochastic(
  data: OHLCV[],
  kPeriod: number = 14,
  dPeriod: number = 3,
  smoothK: number = 3
): StochasticResult {
  if (kPeriod <= 0 || data.length === 0) {
    return { k: [], d: [] };
  }

  const rawKValues: (number | null)[] = [];

  // Step 1: Raw %K 계산
  for (let i = 0; i < data.length; i++) {
    if (i < kPeriod - 1) {
      rawKValues.push(null);
      continue;
    }

    // 기간 내 최고가, 최저가 찾기
    let highestHigh = data[i].high;
    let lowestLow = data[i].low;

    for (let j = 1; j < kPeriod; j++) {
      highestHigh = Math.max(highestHigh, data[i - j].high);
      lowestLow = Math.min(lowestLow, data[i - j].low);
    }

    // Raw %K = (현재 종가 - 최저가) / (최고가 - 최저가) * 100
    const range = highestHigh - lowestLow;
    if (range === 0) {
      rawKValues.push(50); // 변동이 없으면 중간값
    } else {
      const k = ((data[i].close - lowestLow) / range) * 100;
      rawKValues.push(k);
    }
  }

  // Step 2: Slow %K = SMA(Raw %K, smoothK)
  const validRawK = rawKValues.filter((v): v is number => v !== null);
  const slowKSma = smaFromValues(validRawK, smoothK);

  const slowKValues: (number | null)[] = [];
  let slowKIndex = 0;

  for (let i = 0; i < data.length; i++) {
    if (rawKValues[i] === null) {
      slowKValues.push(null);
    } else {
      slowKValues.push(slowKSma[slowKIndex++] ?? null);
    }
  }

  // Step 3: Slow %D = SMA(Slow %K, dPeriod)
  const validSlowK = slowKValues.filter((v): v is number => v !== null);
  const slowDSma = smaFromValues(validSlowK, dPeriod);

  const slowDValues: (number | null)[] = [];
  let slowDIndex = 0;

  for (let i = 0; i < data.length; i++) {
    if (slowKValues[i] === null) {
      slowDValues.push(null);
    } else {
      slowDValues.push(slowDSma[slowDIndex++] ?? null);
    }
  }

  return { k: slowKValues, d: slowDValues };
}
