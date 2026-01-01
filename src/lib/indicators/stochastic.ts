import type { OHLCV } from '@/types';
import { smaFromValues } from './moving-average';

export interface StochasticResult {
  k: (number | null)[]; // Fast %K
  d: (number | null)[]; // Slow %D
}

/**
 * Stochastic Oscillator 스토캐스틱
 * @param data OHLCV 데이터 배열
 * @param kPeriod %K 기간 (기본값: 14)
 * @param dPeriod %D 기간 (기본값: 3)
 * @returns %K, %D 값 배열 (0-100 사이)
 */
export function stochastic(
  data: OHLCV[],
  kPeriod: number = 14,
  dPeriod: number = 3
): StochasticResult {
  if (kPeriod <= 0 || data.length === 0) {
    return { k: [], d: [] };
  }

  const kValues: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < kPeriod - 1) {
      kValues.push(null);
      continue;
    }

    // 기간 내 최고가, 최저가 찾기
    let highestHigh = data[i].high;
    let lowestLow = data[i].low;

    for (let j = 1; j < kPeriod; j++) {
      highestHigh = Math.max(highestHigh, data[i - j].high);
      lowestLow = Math.min(lowestLow, data[i - j].low);
    }

    // %K = (현재 종가 - 최저가) / (최고가 - 최저가) * 100
    const range = highestHigh - lowestLow;
    if (range === 0) {
      kValues.push(50); // 변동이 없으면 중간값
    } else {
      const k = ((data[i].close - lowestLow) / range) * 100;
      kValues.push(k);
    }
  }

  // %D = %K의 SMA
  const validKValues = kValues.filter((v): v is number => v !== null);
  const dSma = smaFromValues(validKValues, dPeriod);

  const dValues: (number | null)[] = [];
  let dIndex = 0;

  for (let i = 0; i < data.length; i++) {
    if (kValues[i] === null) {
      dValues.push(null);
    } else {
      dValues.push(dSma[dIndex++] ?? null);
    }
  }

  return { k: kValues, d: dValues };
}
