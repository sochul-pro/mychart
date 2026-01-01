import type { OHLCV } from '@/types';
import { sma } from './moving-average';

export interface BollingerBandsResult {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
}

/**
 * Bollinger Bands 볼린저 밴드
 * @param data OHLCV 데이터 배열
 * @param period 기간 (기본값: 20)
 * @param stdDev 표준편차 배수 (기본값: 2)
 * @returns 상단/중간/하단 밴드 값 배열
 */
export function bollingerBands(
  data: OHLCV[],
  period: number = 20,
  stdDev: number = 2
): BollingerBandsResult {
  if (period <= 0 || data.length === 0) {
    return { upper: [], middle: [], lower: [] };
  }

  // 중간선 = SMA
  const middle = sma(data, period);

  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(null);
      lower.push(null);
      continue;
    }

    // 표준편차 계산
    const closes: number[] = [];
    for (let j = 0; j < period; j++) {
      closes.push(data[i - j].close);
    }

    const mean = middle[i]!;
    const squaredDiffs = closes.map((c) => Math.pow(c - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
    const sd = Math.sqrt(variance);

    upper.push(mean + stdDev * sd);
    lower.push(mean - stdDev * sd);
  }

  return { upper, middle, lower };
}
