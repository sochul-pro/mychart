import type { OHLCV } from '@/types';

/**
 * ATR (Average True Range) 평균 실제 범위
 * @param data OHLCV 데이터 배열
 * @param period 기간 (기본값: 14)
 * @returns ATR 값 배열 (첫 period 개는 null)
 */
export function atr(data: OHLCV[], period: number = 14): (number | null)[] {
  if (period <= 0 || data.length === 0) return [];

  const trueRanges: number[] = [];

  // True Range 계산
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      // 첫 번째는 High - Low
      trueRanges.push(data[i].high - data[i].low);
    } else {
      // TR = max(H-L, |H-Pc|, |L-Pc|)
      const highLow = data[i].high - data[i].low;
      const highPrevClose = Math.abs(data[i].high - data[i - 1].close);
      const lowPrevClose = Math.abs(data[i].low - data[i - 1].close);
      trueRanges.push(Math.max(highLow, highPrevClose, lowPrevClose));
    }
  }

  const result: (number | null)[] = [];

  // 처음 period-1 개는 null
  for (let i = 0; i < period - 1; i++) {
    result.push(null);
  }

  // 첫 번째 ATR = TR의 SMA
  let atrValue = 0;
  for (let i = 0; i < period; i++) {
    atrValue += trueRanges[i];
  }
  atrValue /= period;
  result.push(atrValue);

  // 이후 ATR = Wilder's smoothing
  // ATR = (prevATR * (period-1) + TR) / period
  for (let i = period; i < data.length; i++) {
    atrValue = (atrValue * (period - 1) + trueRanges[i]) / period;
    result.push(atrValue);
  }

  return result;
}
